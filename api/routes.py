import json
import logging
import threading
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from api.models import (
    GenericResponse, TrainingRequest, MetricsResponse,
    StatusResponse, ModelInfoResponse, ErrorResponse,
)
from api.utils import process_manager, read_metrics_file, calculate_model_size
from config.config import get_settings
from shared.models.registry import get_model
from filelock import FileLock

_start_lock = threading.Lock()
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", response_model=GenericResponse)
async def health_check():
    """Health check verifying API and disk write access are functional."""
    health_data = {"api": "ok"}
    try:
        log_dir = Path("logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        test_file = log_dir / ".health_check"
        test_file.write_text("ok")
        test_file.unlink()
        health_data["disk_write"] = "ok"
    except OSError:
        health_data["disk_write"] = "failed"
    return GenericResponse(success=True, message="API is running", data=health_data)


# GAP 8 FIX: Proper StatusResponse per spec
@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Returns detailed training status."""
    settings = get_settings()
    rounds = read_metrics_file()
    is_running = process_manager.check_status()

    num_completed = len(rounds)
    if num_completed >= settings.num_rounds and not is_running:
        status = "completed"
    elif is_running or num_completed > 0:
        status = "training"
    else:
        status = "idle"

    return StatusResponse(
        status=status,
        current_round=num_completed,
        total_rounds=settings.num_rounds,
        connected_clients=settings.num_clients if is_running else 0,
    )


# GAP 8 FIX: Full MetricsResponse per spec
@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Reads and returns the current training metrics."""
    rounds = read_metrics_file()

    current_accuracy = None
    current_loss = None
    if rounds:
        last = rounds[-1]
        current_accuracy = last.get("accuracy")
        current_loss = last.get("loss")

    return MetricsResponse(
        rounds=rounds,
        total_rounds_completed=len(rounds),
        current_accuracy=current_accuracy,
        current_loss=current_loss,
    )


@router.post("/start-training", response_model=GenericResponse)
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Starts a federated learning session."""
    if not _start_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Training start already in progress.")
    try:
        if process_manager.check_status():
            raise HTTPException(status_code=409, detail="Training is already running.")
        background_tasks.add_task(_start_with_lock, request.data_type, request.num_rounds)
    except Exception:
        _start_lock.release()
        raise
    return GenericResponse(success=True, message=f"Training started for {request.data_type}")


def _start_with_lock(data_type: str, num_rounds: int = None):
    """Background task that starts training and releases the lock when done."""
    try:
        process_manager.start_training(data_type, num_rounds)
    finally:
        _start_lock.release()


@router.post("/stop-training", response_model=GenericResponse)
async def stop_training():
    """Stops a running federated learning session."""
    if not process_manager.check_status():
        return GenericResponse(success=True, message="Training was not running.")

    process_manager.stop_training()
    return GenericResponse(success=True, message="Training stopped.")


# GAP 8 FIX: /model-info endpoint per spec
@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns information about the current model architecture."""
    settings = get_settings()
    model = get_model(settings.data_type)

    total_params = sum(p.numel() for p in model.parameters())
    model_size = calculate_model_size(settings.model_save_path)

    return ModelInfoResponse(
        architecture=model.__class__.__name__,
        total_parameters=total_params,
        model_size_kb=round(model_size, 2),
        save_path=settings.model_save_path,
    )
