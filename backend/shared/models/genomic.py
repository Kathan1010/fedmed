import torch
import torch.nn as nn

class GenomicModel(nn.Module):
    """1D CNN for genomic sequence classification.
    Synthetic one-hot DNA sequences (4 channels × 200 length → 2 classes) where the
    classes differ by base composition (a distributed statistical signal).

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
            # Average-pool: the class signal is base *composition* (a distributed,
            # statistical property), so averaging conv activations over the sequence
            # is the right summary and gives stable, graceful training.
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
