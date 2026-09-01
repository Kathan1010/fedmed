<h1 align="center">FedMed — Healthcare Federated Learning</h1>

<p align="center">
  <strong>Privacy-Preserving Healthcare Analytics at the Edge</strong><br/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-API-009688?logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Flower-FL_Framework-F6D365?logo=flower&logoColor=black"/>
  <img src="https://img.shields.io/badge/PyTorch-ML-EE4C2C?logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/TailwindCSS-Styling-38B2AC?logo=tailwind-css&logoColor=white"/>
</p>

---

## 1. What Is New (Latest Features)

The README has been updated for the latest product behavior across the new frontend and backend integration.

- Fully refactored **Enterprise Monochrome Theme** interface combining high-contrast usability with medical UI design language.
- Added hybrid **Light / Dark Mode toggle** allowing clinicians to seamlessly switch viewing states while retaining accurate data visualization.
- Embedded **Data Distribution Analytics**: New pie and donut charts visualize age demographics and gender ratios without exposing raw underlying datasets.
- Embedded **Real-time System Health Monitoring**: A live area chart monitors simulated CPU and GPU utilization across all connected hospital nodes during active federated training.
- Dynamic Recharts rendering ensuring colors adapt flawlessly between themes to highlight active network states.

---

## 2. System Purpose

FedMed is a federated learning framework where multiple simulated hospital clients collaboratively train a shared neural network **without sharing raw patient data**. Only model weights are transmitted — raw data never leaves each hospital's localized environment.

Core goals:
- Protect raw clinical datasets (imaging, EHR, genomics) in compliance with privacy regulations.
- Train highly accurate, generalized ML models across disparate data silos.
- Provide a clear, transparent, and beautiful dashboard to monitor network state and model convergence in real-time.

This system is a simulation framework for federated training dynamics and is designed to demonstrate decentralized AI capabilities in healthcare.

---

## 3. Architecture Overview

### 3.1 High-level Diagram (Text)

```text
Frontend (React)                       Backend (FastAPI)
------------------                     -----------------------------
Dashboard UI                 --->      /api/v1/start-training
Real-time Metrics            <---      /api/v1/status
Hospital Node State                    Orchestrates FL execution
                                              |
                                              v
                               FedMed FL Server (Flower)
                               (FedAvg Aggregation Strategy)
                                              |
      ┌───────────────────────────────────────┼───────────────────────────────────────┐
      │                                       │                                       │
      v                                       v                                       v
┌─────────────┐                         ┌─────────────┐                         ┌─────────────┐
│  Hospital 1 │      weights            │  Hospital 2 │      weights            │  Hospital 3 │
│  (Client 0) │ ◀─────────────────────▶ │  (Client 1) │ ◀─────────────────────▶ │  (Client 2) │
└─────────────┘                         └─────────────┘                         └─────────────┘
  Local Data                              Local Data                              Local Data
  (Never leaves)                          (Never leaves)                          (Never leaves)
```

---

## 4. Frontend Features

### 4.1 Dashboard Analytics
- Real-time display of Global Model Accuracy, Loss metrics, and Training Rounds.
- Dynamic Data Distribution demographics for network-level metadata insights.
- Live progress bars indicating active round status.

### 4.2 Network Topology & Health
- Visual node map illustrating the connection between the Aggregator server and decentralized Hospitals.
- Real-time System Health Monitor displaying live multi-line CPU/GPU hardware utilization across edge devices.
- Network routing lines illuminate in blue to indicate active weight transfers during training.

### 4.3 Results & Performance
- Bar charts breaking down individual hospital performance against the global model average, highlighting any data biases.
- Transparent "Privacy Inspector" modal proving that no raw Patient IDs or identifiers are ever transmitted.

### 4.4 Theming
- Native Dark/Light mode utilizing Tailwind `dark:` classes and a persistent React `ThemeContext`.

---

## 5. Backend Features

### 5.1 API Layer
- Fast, async-driven FastAPI orchestrator that securely links the frontend to the backend training processes.
- Endpoints to start/stop training, fetch live logs, and read metrics.json output generated by the server.

