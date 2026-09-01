import json
import os
import logging
from filelock import FileLock
from config.config import get_settings

logger = logging.getLogger(__name__)

def save_metrics(round_num: int, metrics_dict: dict) -> None:
    """Safely saves round metrics to a JSON file using cross-platform file locks."""
    settings = get_settings()
    filepath = settings.metrics_file
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # V12 FIX: Cross-platform file locking with filelock
    lock = FileLock(filepath + ".lock", timeout=10)
    
    try:
        with lock:
            # V11 FIX: Use try/except instead of TOCTOU os.path.exists check
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                data = {"rounds": []}
            
            # Append new round data
            round_data = {"round": round_num}
            round_data.update(metrics_dict)
            
            # Remove existing entry for this round if it exists (idempotency)
            data["rounds"] = [r for r in data["rounds"] if r.get("round") != round_num]
            data["rounds"].append(round_data)
            
            # Write metrics atomically — write to temp then rename
            tmp_path = filepath + ".tmp"
            with open(tmp_path, 'w') as f:
                json.dump(data, f, indent=4)
            
            # Atomic rename (on most OSes)
            os.replace(tmp_path, filepath)
            
    except Exception as e:
        logger.error(f"Failed to save metrics: {e}")
