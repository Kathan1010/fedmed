# FEDMED — CONTEXT 2: FEDERATED LEARNING
# Paste with CONTEXT_1_CORE.md when working on: shared/models/, client/, server/

---

## MODEL ARCHITECTURE — MULTI DATA TYPE

All models defined ONCE in `shared/models/`. Imported everywhere via `get_model(data_type)`. Never redefine in multiple places.
All models use: CrossEntropyLoss + Adam optimizer + Dropout.

### shared/models/registry.py
```python
from shared.models.imaging import ImagingModel
from shared.models.ehr import EHRModel
from shared.models.lab import LabModel
from shared.models.genomic import GenomicModel
from shared.models.wearable import WearableModel

MODEL_REGISTRY: dict[str, type] = {
    "imaging": ImagingModel,
    "ehr": EHRModel,
    "lab": LabModel,
    "genomic": GenomicModel,
    "wearable": WearableModel,
}

def get_model(data_type: str) -> nn.Module:
    """Return instantiated model for the given data type.

    Args:
        data_type: One of 'imaging', 'ehr', 'lab', 'genomic', 'wearable'.

    Returns:
        Instantiated nn.Module.

    Raises:
        ValueError: If data_type is not in MODEL_REGISTRY.
    """
    if data_type not in MODEL_REGISTRY:
        raise ValueError(f"Unknown data type: {data_type}. Must be one of {list(MODEL_REGISTRY.keys())}")
    return MODEL_REGISTRY[data_type]()
```

### shared/models/imaging.py — CNN for BloodMNIST
```python
class ImagingModel(nn.Module):
    """CNN for medical blood cell image classification.
    Uses BloodMNIST — real microscopy images of blood cells (28x28 RGB → 8 classes).

    Architecture: Conv2d(3,16) → ReLU → MaxPool → Conv2d(16,32) → ReLU → MaxPool →
                  Flatten → Linear(1568,128) → ReLU → Dropout(0.2) → Linear(128,8)
    """
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 7 * 7, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 8),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))
```
- Input: (batch, 3, 28, 28) — RGB BloodMNIST microscopy images
- Output: 8 classes (basophil, eosinophil, erythroblast, ig, lymphocyte, monocyte, neutrophil, platelet)

### shared/models/ehr.py — MLP for UCI Heart Disease
```python
class EHRModel(nn.Module):
    """MLP for tabular EHR classification.
    Uses UCI Heart Disease (Cleveland) dataset (13 features → 2 classes).

    Architecture: Linear(13,64) → ReLU → BatchNorm → Dropout(0.3) →
                  Linear(64,32) → ReLU → Dropout(0.3) → Linear(32,2)
    """
    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(13, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 2),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
```
- Input: 13 features (age, sex, chest_pain_type, resting_bp, cholesterol, fasting_blood_sugar, rest_ecg, max_heart_rate, exercise_angina, oldpeak, slope, ca, thal)
- Output: 2 classes (heart disease present / absent)

### shared/models/lab.py — MLP for Breast Cancer Wisconsin
```python
class LabModel(nn.Module):
    """MLP for lab report tumor diagnosis.
    Uses sklearn Breast Cancer Wisconsin dataset (30 features → 2 classes).

    Architecture: Linear(30,64) → ReLU → Dropout(0.2) →
                  Linear(64,32) → ReLU → Dropout(0.2) → Linear(32,2)
    """
    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(30, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 2),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
```
- Input: 30 features (radius, texture, perimeter, area, smoothness, compactness, etc. — mean/SE/worst)
- Output: 2 classes (malignant / benign)

### shared/models/genomic.py — 1D CNN for DNA sequences
```python
class GenomicModel(nn.Module):
    """1D CNN for genomic sequence classification.
    Synthetic one-hot encoded DNA sequences (4 channels x 200 length → 2 classes).

    Architecture: Conv1d(4,32) → ReLU → MaxPool1d → Conv1d(32,64) → ReLU →
                  AdaptiveAvgPool1d(10) → Flatten → Linear(640,64) → ReLU → Dropout(0.3) → Linear(64,2)
    """
    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv1d(4, 32, kernel_size=7, padding=3),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(10),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(640, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 2),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))
```
- Input: (batch, 4, 200) — one-hot encoded DNA (A=[1,0,0,0], T=[0,1,0,0], G=[0,0,1,0], C=[0,0,0,1])
- Output: 2 classes (mutation present / absent)

