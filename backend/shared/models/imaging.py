import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights


def _batchnorm_to_groupnorm(module: nn.Module) -> None:
    """Recursively replace every BatchNorm2d with GroupNorm.

    BatchNorm keeps running mean/variance statistics that FedAvg averages across
    clients — statistically invalid and a well-known cause of stalled accuracy in
    federated training. GroupNorm normalizes per-sample (no running stats), so the
    global model stays consistent after aggregation.
    """
    for name, child in module.named_children():
        if isinstance(child, nn.BatchNorm2d):
            num_channels = child.num_features
            num_groups = 32
            while num_channels % num_groups != 0:
                num_groups //= 2
            setattr(module, name, nn.GroupNorm(num_groups, num_channels))
        else:
            _batchnorm_to_groupnorm(child)


class ImagingModel(nn.Module):
    """ResNet18 Transfer Learning Model for medical blood cell image classification.
    Uses BloodMNIST — real microscopy images of blood cells (28×28 RGB → 8 classes).
    """

    def __init__(self) -> None:
        super().__init__()
        # Load a pre-trained ResNet18 model
        self.model = resnet18(weights=ResNet18_Weights.DEFAULT)

        # Swap BatchNorm → GroupNorm for stable federated aggregation.
        # Pre-trained convolutional filters are preserved; only the normalization
        # layers (whose running stats don't survive FedAvg) are replaced.
        _batchnorm_to_groupnorm(self.model)

        # We keep the entire pre-trained model intact to preserve all learned features.
        # We only replace the final fully connected layer for our 8-class classification task.
        num_ftrs = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_ftrs, 8)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)
