# FEDMED — CONTEXT 3: API
# Paste with CONTEXT_1_CORE.md when working on: api/

---

## PYDANTIC SCHEMAS — api/models.py

```python
from pydantic import BaseModel, Field


class RoundMetric(BaseModel):
    """Metrics for a single FL training round."""
    round: int = Field(..., ge=1, description="Round number")
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Average accuracy")
    loss: float = Field(..., ge=0.0, description="Average loss")
    client_accuracies: list[float] = Field(..., description="Per-client accuracies")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")


class MetricsResponse(BaseModel):
    """Response schema for GET /api/v1/metrics."""
    rounds: list[RoundMetric]
    total_rounds_completed: int
    current_accuracy: float | None = None
    current_loss: float | None = None


class StatusResponse(BaseModel):
    """Response schema for GET /api/v1/status."""
    status: str           # "idle" | "training" | "completed"
    current_round: int
    total_rounds: int
    connected_clients: int


class ModelInfoResponse(BaseModel):
    """Response schema for GET /api/v1/model-info."""
    architecture: str
    total_parameters: int
    model_size_kb: float
    save_path: str


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    error: str
    status: int
```

---

## API ROUTES — api/routes.py

All routes prefixed `/api/v1/`. All inputs validated via Pydantic. All outputs use response models above.

```
GET  /api/v1/status
     → StatusResponse
     Read current round from len(metrics.json rounds)
     status = "completed" if rounds == NUM_ROUNDS
            | "training"  if rounds > 0
            | "idle"      otherwise

GET  /api/v1/metrics
     → MetricsResponse
     Read logs/metrics.json via read_metrics_file()
     Return empty rounds list if file missing — NEVER raise error to client
     current_accuracy = last round accuracy if rounds exist, else None
     current_loss = last round loss if rounds exist, else None

POST /api/v1/start-training
     → {"message": "Training started", "status": 200}
     Uses TrainingProcessManager (thread-safe, Lock-based)
     Raises 409 Conflict if training already running
     subprocess.Popen starts server/main.py — NO shell=True
     Rate limited: 30/minute

GET  /api/v1/model-info
     → ModelInfoResponse
     Import model from shared.models.registry via get_model(data_type)
     total_parameters = sum(p.numel() for p in model.parameters())
     model_size_kb from calculate_model_size(MODEL_SAVE_PATH)
```

### Rate limits (slowapi)
- `POST /api/v1/start-training`: 30/minute
- All other endpoints: 60/minute

---

## API MAIN — api/main.py

```python
from contextlib import asynccontextmanager
import time, logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from config.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("FedMed API starting up")
    yield
    logger.info("FedMed API shutting down")
    if hasattr(app.state, "training_manager"):
        app.state.training_manager.cleanup()


app = FastAPI(
    title="FedMed API",
    description="Federated Learning Healthcare Analytics API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    # NEVER use wildcard "*" with allow_credentials=True
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"error": "Rate limit exceeded. Try again later.", "status": 429})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all. Logs full exception internally, NEVER exposes stack trace to client."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal server error", "status": 500})


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log method, path, status code, and response time for every request."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.1f}ms)")
    return response


@app.get("/health")
async def health_check():
    """Health check verifying API and disk write access are functional.
    Returns dict with overall status and component checks.
    """
    from pathlib import Path
    health = {"status": "ok", "checks": {}}
    try:
        log_dir = Path("logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        test_file = log_dir / ".health_check"
        test_file.write_text("ok")
        test_file.unlink()
        health["checks"]["disk_write"] = "ok"
    except OSError:
        health["status"] = "degraded"
        health["checks"]["disk_write"] = "failed"
    return health
```

---

## API UTILS — api/utils.py

```python
def read_metrics_file() -> list[dict]:
    """Read metrics from disk safely.
    Returns [] on missing file, empty file, malformed JSON, or non-list content.
    Never raises to caller.

    Returns:
        List of round metric dicts, or [] on any error.
    """
    settings = get_settings()
    metrics_path = Path(settings.metrics_file)
    try:
        if not metrics_path.exists():
            return []
        content = metrics_path.read_text(encoding="utf-8").strip()
        if not content:
            return []
        data = json.loads(content)
        if not isinstance(data, list):
            logger.warning(f"Metrics file contains non-list data: {type(data)}")
            return []
        return data
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning(f"Failed to read metrics file: {exc}")
        return []


def calculate_model_size(path: str) -> float:
    """Return model file size in KB, or 0.0 if file missing.

    Args:
        path: Path to the saved model file.

    Returns:
        Size in KB as float.
    """
    model_path = Path(path)
    return model_path.stat().st_size / 1024.0 if model_path.exists() else 0.0


class TrainingProcessManager:
    """Thread-safe manager for the FL training subprocess.

    Uses threading.Lock to prevent race conditions when multiple
    API requests attempt to start training simultaneously.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._process: subprocess.Popen | None = None

    @property
    def is_training(self) -> bool:
        """True if subprocess is alive. Cleans up exited processes."""
        with self._lock:
            if self._process is None:
                return False
            if self._process.poll() is not None:
                logger.info(f"Training process (PID {self._process.pid}) exited with code {self._process.poll()}")
                self._process = None
                return False
            return True

    def start_training(self) -> int:
        """Start training subprocess. Returns PID.

        Raises:
            TrainingAlreadyRunningError: If training is in progress.
        """
        with self._lock:
            if self._process is not None and self._process.poll() is None:
                raise TrainingAlreadyRunningError("Training is already in progress")
            self._process = subprocess.Popen(
                ["python", "server/main.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                # NO shell=True ever
            )
            logger.info(f"Training started with PID {self._process.pid}")
            return self._process.pid

    def cleanup(self) -> None:
        """Terminate training process during shutdown. Prevents zombie processes."""
        with self._lock:
            if self._process is not None and self._process.poll() is None:
                logger.info(f"Terminating training process (PID {self._process.pid})")
                self._process.terminate()
                try:
                    self._process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    self._process.kill()
                    logger.warning(f"Force-killed training process (PID {self._process.pid})")
                self._process = None
```

---

## HTTP STATUS CODES
- 200: success
- 400: bad request (invalid input)
- 404: resource not found
- 409: conflict (training already running)
- 429: rate limit exceeded
- 500: internal server error (never expose stack trace)

---

## SECURITY RULES (API-specific)
- CORS `allow_headers` explicitly lists headers — never use wildcard `"*"` with `allow_credentials=True`
- CORS `allow_origins` from config only, never hardcoded
- All API inputs validated through Pydantic — no raw dict access
- `SECRET_KEY` in .env, never in code
- No `eval()` or `exec()` anywhere
- No `shell=True` in any subprocess call
- Global exception handler sanitizes all error messages before returning to client
- Rate limiting on all endpoints via slowapi
- Training state uses `threading.Lock` — never bare global boolean flags
