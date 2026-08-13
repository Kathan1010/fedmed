"""Tests for api/ — endpoint tests using httpx.AsyncClient."""
import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.fixture
def api_key():
    """Return the test API key matching settings.secret_key."""
    from config.config import get_settings
    return get_settings().secret_key


@pytest.mark.asyncio
async def test_healthz_returns_200():
    """GET /healthz should return 200 without auth (Docker probe)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_health_returns_200(api_key):
    """GET /api/v1/health should return 200 with valid API key."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"X-API-Key": api_key}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_metrics_returns_200_when_no_file(api_key):
    """GET /api/v1/metrics should return 200 even when metrics.json is missing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/metrics",
            headers={"X-API-Key": api_key}
        )
    assert response.status_code == 200
    data = response.json()
    assert "rounds" in data
    assert "total_rounds_completed" in data
    assert "current_accuracy" in data
    assert "current_loss" in data


@pytest.mark.asyncio
async def test_status_returns_valid_shape(api_key):
    """GET /api/v1/status should return valid StatusResponse shape."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/status",
            headers={"X-API-Key": api_key}
        )
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("idle", "training", "completed")
    assert "current_round" in data
    assert "total_rounds" in data
    assert "connected_clients" in data


@pytest.mark.asyncio
async def test_model_info_returns_200(api_key):
    """GET /api/v1/model-info should return valid ModelInfoResponse."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/model-info",
            headers={"X-API-Key": api_key}
        )
    assert response.status_code == 200
    data = response.json()
    assert "architecture" in data
    assert "total_parameters" in data
    assert "model_size_kb" in data
    assert "save_path" in data
    assert isinstance(data["total_parameters"], int)


@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401():
    """Requests without X-API-Key should get 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/metrics")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_wrong_api_key_returns_403():
    """Requests with wrong API key should get 403."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/metrics",
            headers={"X-API-Key": "wrong-key"}
        )
    assert response.status_code == 403
