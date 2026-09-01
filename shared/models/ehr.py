import torch
import torch.nn as nn

class EHRModel(nn.Module):
    """MLP for tabular EHR classification.
    Uses UCI Heart Disease (Cleveland) dataset (13 features → 2 classes).

    Architecture: Linear(13, 64) → ReLU → BatchNorm → Dropout →
                  Linear(64, 32) → ReLU → Dropout → Linear(32, 2)
    """

    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(13, 64),   # 13 features from Heart Disease dataset
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
