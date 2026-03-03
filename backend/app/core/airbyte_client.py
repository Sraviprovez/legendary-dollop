import httpx
import os
from typing import Dict, List, Optional, Any

class AirbyteClient:
    def __init__(self, airbyte_url: str = None):
        self.base_url = airbyte_url or os.getenv("AIRBYTE_API_URL", "http://airbyte-server:8001/api/v1")
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def _post(self, endpoint: str, json_data: Dict = None) -> Dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}{endpoint}", json=json_data)
            response.raise_for_status()
            return response.json()

    async def list_workspaces(self) -> List[Dict]:
        data = await self._post("/workspaces/list", {})
        return data.get("workspaces", [])

    async def list_source_definitions(self, workspace_id: str) -> List[Dict]:
        data = await self._post("/source_definitions/list_for_workspace", {"workspaceId": workspace_id})
        return data.get("sourceDefinitions", [])

    async def list_destination_definitions(self, workspace_id: str) -> List[Dict]:
        data = await self._post("/destination_definitions/list_for_workspace", {"workspaceId": workspace_id})
        return data.get("destinationDefinitions", [])

    async def create_source(self, name: str, source_definition_id: str, workspace_id: str, connection_configuration: Dict) -> Dict:
        return await self._post("/sources/create", {
            "name": name,
            "sourceDefinitionId": source_definition_id,
            "workspaceId": workspace_id,
            "connectionConfiguration": connection_configuration
        })

    async def create_destination(self, name: str, destination_definition_id: str, workspace_id: str, connection_configuration: Dict) -> Dict:
        return await self._post("/destinations/create", {
            "name": name,
            "destinationDefinitionId": destination_definition_id,
            "workspaceId": workspace_id,
            "connectionConfiguration": connection_configuration
        })

    async def create_connection(self, source_id: str, destination_id: str, namespace_definition: str = "source", prefix: str = "") -> Dict:
        return await self._post("/connections/create", {
            "sourceId": source_id,
            "destinationId": destination_id,
            "namespaceDefinition": namespace_definition,
            "prefix": prefix,
            "status": "active"
        })

    async def sync_connection(self, connection_id: str) -> Dict:
        return await self._post("/connections/sync", {"connectionId": connection_id})

    async def get_job_status(self, job_id: int) -> Dict:
        return await self._post("/jobs/get", {"id": job_id})

    async def delete_source(self, source_id: str):
        return await self._post("/sources/delete", {"sourceId": source_id})

    async def check_source_connection(self, source_id: str) -> Dict:
        return await self._post("/sources/check_connection", {"sourceId": source_id})

    async def discover_source_schema(self, source_id: str) -> Dict:
        return await self._post("/sources/discover_schema", {"sourceId": source_id})