### shared/models/wearable.py — Bidirectional LSTM
```python
class WearableModel(nn.Module):
    """Bidirectional LSTM for wearable sensor time-series classification.
    Synthetic heart rate / accelerometer data (60 timesteps x 5 sensors → 3 classes).

    Architecture: BiLSTM(5, 64, 2 layers) → Linear(128,32) → ReLU → Dropout(0.3) → Linear(32,3)
    """
    def __init__(self) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=5,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.2,
            bidirectional=True,
        )
        self.classifier = nn.Sequential(
            nn.Linear(128, 32),  # 64 * 2 bidirectional
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 3),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        return self.classifier(last_hidden)
```
- Input: (batch, 60, 5) — 60 timesteps × 5 sensors (heart_rate, spo2, accel_x, accel_y, accel_z)
- Output: 3 classes (normal / arrhythmia / fall_detected)

### Model summary table
| data_type | Model | Input Shape | Output | Dataset |
|---|---|---|---|---|
| imaging | CNN (Conv2d) | (3,28,28) | 8 classes | BloodMNIST (real) |
| ehr | MLP + BatchNorm | (13,) | 2 classes | UCI Heart Disease (real) |
| lab | MLP | (30,) | 2 classes | Breast Cancer Wisconsin (real) |
| genomic | 1D CNN (Conv1d) | (4,200) | 2 classes | Synthetic DNA |
| wearable | BiLSTM | (60,5) | 3 classes | Synthetic sensor |

---

## DATA LOADERS — MULTI DATA TYPE

All loaders in `client/data_loaders/`. Selected via registry pattern.

### client/data_loaders/registry.py
```python
def load_data(client_id: int, data_type: str) -> tuple[DataLoader, DataLoader]:
    """Load train and test data for the given client and data type.

    Args:
        client_id: Hospital identifier (0, 1, or 2).
        data_type: One of 'imaging', 'ehr', 'lab', 'genomic', 'wearable'.

    Returns:
        Tuple of (train_loader, test_loader).

    Raises:
        ValueError: If client_id not in [0,1,2] or data_type is unknown.
    """
```
- Maps data_type string → loader function
- Validates client_id in [0,1,2] and data_type in LOADER_REGISTRY before calling loader

### client/data_loaders/imaging.py — BloodMNIST
```python
def load_imaging_data(client_id: int) -> tuple[DataLoader, DataLoader]:
```
- Uses `medmnist.BloodMNIST` — auto-downloads real blood cell microscopy images
- ~11,959 train samples split into 3 equal partitions via `torch.utils.data.Subset`
- Each client uses full ~3,421 test set
- Transforms: `ToTensor() → Normalize((0.5,), (0.5,))`
- Returns RGB tensors shape (3, 28, 28), 8 classes

### client/data_loaders/ehr.py — UCI Heart Disease
```python
def load_ehr_data(client_id: int) -> tuple[DataLoader, DataLoader]:
```
- Loads UCI Heart Disease (Cleveland) CSV — real patient records, 303 rows
- 13 features, binary target (heart disease present/absent)
- ~101 rows per hospital, 20% test split per hospital
- Augments with Gaussian noise (std=0.05) to reach ~500 samples per hospital
- Normalizes with StandardScaler per hospital

### client/data_loaders/lab.py — Breast Cancer Wisconsin
```python
def load_lab_data(client_id: int) -> tuple[DataLoader, DataLoader]:
```
- Uses `sklearn.datasets.load_breast_cancer()` — built-in, no download needed
- 30 features, binary target (malignant/benign), 569 total rows
- ~190 rows per hospital, 20% test split per hospital
- Normalizes with StandardScaler per hospital

