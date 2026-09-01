import os
import torch
from torch.utils.data import DataLoader
from config.config import get_settings
from client.data_loaders.imaging import load_imaging_data
from client.data_loaders.ehr import load_ehr_data
from client.data_loaders.lab import load_lab_data
from client.data_loaders.genomic import load_genomic_data
from client.data_loaders.wearable import load_wearable_data


# GAP 16 FIX: Shared helper for DataLoader kwargs per spec
def get_loader_kwargs() -> dict:
    """Return num_workers and pin_memory settings based on platform and CUDA.

    Returns:
        Dict with 'num_workers' and 'pin_memory' keys.
    """
    use_cuda = torch.cuda.is_available()
    num_workers = 0 if os.name == "nt" else 2
    return {"num_workers": num_workers, "pin_memory": use_cuda}

LOADER_REGISTRY = {
    "imaging": load_imaging_data,
    "ehr": load_ehr_data,
    "lab": load_lab_data,
    "genomic": load_genomic_data,
    "wearable": load_wearable_data,
}

def load_data(client_id: int, data_type: str) -> tuple[DataLoader, DataLoader]:
    """Load train and test data for the given client and data type.

    Args:
        client_id: Hospital identifier (0, 1, or 2).
        data_type: One of 'imaging', 'ehr', 'lab', 'genomic', 'wearable'.

    Returns:
        Tuple of (train_loader, test_loader).

    Raises:
        ValueError: If client_id or data_type is invalid.
    """
    settings = get_settings()
    if client_id < 0 or client_id >= settings.num_clients:
        raise ValueError(f"client_id must be in range [0, {settings.num_clients}), got {client_id}")
    if data_type not in LOADER_REGISTRY:
        raise ValueError(f"Unknown data type: {data_type}. Must be one of {list(LOADER_REGISTRY.keys())}")
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Loading {data_type} data for client {client_id}")
    
    return LOADER_REGISTRY[data_type](client_id)
