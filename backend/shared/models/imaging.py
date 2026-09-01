import torch
import torch.nn as nn

class ImagingModel(nn.Module):
    """CNN for medical blood cell image classification.
    Uses BloodMNIST — real microscopy images of blood cells (28×28 RGB → 8 classes).

    Architecture: Conv2d(3,16) → ReLU → MaxPool → Conv2d(16,32) → ReLU → MaxPool →
                  Flatten → Linear(1568, 128) → ReLU → Dropout → Linear(128, 8)
    """

    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),   # 3 channels (RGB)
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
            nn.Linear(128, 8),   # 8 blood cell types
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))
