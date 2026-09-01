import subprocess
import sys
import json
import time
import psutil
import logging
import os
from pathlib import Path
from config.config import get_settings

logger = logging.getLogger(__name__)


# GAP 9 FIX: Safe metrics reader — never raises to caller
def read_metrics_file() -> list[dict]:
    """Read metrics from disk safely.

    Returns:
        List of round metric dicts, or [] on any error.
    """
    settings = get_settings()
    metrics_path = Path(settings.metrics_file)
    try:
        if not metrics_path.exists():
            return []
        content = metrics_path.read_text(encoding="utf-8").strip()
        if not content:
            return []
        data = json.loads(content)
        if isinstance(data, dict):
            return data.get("rounds", [])
        if isinstance(data, list):
            return data
        logger.warning(f"Metrics file contains unexpected data type: {type(data)}")
        return []
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning(f"Failed to read metrics file: {exc}")
        return []


# GAP 9 FIX: Model file size calculator
def calculate_model_size(path: str) -> float:
    """Return model file size in KB, or 0.0 if file missing.

    Args:
        path: Path to the saved model file.

    Returns:
        Size in KB as float.
    """
    model_path = Path(path)
    return model_path.stat().st_size / 1024.0 if model_path.exists() else 0.0

class TrainingProcessManager:
    """Manages the FL server and client subprocesses."""
    
    def __init__(self):
        self.server_process: subprocess.Popen | None = None
        self.client_processes: list[subprocess.Popen] = []
        self.is_running = False

    def start_training(self, data_type: str, num_rounds: int = None) -> None:
        """Starts the Flower server and all clients."""
        settings = get_settings()
        
        # Clear old metrics
        if os.path.exists(settings.metrics_file):
            try:
                os.remove(settings.metrics_file)
            except Exception as e:
                logger.warning(f"Could not delete old metrics: {e}")

        # Build env with optional num_rounds override
        env = os.environ.copy()
        if num_rounds is not None:
            env["NUM_ROUNDS"] = str(num_rounds)

        # Start Server
        logger.info(f"Starting server for {data_type}...")
        self.server_process = subprocess.Popen(
            [sys.executable, "-m", "server.main", "--data-type", data_type],
            env=env
        )
        
        # Wait a moment for server to bind port
        time.sleep(3)
        
        # Start Clients
        logger.info(f"Starting {settings.num_clients} clients...")
        self.client_processes = []
        for i in range(settings.num_clients):
            p = subprocess.Popen(
                [sys.executable, "-m", "client.client", "--client-id", str(i), "--data-type", data_type]
            )
            self.client_processes.append(p)
            
        self.is_running = True

    def check_status(self) -> bool:
        """Checks if training is still running."""
        if not self.is_running:
            return False
            
        # If server is dead, training is over
        if self.server_process and self.server_process.poll() is not None:
            self._cleanup()
            return False
            
        return True
        
    def stop_training(self) -> None:
        """Force stops all training processes."""
        self._cleanup()

    def _cleanup(self) -> None:
        """Kills all subprocesses cleanly and reaps zombies."""
        logger.info("Cleaning up training processes...")
        self.is_running = False
        
        for p in self.client_processes:
            self._kill_process_tree(p)
                
        if self.server_process:
            self._kill_process_tree(self.server_process)
                
        self.client_processes = []
        self.server_process = None

    def _kill_process_tree(self, proc: subprocess.Popen) -> None:
        """Kill a process and all its children, then reap to prevent zombies."""
        try:
            if proc.poll() is None:
                parent = psutil.Process(proc.pid)
                children = parent.children(recursive=True)
                for child in children:
                    try:
                        child.kill()
                    except psutil.NoSuchProcess:
                        pass
                parent.kill()
                # V26 FIX: Wait for process to be reaped (prevent zombie)
                parent.wait(timeout=5)
        except psutil.NoSuchProcess:
            pass
        except psutil.TimeoutExpired:
            logger.warning(f"Process {proc.pid} did not exit within 5s after kill")
        finally:
            # Also call Popen.wait() to clean up Python-side resources
            try:
                proc.wait(timeout=1)
            except subprocess.TimeoutExpired:
                pass

# Singleton manager
process_manager = TrainingProcessManager()
