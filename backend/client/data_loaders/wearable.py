import os
import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from config.config import get_settings

def load_wearable_data(client_id: int) -> tuple[DataLoader, DataLoader]:
    """Generates synthetic wearable sensor time-series data, partitioned across clients."""
    settings = get_settings()
    
    # V24 FIX: Use local Generator instead of global np.random.seed()
    rng = np.random.default_rng(42 + client_id)
    
    num_samples = 300
    timesteps = 60
    sensors = 5
    
    X = rng.standard_normal((num_samples, timesteps, sensors))
    y = rng.integers(0, 3, num_samples) # 3 classes
    
    # Inject patterns based on class
    for i in range(num_samples):
        if y[i] == 1:
            # Class 1 pattern: high variance in sensor 0 (e.g. erratic heart rate)
            X[i, :, 0] += np.sin(np.linspace(0, 10 * np.pi, timesteps)) * 2
        elif y[i] == 2:
            # Class 2 pattern: sudden spike in sensor 2 (e.g. fall detected)
            X[i, timesteps//2:, 2] += 3.0
            
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Convert to tensors
    train_dataset = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.long))
    test_dataset = TensorDataset(torch.tensor(X_test, dtype=torch.float32), torch.tensor(y_test, dtype=torch.long))

    from client.data_loaders.registry import get_loader_kwargs
    loader_kwargs = get_loader_kwargs()
    train_loader = DataLoader(train_dataset, batch_size=settings.batch_size, shuffle=True, **loader_kwargs)
    test_loader = DataLoader(test_dataset, batch_size=settings.batch_size, shuffle=False, **loader_kwargs)

    return train_loader, test_loader
