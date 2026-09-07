import os
import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from config.config import get_settings

def load_genomic_data(client_id: int) -> tuple[DataLoader, DataLoader]:
    """Generates synthetic genomic sequence data, partitioned across clients."""
    settings = get_settings()
    
    # V24 FIX: Use local Generator instead of global np.random.seed()
    # np.random.seed() sets global state — affects all code, not just this function
    rng = np.random.default_rng(42 + client_id)
    
    num_samples = 1500
    seq_length = 200
    channels = 4
    
    # Generate random sequences
    X = rng.standard_normal((num_samples, channels, seq_length))
    
    # Generate binary labels
    y = rng.integers(0, 2, num_samples)
    
    # Inject a 'motif' for positive class so model has something to learn
    motif = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) # ATGC
    for i in range(num_samples):
        if y[i] == 1:
            start_pos = rng.integers(0, seq_length - 4)
            X[i, :, start_pos:start_pos+4] += motif
            
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
