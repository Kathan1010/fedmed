# FEDMED — CONTEXT 1: CORE
# Paste this file in EVERY conversation before any other context file.
# This is the foundation. Never skip it.

---

## PROJECT IDENTITY
- Name: FedMed
- Full name: Federated Learning Framework for Privacy-Preserving Distributed Healthcare Analytics
- Purpose: Simulate federated learning where 3 hospitals train a shared neural network without sharing raw data. Only model weights are shared.
- Simulation dataset: MNIST (represents medical image classification)
- Production intent: Architecture must be production-ready even though data is simulated

---

## TECH STACK
| Layer | Technology | Version |
|---|---|---|
| FL Framework | Flower | flwr==1.7.0 |
| ML Framework | PyTorch | torch==2.2.0 |
| Backend API | FastAPI | fastapi==0.110.0 |
| API Server | Uvicorn | uvicorn==0.29.0 |
| Data Validation | Pydantic | pydantic==2.6.0 |
| Frontend | React (via Vite) | 18.x |
| Frontend Build Tool | Vite | 5.x |
| Frontend Styling | TailwindCSS | 3.x |
| Charts | Recharts | 2.x |
| HTTP Client | Axios | 1.x |
| Containerization | Docker + docker-compose | latest |
| Python Version | CPython | 3.10 |
| Node Version | Node.js | 20.x |
| Package Manager (Python) | pip | latest |
| Package Manager (JS) | npm | latest |

---

## COMPLETE FOLDER STRUCTURE
```
fedmed/
├── server/
│   ├── __init__.py
│   ├── main.py
│   ├── strategy.py
│   └── utils.py
├── client/
│   ├── __init__.py
│   ├── client.py
│   ├── train.py
│   └── data_loaders/
│       ├── __init__.py
│       ├── registry.py
│       ├── imaging.py
│       ├── ehr.py
│       ├── lab.py
│       ├── genomic.py
│       └── wearable.py
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── routes.py
│   ├── models.py
│   └── utils.py
├── shared/
│   ├── __init__.py
│   ├── exceptions.py
│   └── models/
│       ├── __init__.py
│       ├── registry.py
│       ├── imaging.py
│       ├── ehr.py
│       ├── lab.py
│       ├── genomic.py
│       └── wearable.py
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── api/client.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   └── Results.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── MetricCard.jsx
│   │       ├── TrainingChart.jsx
│   │       ├── ClientCard.jsx
│   │       └── StatusBadge.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── tailwind.config.js
├── data/
│   ├── hospital_1/
│   ├── hospital_2/
│   └── hospital_3/
├── models/.gitkeep
├── logs/
│   ├── metrics.json
│   └── .gitkeep
├── config/config.py
├── tests/
│   ├── __init__.py
│   ├── test_train.py
│   ├── test_api.py
│   └── test_data_loader.py
├── .env
├── .env.example
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
├── Dockerfile.api
├── requirements.txt
└── README.md
```

---

## ENVIRONMENT VARIABLES

### .env (never commit)
```
FL_SERVER_HOST=localhost
FL_SERVER_PORT=8080
API_HOST=0.0.0.0
API_PORT=8000
NUM_ROUNDS=10
NUM_CLIENTS=3
LOCAL_EPOCHS=2
BATCH_SIZE=32
LEARNING_RATE=0.001
DATA_TYPE=imaging
SECRET_KEY=changethisinproduction
LOG_LEVEL=INFO
METRICS_FILE=logs/metrics.json
MODEL_SAVE_PATH=models/global_model.pt
CORS_ORIGINS=http://localhost:3000
VITE_API_URL=http://localhost:8000
```

### .env.example (commit this, no real values — all keys present, all values empty)
```
FL_SERVER_HOST=
FL_SERVER_PORT=
API_HOST=
API_PORT=
NUM_ROUNDS=
NUM_CLIENTS=
LOCAL_EPOCHS=
BATCH_SIZE=
LEARNING_RATE=
DATA_TYPE=
SECRET_KEY=
LOG_LEVEL=
METRICS_FILE=
MODEL_SAVE_PATH=
CORS_ORIGINS=
VITE_API_URL=
```

