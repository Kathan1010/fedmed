from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal
from datetime import datetime


class GenericResponse(BaseModel):
    """Standard API response schema."""
    success: bool
    message: str
    data: Optional[Any] = None


# V5/V8 FIX: Whitelist data_type with Literal type
# V9 FIX: Bound num_rounds to [1, 100]
ALLOWED_DATA_TYPES = ("imaging", "ehr", "lab", "genomic", "wearable")

class TrainingRequest(BaseModel):
    """Payload for starting a training session."""
    data_type: Literal["imaging", "ehr", "lab", "genomic", "wearable"] = Field(
        ..., description="Data type (imaging, ehr, lab, genomic, wearable)"
    )
    num_rounds: Optional[int] = Field(
        None, ge=1, le=100, description="Override config rounds (1-100)"
    )


# GAP 8 FIX: Full RoundMetric with timestamp per spec
class RoundMetric(BaseModel):
    """Metrics for a single FL training round."""
    round: int = Field(..., ge=1, description="Round number")
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Average accuracy")
    loss: float = Field(..., ge=0.0, description="Average loss")
    client_accuracies: List[float] = Field(..., description="Per-client accuracies")
    timestamp: Optional[str] = Field(None, description="ISO 8601 UTC timestamp")


class MetricsResponse(BaseModel):
    """Response schema for GET /api/v1/metrics."""
    rounds: List[RoundMetric]
    total_rounds_completed: int = 0
    current_accuracy: Optional[float] = None
    current_loss: Optional[float] = None


# GAP 8 FIX: Proper StatusResponse per spec
class StatusResponse(BaseModel):
    """Response schema for GET /api/v1/status."""
    status: str = Field(..., description="idle | training | completed")
    current_round: int = 0
    total_rounds: int = 0
    connected_clients: int = 0


# GAP 8 FIX: ModelInfoResponse per spec
class ModelInfoResponse(BaseModel):
    """Response schema for GET /api/v1/model-info."""
    model_config = {"protected_namespaces": ()}

    architecture: str
    total_parameters: int
    model_size_kb: float
    save_path: str


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    error: str
    status: int