### 5.2 Federated Learning (FL) Pipeline
- Built on the robust **Flower (flwr)** framework utilizing the `FedAvg` (Federated Averaging) strategy.
- 5 distinctly different Neural Network architectures designed to handle diverse medical data types (Images, Genomics, Wearables, EHRs).
- Defensive strategy implementation gracefully handling client failures mid-round.

### 5.3 Safety Guardrails
- **Gradient Clipping:** Prevents exploding gradients during training `clip_grad_norm_(max_norm=1.0)`.
- **Dropout:** Mitigates overfitting on smaller, localized hospital datasets.
- **Poisoning Defenses:** Norm-clipping on client updates before they reach the central aggregator.

---

## 6. End-to-End Data Flow

1. User clicks "Start Training" in the React frontend.
2. FastAPI backend orchestrator receives the signal and spawns the Flower FL Server and 3 Client processes.
3. The Server issues the initial global model weights to all Clients.
4. Each Hospital Client trains the model on its **local, private dataset** for a set number of epochs.
5. Clients send their updated *weights* (not data) back to the Server.
6. The Server aggregates the weights using `FedAvg` to form a smarter global model, logs the metrics, and triggers the next round.
7. Frontend periodically polls the API, updating the Loss/Accuracy charts and UI dynamically.

---

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TailwindCSS, Recharts, Lucide Icons |
| API | FastAPI, Uvicorn |
| ML Framework | PyTorch (v2.x) |
| FL Framework | Flower (flwr v1.7.x) |
| Data Processing | NumPy, Pandas, Scikit-learn, MedMNIST |
| Containerization | Docker + Docker Compose |

---

## 8. Repository Structure

```text
fedmed/
├── api/              # FastAPI backend (orchestrator)
├── client/           # Flower clients + data loaders
├── config/           # Pydantic settings from .env
├── frontend/         # React + Vite + TailwindCSS dashboard
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
├── server/           # Flower FL server + FedAvg strategy
├── shared/           # Shared PyTorch models + exceptions
├── tests/            # pytest test suite
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 9. Quick Start

### 9.1 Backend Setup (Manual)

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\activate      # Windows
source .venv/bin/activate     # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create environment file (copy .env.example if available)
# Set your SECRET_KEY inside the .env

# 4. Start the FastAPI orchestrator
python -m api.main
```
Backend API will be live at: http://localhost:8000

### 9.2 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Dashboard will be live at: http://localhost:3000

---

## 10. Required Environment Variables

### 10.1 Backend (`.env`)

- `SECRET_KEY` (Required for API Authentication)
- `FL_SERVER_HOST` (Default: localhost)
- `FL_SERVER_PORT` (Default: 8080)
- `API_HOST` (Default: 0.0.0.0)
- `API_PORT` (Default: 8000)
- `NUM_ROUNDS` (Default: 10)
- `NUM_CLIENTS` (Default: 3)
- `DATA_TYPE` (Default: imaging)

### 10.2 Frontend (`frontend/.env`)

- `VITE_API_URL` (Default: http://localhost:8000/api/v1)
- `VITE_API_KEY` (Must match backend SECRET_KEY)

---

## 11. Key Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/healthz` | Unauthenticated health probe |
| GET | `/api/v1/health` | Service health and disk write check |
| GET | `/api/v1/status` | Current training status (idle/training) |
| GET | `/api/v1/metrics` | Fetches aggregated loss, accuracy, and client stats |
| POST| `/api/v1/start-training` | Triggers FL orchestration |
| POST| `/api/v1/stop-training` | Kills running training processes |

---

## 12. Operational Notes

- Ensure `VITE_API_KEY` in the frontend strictly matches `SECRET_KEY` in the backend, or all POST requests will throw 401 Unauthorized errors.
- Training requires significant CPU/RAM depending on the `DATA_TYPE`. If testing locally, ensure you have sufficient memory to run 3 concurrent PyTorch instances.
- The `logs/metrics.json` file is overwritten at the start of every new training session.
