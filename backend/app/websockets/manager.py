from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, trip_id: int):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)

    def disconnect(self, websocket: WebSocket, trip_id: int):
        if trip_id in self.active_connections:
            self.active_connections[trip_id].remove(websocket)

    async def broadcast(self, message: dict, trip_id: int):
        if trip_id in self.active_connections:
            for connection in self.active_connections[trip_id]:
                await connection.send_json(message)

ws_manager = ConnectionManager()
