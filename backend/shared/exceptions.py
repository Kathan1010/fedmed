class FedMedError(Exception):
    """Base exception for all FedMed domain errors."""
    pass


class ClientConnectionError(FedMedError):
    """Raised when a FL client fails to connect to the server."""
    pass


class MetricsFileError(FedMedError):
    """Raised when reading or writing the metrics file fails."""
    pass


class ModelNotFoundError(FedMedError):
    """Raised when the saved model file cannot be found."""
    pass


class TrainingAlreadyRunningError(FedMedError):
    """Raised when training is requested but already in progress."""
    pass
