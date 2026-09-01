import os
from torch.utils.data import DataLoader, Subset
from torchvision import transforms
from medmnist import BloodMNIST
from config.config import get_settings

def load_imaging_data(client_id: int) -> tuple[DataLoader, DataLoader]:
    """Loads BloodMNIST images, partitioned across 3 clients."""
    settings = get_settings()
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)

    data_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[.5], std=[.5])
    ])

    # BloodMNIST automatically downloads if download=True
    train_dataset = BloodMNIST(split="train", download=True, root=data_dir, transform=data_transform)
    test_dataset = BloodMNIST(split="test", download=True, root=data_dir, transform=data_transform)

    # Split training set into 3 equal partitions (capped for speed)
    total_train = len(train_dataset)
    partition_size_train = total_train // settings.num_clients
    start_idx_train = client_id * partition_size_train
    end_idx_train = start_idx_train + min(partition_size_train, 500)
    train_subset = Subset(train_dataset, range(start_idx_train, end_idx_train))

    # Split test set into 3 equal partitions (capped for speed)
    total_test = len(test_dataset)
    partition_size_test = total_test // settings.num_clients
    start_idx_test = client_id * partition_size_test
    end_idx_test = start_idx_test + min(partition_size_test, 100)
    test_subset = Subset(test_dataset, range(start_idx_test, end_idx_test))

    from client.data_loaders.registry import get_loader_kwargs
    loader_kwargs = get_loader_kwargs()
    train_loader = DataLoader(train_subset, batch_size=settings.batch_size, shuffle=True, **loader_kwargs)
    test_loader = DataLoader(test_subset, batch_size=settings.batch_size, shuffle=False, **loader_kwargs)

    return train_loader, test_loader
