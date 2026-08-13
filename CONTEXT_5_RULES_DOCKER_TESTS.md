# FEDMED — CONTEXT 5: RULES, DOCKER, TESTS, README
# Paste with CONTEXT_1_CORE.md for: Docker, tests, global rules, or README writing.
# Also paste this alongside any other context file — these rules apply to ALL code.

---

## CODE QUALITY RULES (apply to every file in the project)

- Every function has a docstring: one-line summary + Args section + Returns section
- All function arguments have type hints
- All return types annotated
- Max function length: 40 lines — if longer, break into helpers
- Max file length: 200 lines — if longer, split into modules
- No magic numbers — all constants in config via `get_settings()`
- No commented-out code in final version
- No `print()` anywhere — use `logging` module
- Import order: stdlib → third-party → local (blank line between groups)
- All files end with a newline character
- Use `pathlib.Path` for all file paths — never `os.path.join` or string concatenation
- Use f-strings — never `.format()` or `%` formatting
- Variable names: `snake_case`, descriptive, no single letters except loop indices
- Class names: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- No wildcard imports (`from module import *`)
- Every `except` block either re-raises or logs the error — never silent `pass`

---

## LOGGING RULES (apply to every file in the project)

- Logger per module: `logger = logging.getLogger(__name__)`
- Format: `%(asctime)s — %(name)s — %(levelname)s — %(message)s`
- Log to both stdout and `logs/app.log`
- Level from config `LOG_LEVEL`
- Log levels:
  - DEBUG: detailed internal state
  - INFO: normal operation (round start, client connect, model saved, training started)
  - WARNING: recoverable issues (missing file, retry, client returned no metrics)
  - ERROR: failures needing attention (client disconnect, file write failure)
- Never log: model weights, raw data, environment variable values

---

## ERROR HANDLING RULES (apply to every file in the project)

- All file I/O wrapped in try/except with specific exception types
- All network calls wrapped in try/except
- FL client connection failure: retry 3 times with 5-second backoff, then raise `ClientConnectionError`
- Custom exceptions imported from `shared/exceptions.py` — never raise bare `Exception`
- API: never return raw Python exception messages — always sanitize before responding
- Use `datetime.now(timezone.utc)` — NEVER `datetime.utcnow()` (deprecated in Python 3.12)

---

## SECURITY RULES (apply to every file in the project)

- Never log raw patient data or model weights
- `.env` in `.gitignore` AND `.dockerignore`
- NEVER `COPY .env .` in any Dockerfile — secrets injected at runtime via `env_file` in docker-compose
- CORS `allow_headers` explicitly lists: `["Content-Type", "Authorization", "X-Request-ID"]`
- Never use wildcard `"*"` for `allow_headers` when `allow_credentials=True`
- CORS `allow_origins` from config only
- All API inputs validated through Pydantic — no raw dict access
- No `eval()` or `exec()` anywhere
- No `shell=True` in subprocess calls
- Atomic file writes for metrics.json (temp file + `os.replace`)
- `SECRET_KEY` in .env, never hardcoded
- `client_id` validated as int in [0,1,2] before use
- File paths with `pathlib.Path` only
- Docker containers run as non-root user
- Training state uses `threading.Lock` — never bare global boolean flags

---

## CRITICAL IMPLEMENTATION GOTCHAS

These are easy mistakes — always check before writing code:

| Wrong | Correct |
|---|---|
| `fl.client.start_numpy_client(...)` | `fl.client.start_client(..., client=FedMedClient(...).to_client())` |
| `torch.tensor(v)` in set_parameters | `torch.from_numpy(np.copy(v))` |
| `datetime.utcnow()` | `datetime.now(timezone.utc)` |
| `class Config` in Pydantic models | `model_config = SettingsConfigDict(env_file=".env")` |
| `process.env.REACT_APP_*` in Vite | `import.meta.env.VITE_*` |
| Bare global `is_training = True` | `TrainingProcessManager` with `threading.Lock` |
| `COPY .env .` in Dockerfile | Inject via `env_file: .env` in docker-compose |
| `allow_headers=["*"]` with credentials | `allow_headers=["Content-Type", "Authorization", "X-Request-ID"]` |
| `evaluate_res.metrics["accuracy"]` | Check `if evaluate_res.metrics and "accuracy" in evaluate_res.metrics` first |

