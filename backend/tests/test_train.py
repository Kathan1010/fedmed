"""Tests for client/train.py — train() and test() functions."""
import torch
from torch.utils.data import DataLoader, TensorDataset
from shared.models.registry import get_model
from client.train import train, test as evaluate


def _make_dummy_loader(data_type: str, n_samples: int = 10) -> DataLoader:
    """Create a small dummy DataLoader with correct input shape for the given data type.

    Args:
        data_type: One of 'imaging', 'ehr', 'lab', 'genomic', 'wearable'.
        n_samples: Number of dummy samples to generate.

    Returns:
        DataLoader with random data matching the model's expected input.
    """
    shapes = {
        "imaging": (3, 28, 28),
        "ehr": (13,),
        "lab": (30,),
        "genomic": (4, 200),
        "wearable": (60, 5),
    }
    num_classes = {"imaging": 8, "ehr": 2, "lab": 2, "genomic": 2, "wearable": 3}

    shape = shapes[data_type]
    X = torch.randn(n_samples, *shape)
    y = torch.randint(0, num_classes[data_type], (n_samples,))
    return DataLoader(TensorDataset(X, y), batch_size=4)


def test_train_returns_correct_types():
    """train() should return (num_examples: int, avg_loss: float)."""
    model = get_model("imaging")
    loader = _make_dummy_loader("imaging")
    num_examples, avg_loss = train(model, loader, epochs=1, device="cpu")

    assert isinstance(num_examples, int)
    assert isinstance(avg_loss, float)
    assert num_examples == 10


def test_evaluate_returns_correct_types():
    """test() should return (loss: float, accuracy: float, num_examples: int)."""
    model = get_model("imaging")
    loader = _make_dummy_loader("imaging")
    loss, accuracy, num_examples = evaluate(model, loader, device="cpu")

    assert isinstance(loss, float)
    assert isinstance(accuracy, float)
    assert isinstance(num_examples, int)


def test_accuracy_in_valid_range():
    """Accuracy should be between 0.0 and 1.0."""
    model = get_model("imaging")
    loader = _make_dummy_loader("imaging")
    _, accuracy, _ = evaluate(model, loader, device="cpu")

    assert 0.0 <= accuracy <= 1.0


def test_train_all_data_types():
    """train() should work with all 5 data types without error."""
    for data_type in ("imaging", "ehr", "lab", "genomic", "wearable"):
        model = get_model(data_type)
        loader = _make_dummy_loader(data_type)
        num_examples, avg_loss = train(model, loader, epochs=1, device="cpu")

        assert isinstance(num_examples, int), f"Failed for {data_type}"
        assert isinstance(avg_loss, float), f"Failed for {data_type}"


def test_evaluate_all_data_types():
    """test() should work with all 5 data types without error."""
    for data_type in ("imaging", "ehr", "lab", "genomic", "wearable"):
        model = get_model(data_type)
        loader = _make_dummy_loader(data_type)
        loss, accuracy, num_examples = evaluate(model, loader, device="cpu")

        assert 0.0 <= accuracy <= 1.0, f"Failed for {data_type}"
        assert isinstance(loss, float), f"Failed for {data_type}"