### Supported DATA_TYPE values
```
imaging   — Medical image classification (BloodMNIST — real blood cell microscopy)
ehr       — Electronic Health Records (UCI Heart Disease — real patient records)
lab       — Laboratory reports (Breast Cancer Wisconsin — real lab measurements)
genomic   — Genomic sequences (synthetic one-hot encoded DNA)
wearable  — Wearable sensor data (synthetic heart rate / accelerometer time-series)
```

---

## CONFIG FILE

### config/config.py
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All modules import settings via get_settings(). Never hardcode
    any configuration value anywhere in the codebase.
    """

    model_config = SettingsConfigDict(env_file=".env")

    fl_server_host: str
    fl_server_port: int
    api_host: str
    api_port: int
    num_rounds: int
    num_clients: int
    local_epochs: int
    batch_size: int
    learning_rate: float
    data_type: str  # "imaging" | "ehr" | "lab" | "genomic" | "wearable"
    secret_key: str
    log_level: str
    metrics_file: str
    model_save_path: str
    cors_origins: str


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton.

    Returns:
        Settings: Application configuration instance.
    """
    return Settings()
```
- All modules import settings via `get_settings()`
- Never hardcode any value anywhere in the codebase
- `lru_cache` ensures settings are loaded once
- Uses `SettingsConfigDict` — Pydantic V2. Never use deprecated `class Config`

---

## REQUIREMENTS.TXT
```
flwr==1.7.0
torch==2.2.0
torchvision==0.17.0
medmnist==3.0.1
fastapi==0.110.0
uvicorn==0.29.0
pydantic==2.6.0
pydantic-settings==2.2.1
python-dotenv==1.0.1
numpy==1.26.4
pandas==2.2.0
scikit-learn==1.4.0
pytest==8.1.0
pytest-asyncio==0.23.5
httpx==0.27.0
slowapi==0.1.9
```
- `medmnist` — real medical image datasets (BloodMNIST)
- `pandas` — EHR tabular data
- `scikit-learn` — Breast Cancer Wisconsin dataset and preprocessing
- `slowapi` — rate limiting for FastAPI

---

## CUSTOM EXCEPTIONS — shared/exceptions.py
```python
class FedMedError(Exception):
    """Base exception for all FedMed domain errors."""
    pass

class ClientConnectionError(FedMedError):
    """Raised when a FL client fails to connect to the server."""
    pass

class MetricsFileError(FedMedError):
    """Raised when reading or writing the metrics file fails."""
    pass

class ModelNotFoundError(FedMedError):
    """Raised when the saved model file cannot be found."""
    pass

class TrainingAlreadyRunningError(FedMedError):
    """Raised when training is requested but already in progress."""
    pass
```

---

## METRICS.JSON SCHEMA
```json
[
  {
    "round": 1,
    "accuracy": 0.8523,
    "loss": 0.4821,
    "client_accuracies": [0.8412, 0.8601, 0.8556],
    "timestamp": "2024-01-01T10:00:00.000000+00:00"
  }
]
```
- Array of round objects, appended after each round
- Written atomically (temp file + os.replace)
- Timestamps are timezone-aware UTC ISO 8601 with `+00:00` suffix
- Frontend reads via API only, never directly from disk

---

## .gitignore
```
.env
__pycache__/
*.pyc *.pyo *.pyd
.Python
*.pt *.pth
data/
logs/*.json
logs/*.log
node_modules/
build/ dist/
.DS_Store
*.egg-info/
.pytest_cache/
```

---

## .dockerignore
```
.env
.env.*
!.env.example
.git/
.gitignore
__pycache__/
*.pyc *.pyo *.pyd
*.pt *.pth
data/
logs/
node_modules/
build/ dist/
.DS_Store
*.egg-info/
.pytest_cache/
.vscode/ .idea/
README.md
```
