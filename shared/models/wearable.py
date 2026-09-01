import torch
import torch.nn as nn

class WearableModel(nn.Module):
    """Bidirectional LSTM for wearable sensor time-series classification.
    Synthetic heart rate / accelerometer data (60 timesteps × 5 sensors → 3 classes).

    Architecture: BiLSTM(5, 64, 2 layers, dropout=0.2) → Linear(128, 32) → ReLU →
                  Dropout(0.3) → Linear(32, 3)
    """

    def __init__(self) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=5,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.2,
            bidirectional=True,
        )
        self.classifier = nn.Sequential(
            nn.Linear(128, 32),  # 64 * 2 (bidirectional)
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 3),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]  # take last timestep
        return self.classifier(last_hidden)
