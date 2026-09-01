import argparse
import numpy as np
import flwr as fl
import torch
from pathlib import Path
from collections import OrderedDict
from config.config import get_settings
from shared.models.registry import get_model
from client.data_loaders.registry import load_data
from client.train import train, test
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FedMedClient(fl.client.NumPyClient):
    """Flower client for FedMed."""
    
    def __init__(self, model, trainloader, testloader, device, client_id):
        self.model = model
        self.trainloader = trainloader
        self.testloader = testloader
        self.device = device
        self.client_id = client_id
        self.settings = get_settings()

    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        """Load parameters into model. Uses np.copy to avoid shared memory."""
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.from_numpy(np.copy(v)) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        logger.info(f"[Client {self.client_id}] Received fit instruction from server")
        self.set_parameters(parameters)
        num_examples, avg_loss = train(self.model, self.trainloader, epochs=self.settings.local_epochs, device=self.device)
        logger.info(f"[Client {self.client_id}] Finished training round. Loss: {avg_loss:.4f}")
        return self.get_parameters(config={}), num_examples, {"loss": avg_loss}

    def evaluate(self, parameters, config):
        logger.info(f"[Client {self.client_id}] Received evaluate instruction from server")
        self.set_parameters(parameters)
        loss, accuracy, num_examples = test(self.model, self.testloader, device=self.device)
        logger.info(f"[Client {self.client_id}] Finished evaluation. Accuracy: {accuracy:.4f}, Loss: {loss:.4f}")
        return loss, num_examples, {"accuracy": accuracy, "client_id": self.client_id}

def main():
    parser = argparse.ArgumentParser(description="FedMed FL Client")
    parser.add_argument("--client-id", type=int, required=True, help="Hospital ID (0, 1, or 2)")
    parser.add_argument("--data-type", type=str, default=None, help="Type of data (imaging, ehr, lab, etc.)")
    args = parser.parse_args()

    settings = get_settings()
    data_type = args.data_type or settings.data_type
    
    logger.info(f"Starting client {args.client_id} for data type: {data_type}")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # Load model and data via registries
    model = get_model(data_type).to(device)
    trainloader, testloader = load_data(args.client_id, data_type)

    client = FedMedClient(model, trainloader, testloader, device, args.client_id)
    
    server_address = f"{settings.fl_server_host}:{settings.fl_server_port}"
    logger.info(f"Connecting to server at {server_address}")
    
    # V15/V16 FIX: Use TLS if certificates are available
    certs_dir = Path("certs")
    ca_cert = certs_dir / "ca.pem"
    
    # GAP 6 FIX: Use non-deprecated start_client() with .to_client()
    client_kwargs = {
        "server_address": server_address,
        "client": client.to_client(),
    }
    
    if ca_cert.exists():
        logger.info("TLS certificate found — connecting with encryption")
        client_kwargs["root_certificates"] = ca_cert.read_bytes()
    else:
        logger.warning("⚠️  No TLS certificate found. Connecting WITHOUT encryption.")
    
    fl.client.start_client(**client_kwargs)

if __name__ == "__main__":
    main()
