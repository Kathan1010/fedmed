import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from config.config import get_settings


def _class_weights(model: nn.Module, trainloader: DataLoader, device: torch.device):
    """Compute inverse-frequency class weights to counter class imbalance.

    Reads labels directly from the underlying dataset (no transforms applied, so
    it's cheap). Returns None on any unexpected structure (e.g. synthetic test
    loaders), in which case training falls back to an unweighted loss.
    """
    try:
        import numpy as np

        num_classes = None
        for m in model.modules():
            if isinstance(m, nn.Linear):
                num_classes = m.out_features
        if num_classes is None:
            return None

        subset = trainloader.dataset
        labels = np.asarray(subset.dataset.labels).reshape(-1)[np.asarray(subset.indices)]
        if labels.max() >= num_classes:
            return None
        counts = np.bincount(labels, minlength=num_classes).astype("float64")
        counts[counts == 0] = 1.0
        weights = counts.sum() / (num_classes * counts)
        return torch.tensor(weights, dtype=torch.float32, device=device)
    except Exception:
        return None


def train(model: nn.Module, trainloader: DataLoader, epochs: int, device: torch.device) -> tuple[int, float]:
    """Train the network on the training set."""
    settings = get_settings()
    # Class-weighted loss counters BloodMNIST's imbalance (falls back to unweighted).
    criterion = nn.CrossEntropyLoss(weight=_class_weights(model, trainloader, device))
    # Constant LR: a fresh optimizer is built each federated round, so a per-round
    # cosine schedule would decay the LR toward zero within the few local epochs and
    # stall cross-round progress. Adam already adapts step sizes per-parameter.
    optimizer = torch.optim.Adam(model.parameters(), lr=settings.learning_rate)

    model.train()
    total_loss = 0.0

    for epoch in range(epochs):
        epoch_loss = 0.0
        for batch in trainloader:
            # Handle different dataset outputs (images vs tabular)
            if len(batch) == 2:
                images, labels = batch
            else:
                raise ValueError(f"Expected batch of length 2, got {len(batch)}")

            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels.flatten().long())
            loss.backward()

            # Gradient clipping — relaxed from 1.0 to 5.0 to avoid cutting useful gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)

            optimizer.step()
            epoch_loss += loss.item()

        total_loss += epoch_loss / len(trainloader)

    avg_loss = total_loss / epochs if epochs > 0 else 0.0
    return len(trainloader.dataset), avg_loss

def test(model: nn.Module, testloader: DataLoader, device: torch.device) -> tuple[float, float, int]:
    """Validate the network on the entire test set."""
    criterion = nn.CrossEntropyLoss()
    correct = 0
    total = 0
    loss = 0.0
    
    model.eval()
    with torch.no_grad():
        for batch in testloader:
            if len(batch) == 2:
                images, labels = batch
            else:
                raise ValueError(f"Expected batch of length 2, got {len(batch)}")
                
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            labels_flat = labels.flatten().long()
            loss += criterion(outputs, labels_flat).item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels_flat).sum().item()
            
    accuracy = correct / total if total > 0 else 0.0
    avg_loss = loss / len(testloader) if len(testloader) > 0 else 0.0
    
    return avg_loss, accuracy, total