---

## DOCKER SPECIFICATION

### docker-compose.yml
```yaml
networks:
  fedmed-network:
    driver: bridge

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports: ["8080:8080"]
    volumes: ["./logs:/app/logs", "./models:/app/models"]
    networks: [fedmed-network]
    env_file: .env
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; s=socket.socket(); s.connect(('localhost',8080)); s.close()"]
      interval: 10s
      timeout: 5s
      retries: 5

  client_1:
    build: { context: ., dockerfile: Dockerfile.client }
    command: python client/client.py --client-id 0 --data-type ${DATA_TYPE:-imaging}
    depends_on: { server: { condition: service_healthy } }
    networks: [fedmed-network]
    env_file: .env
    volumes: ["./data:/app/data"]

  client_2:
    build: { context: ., dockerfile: Dockerfile.client }
    command: python client/client.py --client-id 1 --data-type ${DATA_TYPE:-imaging}
    depends_on: { server: { condition: service_healthy } }
    networks: [fedmed-network]
    env_file: .env
    volumes: ["./data:/app/data"]

  client_3:
    build: { context: ., dockerfile: Dockerfile.client }
    command: python client/client.py --client-id 2 --data-type ${DATA_TYPE:-imaging}
    depends_on: { server: { condition: service_healthy } }
    networks: [fedmed-network]
    env_file: .env
    volumes: ["./data:/app/data"]

  api:
    build: { context: ., dockerfile: Dockerfile.api }
    ports: ["8000:8000"]
    volumes: ["./logs:/app/logs", "./models:/app/models"]
    networks: [fedmed-network]
    env_file: .env
    depends_on: [server]

  frontend:
    build: { context: ./frontend }
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on: [api]
```

### Dockerfile.server
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ ./server/
COPY shared/ ./shared/
COPY config/ ./config/
RUN mkdir -p logs models
RUN chown -R appuser:appuser /app
USER appuser
CMD ["python", "server/main.py"]
```

### Dockerfile.client
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY client/ ./client/
COPY shared/ ./shared/
COPY config/ ./config/
RUN mkdir -p data
RUN chown -R appuser:appuser /app
USER appuser
CMD ["python", "client/client.py"]
```

### Dockerfile.api
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./api/
COPY shared/ ./shared/
COPY config/ ./config/
RUN mkdir -p logs models
RUN chown -R appuser:appuser /app
USER appuser
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### frontend/Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

Key rules:
- No Dockerfile contains `COPY .env .` — secrets via `env_file` only
- All containers run as non-root `appuser`
- `COPY shared/` included in server, client, and api Dockerfiles
- Clients use `depends_on: server: condition: service_healthy` to wait for server

---

## TESTS SPECIFICATION

### tests/test_train.py
- Import `ImagingModel` from `shared.models.imaging` (or use `get_model("imaging")`)
- Test `train()` returns dict with keys `train_loss` and `train_accuracy`
- Test `evaluate()` returns tuple of two floats
- Test accuracy between 0.0 and 1.0
- Use small dummy DataLoader with 10 random samples, correct input shape for imaging model

### tests/test_data_loader.py
- Test `load_data(0, "imaging")` returns tuple of two DataLoaders
- Test each partition has correct relative size
- Test `load_data(3, "imaging")` raises `ValueError`
- Test `load_data(0, "unknown_type")` raises `ValueError`

### tests/test_api.py
- Use `httpx.AsyncClient` with FastAPI app
- Test `GET /health` returns 200
- Test `GET /api/v1/metrics` returns 200 even when metrics.json missing
- Test `GET /api/v1/metrics` response has keys: `rounds`, `total_rounds_completed`, `current_accuracy`, `current_loss`
- Test `GET /api/v1/status` returns valid StatusResponse shape with keys: `status`, `current_round`, `total_rounds`, `connected_clients`
- All async tests use `pytest` + `pytest-asyncio`

---

## README STRUCTURE

README.md must contain these sections in exact order:
1. Project title + one-line description
2. Architecture diagram (ASCII — see below)
3. Tech stack table
4. Prerequisites
5. Setup with Docker (preferred)
6. Setup without Docker (manual)
7. Environment variables explanation
8. API documentation link (`http://localhost:8000/api/docs`)
9. Running tests
10. Project structure overview
11. Real-world challenges and how FedMed addresses them
12. Future scope
13. License