### client/data_loaders/genomic.py — Synthetic DNA
```python
def load_genomic_data(client_id: int) -> tuple[DataLoader, DataLoader]:
```
- Generates synthetic DNA sequences of length 200, one-hot encoded
- Input tensor shape: (4, 200)
- Binary target: mutation present / absent; positive class has detectable motifs
- 4500 total samples → 1500 per hospital, 500 shared test set

### client/data_loaders/wearable.py — Synthetic Sensor
```python
def load_wearable_data(client_id: int) -> tuple[DataLoader, DataLoader]:
```
- Generates synthetic time-series: 60 timesteps × 5 sensors
- Normal: stable signals + mild noise; Arrhythmia: irregular heart rate; Fall: spike then flat
- 3 classes, 4500 total samples → 1500 per hospital, 500 shared test set

### Common rules for ALL loaders
- Return `(train_loader, test_loader)` with `batch_size` from config
- `shuffle=True` train, `shuffle=False` test
- `num_workers=0` on Windows, `num_workers=2` on Linux/macOS
- `pin_memory=True` when CUDA available
- Each hospital uses a different random seed to simulate non-identical data distributions
- Log data split size and data type using Python logging

---

## TRAINING FUNCTIONS — client/train.py

```python
def train(model: nn.Module, trainloader: DataLoader, epochs: int, device: str) -> dict:
    """Train model locally for one FL round.

    Args:
        model: PyTorch model to train.
        trainloader: DataLoader for local training data.
        epochs: Number of local epochs.
        device: 'cuda' or 'cpu'.

    Returns:
        Dict with keys 'train_loss' (float) and 'train_accuracy' (float).
    """
```
- Move model to device before training
- CrossEntropyLoss + Adam optimizer (lr from config)
- Set `model.train()` before loop
- Gradient clipping: `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)`
- Calculate accuracy as correct/total over full epoch

```python
def evaluate(model: nn.Module, testloader: DataLoader, device: str) -> tuple[float, float]:
    """Evaluate model on local test data.

    Args:
        model: PyTorch model to evaluate.
        testloader: DataLoader for local test data.
        device: 'cuda' or 'cpu'.

    Returns:
        Tuple of (loss, accuracy) as floats.
    """
```
- Set `model.eval()` before loop
- Use `torch.no_grad()` context
- Loss = average CrossEntropyLoss over all batches
- Accuracy = correct / total samples

```python
def get_device() -> str:
    """Return 'cuda' if available, else 'cpu'. Logs the selected device."""
```

---

## FLOWER CLIENT — client/client.py

```python
class FedMedClient(fl.client.NumPyClient):
    """Flower NumPyClient for a single hospital node.

    Args:
        client_id: Integer identifier (0, 1, or 2) for this hospital.
        data_type: Type of healthcare data to load and train on.
    """

    def __init__(self, client_id: int, data_type: str) -> None:
        self.client_id = client_id
        self.data_type = data_type
        self.device = get_device()
        self.model = get_model(data_type).to(self.device)
        self.trainloader, self.testloader = load_data(client_id, data_type)

    def get_parameters(self, config: dict) -> list[np.ndarray]:
        """Return model parameters as list of numpy arrays."""
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters: list[np.ndarray]) -> None:
        """Load parameters into model.
        Uses torch.from_numpy(np.copy(v)) — preserves dtypes, avoids shared memory.
        """
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = {k: torch.from_numpy(np.copy(v)) for k, v in params_dict}
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters: list[np.ndarray], config: dict) -> tuple:
        """Train locally. Returns (updated_params, dataset_size, metrics_dict)."""
        self.set_parameters(parameters)
        settings = get_settings()
        metrics = train(self.model, self.trainloader, epochs=settings.local_epochs, device=self.device)
        return self.get_parameters(config={}), len(self.trainloader.dataset), metrics

    def evaluate(self, parameters: list[np.ndarray], config: dict) -> tuple:
        """Evaluate locally. Returns (loss, dataset_size, metrics_dict)."""
        self.set_parameters(parameters)
        loss, accuracy = evaluate(self.model, self.testloader, device=self.device)
        return float(loss), len(self.testloader.dataset), {"accuracy": float(accuracy)}
```

