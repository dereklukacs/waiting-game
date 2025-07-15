# Stick Runner Multiplayer Server

A WebSocket-based multiplayer server for the Stick Runner game.

## Features

- WebSocket connections for real-time communication
- User registration with username validation
- No authentication required
- CORS enabled for development

## API

### WebSocket Endpoint
`ws://localhost:8080/ws`

### Message Format
```json
{
  "type": "register|response|error",
  "data": {...},
  "username": "optional"
}
```

### Registration Flow
1. Client connects to WebSocket
2. Client sends register message:
```json
{
  "type": "register",
  "data": {
    "username": "player1"
  }
}
```
3. Server responds with success:
```json
{
  "type": "response",
  "data": {
    "username": "player1",
    "message": "Welcome player1! You have been registered successfully."
  }
}
```

## Running the Server

```bash
go mod tidy
go run main.go
```

The server will start on port 8080.

## Health Check
`GET http://localhost:8080/health`