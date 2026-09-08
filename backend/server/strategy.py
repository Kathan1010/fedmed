import flwr as fl
import numpy as np
import time
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Union
from flwr.common import Metrics
from server.utils import save_metrics
import logging

logger = logging.getLogger(__name__)

# V17 FIX: Maximum allowed L2 norm for client model updates
MAX_UPDATE_NORM = 10.0


class FedMedStrategy(fl.server.strategy.FedAvg):
    """Custom FedAvg strategy with poisoning defense and anomaly logging."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Latest aggregated global weights, used as the reference point for
        # computing per-client update deltas. None until the first round completes.
        self._global_weights: Optional[List[np.ndarray]] = None

    # V17 FIX: Clip client update DELTAS by L2 norm to limit model poisoning impact.
    # Deltas (client_weights - global_weights) are clipped, not absolute weights,
    # so a legitimately large model norm is never scaled down.
    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, fl.common.FitRes]],
        failures: List[Union[Tuple[fl.server.client_proxy.ClientProxy, fl.common.FitRes], BaseException]],
    ):
        if not results:
            return super().aggregate_fit(server_round, results, failures)

        # GAP 18 FIX: Log client failures
        if failures:
            logger.warning(f"Round {server_round}: {len(failures)} client(s) failed during fit")

        # Round 1 has no prior global reference — aggregate as-is and record it.
        if self._global_weights is not None:
            clipped_results = []
            for client_proxy, fit_res in results:
                params = fl.common.parameters_to_ndarrays(fit_res.parameters)
                delta = [p - g for p, g in zip(params, self._global_weights)]
                delta_norm = float(np.sqrt(sum(float(np.sum(d * d)) for d in delta)))

                if delta_norm > MAX_UPDATE_NORM:
                    logger.warning(
                        f"Round {server_round}: Client update norm {delta_norm:.2f} exceeds "
                        f"max {MAX_UPDATE_NORM}. Clipping."
                    )
                    scale = MAX_UPDATE_NORM / delta_norm
                    params = [g + d * scale for g, d in zip(self._global_weights, delta)]
                    fit_res = fl.common.FitRes(
                        parameters=fl.common.ndarrays_to_parameters(params),
                        num_examples=fit_res.num_examples,
                        metrics=fit_res.metrics,
                        status=fit_res.status,
                    )
                clipped_results.append((client_proxy, fit_res))
            results = clipped_results

        aggregated_params, aggregated_metrics = super().aggregate_fit(server_round, results, failures)

        # Record the new global weights as the reference for next round's delta clipping.
        if aggregated_params is not None:
            self._global_weights = fl.common.parameters_to_ndarrays(aggregated_params)

        return aggregated_params, aggregated_metrics

    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, fl.common.EvaluateRes]],
        failures: List[Union[Tuple[fl.server.client_proxy.ClientProxy, fl.common.EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, fl.common.Scalar]]:
        
        # Call the standard FedAvg aggregation
        aggregated_loss, aggregated_metrics = super().aggregate_evaluate(server_round, results, failures)
        
        # GAP 18 FIX: Log evaluate failures
        if failures:
            logger.warning(f"Round {server_round}: {len(failures)} client(s) failed during evaluate")
        
        if aggregated_loss is not None:
            # GAP 18 FIX: Defensive metric access — check metrics dict exists
            client_accuracies = []
            for _, eval_res in results:
                if eval_res.metrics and "accuracy" in eval_res.metrics:
                    client_accuracies.append(eval_res.metrics["accuracy"])
                else:
                    logger.warning(f"Round {server_round}: Client returned no accuracy metric, skipping")
            
            # Calculate global accuracy (weighted by dataset size)
            if client_accuracies:
                total_examples = sum([eval_res.num_examples for _, eval_res in results])
                global_accuracy = sum(
                    [eval_res.num_examples * eval_res.metrics["accuracy"] for _, eval_res in results]
                ) / total_examples
            else:
                global_accuracy = 0.0

            # Log and save metrics — GAP 10 FIX: add timestamp
            metrics_dict = {
                "loss": round(float(aggregated_loss), 4),
                "accuracy": round(float(global_accuracy), 4),
                "client_accuracies": [round(a, 4) for a in client_accuracies],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            logger.info(f"Round {server_round} aggregated metrics: {metrics_dict}")
            save_metrics(server_round, metrics_dict)
            
            # V18 FIX: Clamp ROUND_DELAY to [0, 30] to prevent DoS via env var
            try:
                round_delay = float(os.environ.get("ROUND_DELAY", "1.5"))
                round_delay = min(max(round_delay, 0.0), 30.0)
            except (ValueError, OverflowError):
                round_delay = 1.5
            
            if round_delay > 0:
                time.sleep(round_delay)
            
            if aggregated_metrics is None:
                aggregated_metrics = {}
            aggregated_metrics["accuracy"] = global_accuracy

        return aggregated_loss, aggregated_metrics