---

## ASCII ARCHITECTURE DIAGRAM (for README)

```
┌─────────────┐    weights    ┌─────────────────────────────┐
│  Hospital 1 │──────────────▶│                             │
│  (Client 0) │◀──────────────│     FedMed FL Server        │
└─────────────┘               │   (FedAvg Aggregation)      │
                              │                             │
┌─────────────┐    weights    │   logs/metrics.json         │
│  Hospital 2 │──────────────▶│                             │
│  (Client 1) │◀──────────────└──────────────┬──────────────┘
└─────────────┘                              │ read
                                             ▼
┌─────────────┐               ┌─────────────────────────────┐
│  Hospital 3 │──────────────▶│      FastAPI Backend        │
│  (Client 2) │◀──────────────│   localhost:8000            │
└─────────────┘               └──────────────┬──────────────┘
                                             │ HTTP
                                             ▼
                              ┌─────────────────────────────┐
                              │     React Dashboard         │
                              │   localhost:3000            │
                              └─────────────────────────────┘
NOTE: Raw patient data never leaves each hospital.
Only model weights are transmitted.
```

---

## REAL-WORLD CHALLENGES TABLE (for README section 11)

### Implemented in current codebase
| Challenge | Defense | Where |
|---|---|---|
| Unequal data sizes | FedAvg weighted averaging by sample count | Built into Flower FedAvg |
| Exploding gradients | Gradient clipping max_norm=1.0 | client/train.py |
| Client failures mid-round | Defensive metric access, skip incomplete clients | server/strategy.py |
| Individual hospital monitoring | Per-client accuracy logged each round | server/strategy.py |
| Raw data never transmitted | Core FL design — weights only | Entire architecture |
| Overfitting on small datasets | Dropout layers in all models | shared/models/ |

### Future scope (for README section 12)
| Challenge | Defense | Path |
|---|---|---|
| Non-IID / biased data | FedProx (proximal term prevents drift) | Swap FedAvg → FedProx in strategy.py |
| Privacy leakage from weights | Differential Privacy (add calibrated noise) | Add `opacus`, wrap optimizer in train.py |
| Server seeing individual weights | Secure Aggregation (encrypt before send) | flwr SecAgg protocol |
| Poisoned weight updates | Byzantine-robust aggregation (Krum, Trimmed Mean) | Custom aggregate_fit in strategy.py |
| Slow / heterogeneous hospitals | Async FL (don't wait for slowest client) | Switch to FedAsync strategy |
| Regulatory compliance (HIPAA/GDPR) | Audit logging, consent tracking, DPA | Extend logs/ with immutable audit trail |

---

## FINAL CHECKLIST — run through this before submitting any file

- [ ] Config via `get_settings()` — no hardcoded values
- [ ] `pathlib.Path` for all file paths
- [ ] Docstring on every function (summary, Args, Returns)
- [ ] Type hints on all args and return values
- [ ] `logging` not `print`
- [ ] File I/O in try/except with specific exceptions
- [ ] Custom exceptions from `shared/exceptions.py`
- [ ] All inputs validated before use
- [ ] No `shell=True` in subprocess
- [ ] Containers run as non-root
- [ ] No `COPY .env` in Dockerfiles
- [ ] Atomic writes for shared files
- [ ] CORS: explicit headers, no wildcards with credentials
- [ ] All API responses via Pydantic models
- [ ] Frontend polls don't block
- [ ] setInterval cleared on component unmount
- [ ] Loading + error states on all async UI components
- [ ] `datetime.now(timezone.utc)` not `datetime.utcnow()`
- [ ] `fl.client.start_client()` with `.to_client()` — not `start_numpy_client`
- [ ] `torch.from_numpy(np.copy(v))` in set_parameters — not `torch.tensor(v)`
- [ ] `SettingsConfigDict` — not `class Config` in Pydantic V2
- [ ] `import.meta.env.VITE_*` in frontend — not `process.env.REACT_APP_*`
- [ ] `threading.Lock` for training state — not bare global flag
- [ ] Defensive metric access in aggregate_evaluate — check for None/missing keys
- [ ] Model imported from `shared/models/registry.py` — never redefined elsewhere
