"""Tests for client/data_loaders/registry.py — load_data() function."""
import pytest
from torch.utils.data import DataLoader
from client.data_loaders.registry import load_data


def test_load_data_returns_two_dataloaders():
    """load_data() should return a tuple of (train_loader, test_loader)."""
    train_loader, test_loader = load_data(0, "lab")

    assert isinstance(train_loader, DataLoader)
    assert isinstance(test_loader, DataLoader)


def test_load_data_partitions_have_data():
    """Each partition should have at least 1 sample."""
    for client_id in range(3):
        train_loader, test_loader = load_data(client_id, "lab")
        assert len(train_loader.dataset) > 0, f"Client {client_id} train is empty"
        assert len(test_loader.dataset) > 0, f"Client {client_id} test is empty"


def test_load_data_invalid_client_id_raises():
    """Invalid client_id should raise ValueError."""
    with pytest.raises(ValueError):
        load_data(3, "imaging")

    with pytest.raises(ValueError):
        load_data(-1, "imaging")


def test_load_data_invalid_data_type_raises():
    """Unknown data_type should raise ValueError."""
    with pytest.raises(ValueError):
        load_data(0, "unknown_type")


def test_load_data_all_types():
    """load_data() should work for all valid data types."""
    for data_type in ("lab", "genomic", "wearable"):
        train_loader, test_loader = load_data(0, data_type)
        assert isinstance(train_loader, DataLoader), f"Failed for {data_type}"
        assert isinstance(test_loader, DataLoader), f"Failed for {data_type}"
