import torch
import torch.nn as nn

class LabModel(nn.Module):
    """MLP for lab report tumor diagnosis.
    Uses sklearn Breast Cancer Wisconsin dataset (30 features → 2 classes).

    Architecture: Linear(30, 64) → ReLU → Dropout →
                  Linear(64, 32) → ReLU → Dropout → Linear(32, 2)
    """

    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(30, 64),   # 30 features from Breast Cancer dataset
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 2),    # malignant / benign
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
