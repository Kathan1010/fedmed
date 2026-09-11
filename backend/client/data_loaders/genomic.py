import os
import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from config.config import get_settings

def load_genomic_data(client_id: int) -> tuple[DataLoader, DataLoader]:
    """Generates synthetic one-hot DNA sequence data, partitioned across clients.

    Each sample is a one-hot DNA sequence (4 bases × 200 positions). The classes
    differ by base *composition* rather than a perfectly separable motif: negatives
    draw bases uniformly (25% each) while positives are mildly enriched for base A
    (~34%). Because the two class distributions overlap, the task has a realistic
    Bayes-error ceiling (~90%) — a well-trained model lands in the high-80s to low-90s
    rather than the unrealistic ~100% a cleanly separable synthetic set would give.
    The signal is statistical and distributed, so training is stable across clients.
    """
    settings = get_settings()

    # V24 FIX: Use local Generator instead of global np.random.seed()
    # np.random.seed() sets global state — affects all code, not just this function
    rng = np.random.default_rng(42 + client_id)

    num_samples = 1500
    seq_length = 200
    channels = 4  # A, C, G, T

    # Class-dependent base composition. POS_ENRICH sets how strongly the positive
    # class over-represents base A; the small gap vs. 0.25 is what caps accuracy
    # at a realistic ~90% instead of making the classes trivially separable.
    POS_ENRICH = 0.34
    y = rng.integers(0, 2, num_samples)
    uniform_probs = [0.25, 0.25, 0.25, 0.25]
    enriched_probs = [POS_ENRICH, (1 - POS_ENRICH) / 3, (1 - POS_ENRICH) / 3, (1 - POS_ENRICH) / 3]

    X = np.zeros((num_samples, channels, seq_length), dtype=np.float32)
    positions = np.arange(seq_length)
    for i in range(num_samples):
        probs = enriched_probs if y[i] == 1 else uniform_probs
        bases = rng.choice(channels, size=seq_length, p=probs)
        X[i, bases, positions] = 1.0

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
