# FedMed — Federated Learning for Privacy-Preserving Healthcare Analytics

A federated learning framework where 3 simulated hospitals collaboratively train a shared neural network **without sharing raw patient data**. Only model weights are transmitted — raw data never leaves each hospital.

---

## Architecture

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

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| FL Framework | Flower | 1.7.0 |
| ML Framework | PyTorch | 2.2.0 |
| Backend API | FastAPI | 0.110.0 |
| API Server | Uvicorn | 0.29.0 |
| Data Validation | Pydantic | 2.6.0 |
| Frontend | React (Vite) | 18.x |
| Styling | TailwindCSS | 3.x |
| Charts | Recharts | 2.x |
| Containerization | Docker + docker-compose | latest |

---

## Supported Data Types

| Data Type | Model | Dataset | Input Shape | Classes |
|---|---|---|---|---|
| `imaging` | CNN (Conv2d) | BloodMNIST (real) | (3, 28, 28) | 8 blood cell types |
| `ehr` | MLP + BatchNorm | UCI Heart Disease (real) | (13,) | 2 (disease yes/no) |
| `lab` | MLP | Breast Cancer Wisconsin (real) | (30,) | 2 (malignant/benign) |
| `genomic` | 1D CNN (Conv1d) | Synthetic DNA sequences | (4, 200) | 2 (mutation yes/no) |
| `wearable` | BiLSTM | Synthetic sensor data | (60, 5) | 3 (normal/arrhythmia/fall) |

---

## Prerequisites

- Python 3.10+
- Node.js 20+
- Docker & docker-compose (for containerized setup)

---

## Setup with Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url> && cd fedmed

# 2. Copy environment file and set your secret key
cp .env.example .env
# Edit .env — set SECRET_KEY and VITE_API_KEY

# 3. Start all services
docker compose up --build

# 4. Open the dashboard
# → http://localhost:3000 (frontend)
# → http://localhost:8000/api/docs (API docs)
```

---

## Setup without Docker (Manual)

```bash
# 1. Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment file
cp .env.example .env
# Edit .env — set SECRET_KEY and VITE_API_KEY

# 4. Start the API (orchestrates server + clients)
python -m api.main

# 5. Start the frontend (in a new terminal)
cd frontend && npm install && npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `FL_SERVER_HOST` | Flower server bind address | `localhost` |
| `FL_SERVER_PORT` | Flower gRPC port | `8080` |
| `API_HOST` | FastAPI bind address | `0.0.0.0` |
| `API_PORT` | FastAPI HTTP port | `8000` |
| `NUM_ROUNDS` | Number of FL rounds | `10` |
| `NUM_CLIENTS` | Number of hospital clients | `3` |
| `LOCAL_EPOCHS` | Training epochs per round | `2` |
| `BATCH_SIZE` | Training batch size | `32` |
| `LEARNING_RATE` | Adam optimizer LR | `0.001` |
| `DATA_TYPE` | Default data type | `imaging` |
| `SECRET_KEY` | API authentication key | **change this** |
| `LOG_LEVEL` | Logging level | `INFO` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

---

## API Documentation

Interactive API docs available at: **http://localhost:8000/api/docs**

| Endpoint | Method | Description |
|---|---|---|
| `/healthz` | GET | Unauthenticated health probe |
| `/api/v1/health` | GET | Health check with disk write test |
| `/api/v1/status` | GET | Training status (idle/training/completed) |
| `/api/v1/metrics` | GET | Per-round accuracy, loss, client metrics |
| `/api/v1/start-training` | POST | Start FL training session |
| `/api/v1/stop-training` | POST | Stop running training |
| `/api/v1/model-info` | GET | Model architecture and parameter count |

All endpoints except `/healthz` require `X-API-Key` header.

---

## Running Tests

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_train.py -v
python -m pytest tests/test_data_loader.py -v
python -m pytest tests/test_api.py -v
```

---

## Project Structure

```
fedmed/
├── server/           # Flower FL server + FedAvg strategy
├── client/           # Flower clients + data loaders (5 types)
├── api/              # FastAPI backend (orchestrator)
├── shared/           # Shared models (5 architectures) + exceptions
├── config/           # Pydantic settings from .env
├── frontend/         # React + Vite + TailwindCSS dashboard
├── tests/            # pytest test suite
├── data/             # Downloaded/generated datasets (gitignored)
├── logs/             # Training metrics + app logs (gitignored)
├── models/           # Saved model checkpoints (gitignored)
├── docker-compose.yml
├── Dockerfile.api / .server / .client
├── requirements.txt
└── README.md
```

---

## Real-World Challenges & Defenses

### Implemented

| Challenge | Defense | Location |
|---|---|---|
| Unequal data sizes | FedAvg weighted by sample count | Built into Flower FedAvg |
| Exploding gradients | `clip_grad_norm_(max_norm=1.0)` | `client/train.py` |
| Client failures mid-round | Defensive metric access, skip incomplete | `server/strategy.py` |
| Model poisoning | Norm-clipping on client updates | `server/strategy.py` |
| Hospital monitoring | Per-client accuracy logged each round | `server/strategy.py` |
| Raw data privacy | Core FL design — only weights transmitted | Entire architecture |
| Overfitting on small data | Dropout in all models | `shared/models/` |

### Future Scope

| Challenge | Defense | Path |
|---|---|---|
| Non-IID / biased data | FedProx (proximal term) | Swap FedAvg → FedProx |
| Privacy from weights | Differential Privacy (Opacus) | Wrap optimizer in train.py |
| Server seeing weights | Secure Aggregation | flwr SecAgg protocol |
| Poisoned updates | Byzantine-robust (Krum, Trimmed Mean) | Custom aggregate_fit |
| Slow hospitals | Async FL | FedAsync strategy |
| HIPAA/GDPR compliance | Audit logging, consent tracking | Extend logs/ |

---

## License

MIT
