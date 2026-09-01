import torch.nn as nn
from shared.models.imaging import ImagingModel
from shared.models.ehr import EHRModel
from shared.models.lab import LabModel
from shared.models.genomic import GenomicModel
from shared.models.wearable import WearableModel

MODEL_REGISTRY: dict[str, type] = {
    "imaging": ImagingModel,
    "ehr": EHRModel,
    "lab": LabModel,
    "genomic": GenomicModel,
    "wearable": WearableModel,
}

def get_model(data_type: str) -> nn.Module:
    """Return the model class for the given data type.

    Args:
        data_type: One of 'imaging', 'ehr', 'lab', 'genomic', 'wearable'.

    Returns:
        An instantiated nn.Module for that data type.

    Raises:
        ValueError: If data_type is not recognized.
    """
    if data_type not in MODEL_REGISTRY:
        raise ValueError(f"Unknown data type: {data_type}. Must be one of {list(MODEL_REGISTRY.keys())}")
    return MODEL_REGISTRY[data_type]()
