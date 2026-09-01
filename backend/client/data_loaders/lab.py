import os
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from config.config import get_settings

def load_lab_data(client_id: int) -> tuple[DataLoader, DataLoader]:
    """Loads Breast Cancer Wisconsin dataset (Lab tabular), partitioned across clients."""
    settings = get_settings()

    # Load dataset
    data = load_breast_cancer()
    X, y = data.data, data.target

    # Split into 3 partitions
    partition_size = len(X) // settings.num_clients
    start_idx = client_id * partition_size
    end_idx = start_idx + partition_size if client_id != settings.num_clients - 1 else len(X)
    
    X_client = X[start_idx:end_idx]
    y_client = y[start_idx:end_idx]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X_client, y_client, test_size=0.2, random_state=42+client_id)

    # Scale features
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test) if len(X_test) > 0 else X_test

    # Convert to tensors
    train_dataset = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.long))
    test_dataset = TensorDataset(torch.tensor(X_test, dtype=torch.float32), torch.tensor(y_test, dtype=torch.long))

    from client.data_loaders.registry import get_loader_kwargs
    loader_kwargs = get_loader_kwargs()
    train_loader = DataLoader(train_dataset, batch_size=settings.batch_size, shuffle=True, **loader_kwargs)
    test_loader = DataLoader(test_dataset, batch_size=settings.batch_size, shuffle=False, **loader_kwargs)

    return train_loader, test_loader