### CLI for client.py
- `--client-id` (required): 0, 1, or 2
- `--data-type` (optional): defaults to `DATA_TYPE` from env
- Example: `python client/client.py --client-id 0 --data-type imaging`
- Start with non-deprecated API:
```python
fl.client.start_client(
    server_address=f"{settings.fl_server_host}:{settings.fl_server_port}",
    client=FedMedClient(client_id, data_type).to_client(),
)
```
- NEVER use `start_numpy_client` — deprecated in flwr 1.7.0

---

## FLOWER SERVER

### server/main.py
- `config = fl.server.ServerConfig(num_rounds=NUM_ROUNDS)`
- Use `FedMedStrategy` from strategy.py
- min_available_clients=3, min_fit_clients=3, min_evaluate_clients=3
- Log server start and each round

### server/strategy.py
```python
class FedMedStrategy(fl.server.strategy.FedAvg):
    """Custom FedAvg with per-round metric logging to disk."""

    def __init__(self) -> None:
        super().__init__(min_available_clients=3, min_fit_clients=3, min_evaluate_clients=3)
        self.round_metrics: list[dict] = []

    def aggregate_fit(self, server_round, results, failures):
        """Aggregate fit. Logs warning if any clients failed."""
        aggregated = super().aggregate_fit(server_round, results, failures)
        if failures:
            logger.warning(f"Round {server_round}: {len(failures)} client(s) failed during fit")
        return aggregated

    def aggregate_evaluate(self, server_round, results, failures):
        """Aggregate evaluate. Defensive access — skips clients with missing metrics."""
        aggregated = super().aggregate_evaluate(server_round, results, failures)
        if failures:
            logger.warning(f"Round {server_round}: {len(failures)} client(s) failed during evaluate")
        if results:
            accuracies, losses = [], []
            for _, evaluate_res in results:
                if evaluate_res.metrics and "accuracy" in evaluate_res.metrics:
                    accuracies.append(evaluate_res.metrics["accuracy"])
                    losses.append(evaluate_res.loss)
                else:
                    logger.warning(f"Round {server_round}: Client returned no accuracy metric, skipping")
            if accuracies:
                round_data = {
                    "round": server_round,
                    "accuracy": round(float(np.mean(accuracies)), 4),
                    "loss": round(float(np.mean(losses)), 4),
                    "client_accuracies": [round(a, 4) for a in accuracies],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                self.round_metrics.append(round_data)
                try:
                    save_metrics(self.round_metrics)
                except MetricsFileError:
                    logger.error(f"Round {server_round}: Failed to save metrics to disk")
        return aggregated
```
- Use `datetime.now(timezone.utc)` — NEVER `datetime.utcnow()` (deprecated)

### server/utils.py
```python
def save_metrics(metrics: list[dict]) -> None:
    """Write metrics atomically using temp file + os.replace.

    Args:
        metrics: List of round metric dictionaries.

    Raises:
        MetricsFileError: If the write operation fails.
    """
    settings = get_settings()
    metrics_path = Path(settings.metrics_file)
    temp_path = metrics_path.with_suffix(".tmp")
    try:
        metrics_path.parent.mkdir(parents=True, exist_ok=True)
        with open(temp_path, "w") as f:
            json.dump(metrics, f, indent=2)
        os.replace(str(temp_path), str(metrics_path))
    except OSError as exc:
        raise MetricsFileError(f"Failed to write metrics: {exc}") from exc


def setup_logger(name: str) -> logging.Logger:
    """Return logger outputting to stdout and logs/app.log.

    Args:
        name: Logger name, typically __name__.

    Returns:
        Configured logging.Logger.
    """
```
- Format: `%(asctime)s — %(name)s — %(levelname)s — %(message)s`
- Level from config LOG_LEVEL
- Output to both console and `logs/app.log`
