import torch
import torch.nn as nn

class GenomicModel(nn.Module):
    """1D CNN for genomic sequence classification.
    Simulated with synthetic one-hot encoded DNA sequences (4 channels × 200 length → 2 classes).

    Architecture: Conv1d → ReLU → MaxPool → Conv1d → ReLU → AdaptiveAvgPool →
                  Flatten → Linear → ReLU → Dropout → Linear
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
