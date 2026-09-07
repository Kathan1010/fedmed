import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from config.config import get_settings

def train(model: nn.Module, trainloader: DataLoader, epochs: int, device: torch.device) -> tuple[int, float]:
    """Train the network on the training set."""
    settings = get_settings()
    criterion = nn.CrossEntropyLoss()
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
            
            # Gradient clipping to prevent exploding gradients from bad data
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
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
