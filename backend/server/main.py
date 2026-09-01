import flwr as fl
import os
import argparse
import logging
from pathlib import Path
from config.config import get_settings
from server.strategy import FedMedStrategy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="FedMed FL Server")
    parser.add_argument("--data-type", type=str, default=None, help="Type of data being trained")
    args = parser.parse_args()
    
    settings = get_settings()
    data_type = args.data_type or settings.data_type
    
    # Ensure metrics file is clear before starting a new session
    if os.path.exists(settings.metrics_file):
        os.remove(settings.metrics_file)
        
    logger.info(f"Starting federated server. Expecting {settings.num_clients} clients. Data type: {data_type}")
    
    strategy = FedMedStrategy(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=settings.num_clients,
        min_evaluate_clients=settings.num_clients,
        min_available_clients=settings.num_clients,
    )
    
    server_address = f"{settings.fl_server_host}:{settings.fl_server_port}"
    
    # V15/V16 FIX: Use TLS if certificates are available (mTLS for client auth)
    certs_dir = Path("certs")
    ca_cert = certs_dir / "ca.pem"
    server_cert = certs_dir / "server.pem"
    server_key = certs_dir / "server-key.pem"
    
    certificates = None
    if ca_cert.exists() and server_cert.exists() and server_key.exists():
        logger.info("TLS certificates found — starting server with mTLS (encrypted + client auth)")
        certificates = (
            ca_cert.read_bytes(),
            server_cert.read_bytes(),
            server_key.read_bytes(),
        )
    else:
        logger.warning(
            "⚠️  No TLS certificates found in certs/ directory. "
            "Running WITHOUT encryption. For production, generate certs and place "
            "ca.pem, server.pem, server-key.pem in the certs/ directory."
        )
    
    server_kwargs = {
        "server_address": server_address,
        "config": fl.server.ServerConfig(num_rounds=settings.num_rounds),
        "strategy": strategy,
    }
    if certificates:
        server_kwargs["certificates"] = certificates
    
    fl.server.start_server(**server_kwargs)

if __name__ == "__main__":
    main()
