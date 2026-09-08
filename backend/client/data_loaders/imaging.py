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

    # Data augmentation for training — geometric only. Blood cells are orientation-
    # invariant, so flips/rotation help; color jitter is omitted because stain hue is
    # a key class signal and perturbing it hurts discrimination.
    train_transform = transforms.Compose([
        transforms.Resize(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # No augmentation for test — clean evaluation
    test_transform = transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # BloodMNIST automatically downloads if download=True
    train_dataset = BloodMNIST(split="train", download=True, root=data_dir, transform=train_transform)
    test_dataset = BloodMNIST(split="test", download=True, root=data_dir, transform=test_transform)

    # Split training set into equal partitions across clients
    total_train = len(train_dataset)
    partition_size_train = total_train // settings.num_clients
    start_idx_train = client_id * partition_size_train
    end_idx_train = start_idx_train + partition_size_train
    train_subset = Subset(train_dataset, range(start_idx_train, end_idx_train))

    # Split test set into equal partitions across clients
    total_test = len(test_dataset)
    partition_size_test = total_test // settings.num_clients
    start_idx_test = client_id * partition_size_test
    end_idx_test = start_idx_test + partition_size_test
    test_subset = Subset(test_dataset, range(start_idx_test, end_idx_test))

    from client.data_loaders.registry import get_loader_kwargs
    loader_kwargs = get_loader_kwargs()
    train_loader = DataLoader(train_subset, batch_size=settings.batch_size, shuffle=True, **loader_kwargs)
    test_loader = DataLoader(test_subset, batch_size=settings.batch_size, shuffle=False, **loader_kwargs)

    return train_loader, test_loader
