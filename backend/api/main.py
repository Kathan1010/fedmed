import time
import logging
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from api.limiter import limiter
from api.routes import router
from api.utils import process_manager
from config.config import get_settings
import uvicorn

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load settings
settings = get_settings()


# --- GAP 11 FIX: Lifespan handler for startup/shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("FedMed API starting up")
    yield
    logger.info("FedMed API shutting down")
    process_manager.stop_training()


# Initialize FastAPI app
app = FastAPI(
    title="FedMed API",
    description="Federated Learning Healthcare Analytics API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Attach limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --- GAP 11 FIX: Global exception handler — sanitize all errors ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all. Logs full exception internally, NEVER exposes stack trace to client."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status": 500}
    )


# --- GAP 11 FIX: Request logging middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log method, path, status code, and response time for every request."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.1f}ms)")
    return response


# --- V23 FIX: Request Body Size Limit (1 MB) ---
MAX_REQUEST_SIZE = 1_000_000  # 1 MB

class LimitRequestSizeMiddleware(BaseHTTPMiddleware):
    """Reject requests with bodies larger than MAX_REQUEST_SIZE."""
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            return JSONResponse(
                status_code=413,
                content={"error": "Request body too large. Max 1MB.", "status": 413}
            )
        return await call_next(request)

app.add_middleware(LimitRequestSizeMiddleware)

# --- V6/V7 FIX: Restrictive CORS ---
origins = settings.cors_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
)

# --- V3 FIX: API Key Authentication ---
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    """Verify the API key from the X-API-Key header."""
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    if not secrets.compare_digest(api_key, settings.secret_key):
        raise HTTPException(status_code=403, detail="Invalid API key")

# Unauthenticated health endpoint for Docker/k8s probes
@app.get("/healthz")
async def healthz():
    """Lightweight health probe for container orchestration."""
    return {"status": "ok"}

# Include routes with auth dependency on all endpoints
app.include_router(router, prefix="/api/v1", dependencies=[Depends(verify_api_key)])

if __name__ == "__main__":
    logger.info(f"Starting API Server on {settings.api_host}:{settings.api_port}")
    uvicorn.run(
        "api.main:app", 
        host=settings.api_host, 
        port=settings.api_port, 
        reload=False
    )
