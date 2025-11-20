# Watcher API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All agent endpoints require two headers:
- `x-api-key`: Agent API Key
- `x-secret`: Agent Secret

These are provided during agent registration.

---

## Agent Management

### Register New Agent

Creates a new monitoring agent and returns credentials.

**Endpoint:** `POST /agents/register`

**Request Body:**
```json
{
  "name": "Production Server 1",
  "userId": "user-123"
}
```

**Response:** `201 Created`
```json
{
  "id": "agent-unique-id",
  "name": "Production Server 1",
  "apiKey": "api-key-uuid",
  "secret": "secret-uuid",
  "message": "Agent registered successfully. Save these credentials securely!"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server 1",
    "userId": "user-123"
  }'
```

---

### Get Agent Info

Retrieves information about a specific agent.

**Endpoint:** `GET /agents/:agentId`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Response:** `200 OK`
```json
{
  "id": "agent-id",
  "name": "Production Server",
  "status": "online",
  "lastSeen": "2024-11-20T10:30:00Z",
  "apiKey": "api-key",
  "secret": "secret",
  "userId": "user-123",
  "applications": [
    {
      "id": "app-1",
      "name": "API Server",
      "port": 3000,
      "processName": "node",
      "status": "running",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/agents/agent-id \
  -H "x-api-key: your-api-key" \
  -H "x-secret: your-secret"
```

---

### Agent Heartbeat

Sends a heartbeat signal to indicate agent is alive.

**Endpoint:** `POST /agents/:agentId/heartbeat`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Request Body:**
```json
{
  "status": "online"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "agent": {
    "id": "agent-id",
    "status": "online",
    "lastSeen": "2024-11-20T10:30:00Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/agents/agent-id/heartbeat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -H "x-secret: your-secret" \
  -d '{"status": "online"}'
```

---

## Application Management

### Register Application

Registers an application to be monitored by an agent.

**Endpoint:** `POST /agents/:agentId/applications`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Request Body:**
```json
{
  "name": "Web API",
  "port": 3000,
  "processName": "node",
  "url": "http://localhost:3000"
}
```

**Response:** `201 Created`
```json
{
  "id": "app-uuid",
  "name": "Web API",
  "port": 3000,
  "processName": "node",
  "url": "http://localhost:3000",
  "status": "unknown",
  "agentId": "agent-id"
}
```

---

### List Applications

Gets all applications monitored by an agent.

**Endpoint:** `GET /agents/:agentId/applications`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Response:** `200 OK`
```json
[
  {
    "id": "app-1",
    "name": "API Server",
    "port": 3000,
    "processName": "node",
    "status": "running",
    "url": "http://localhost:3000"
  },
  {
    "id": "app-2",
    "name": "Database Sync",
    "port": 5000,
    "processName": "python",
    "status": "running",
    "url": "http://localhost:5000"
  }
]
```

---

## Metrics Collection

### Submit Metrics

Submits performance metrics for an application.

**Endpoint:** `POST /agents/:agentId/metrics`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Request Body:**
```json
{
  "applicationId": "app-123",
  "cpu": 25.5,
  "memory": 512,
  "uptime": 86400,
  "responseTime": 150,
  "requestCount": 1000,
  "errorCount": 2
}
```

**Response:** `201 Created`
```json
{
  "id": "metric-uuid",
  "cpu": 25.5,
  "memory": 512,
  "uptime": 86400,
  "responseTime": 150,
  "requestCount": 1000,
  "errorCount": 2,
  "timestamp": "2024-11-20T10:30:00Z",
  "agentId": "agent-id",
  "applicationId": "app-123"
}
```

**Field Descriptions:**
- `cpu`: CPU usage percentage (0-100)
- `memory`: Memory usage in MB
- `uptime`: Process uptime in seconds
- `responseTime`: Average response time in milliseconds
- `requestCount`: Total number of requests
- `errorCount`: Number of errors

---

### Get Metrics

Retrieves historical metrics for an application.

**Endpoint:** `GET /applications/:applicationId/metrics`

**Query Parameters:**
- `limit`: Number of metrics to return (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": "metric-1",
    "cpu": 25.5,
    "memory": 512,
    "uptime": 86400,
    "responseTime": 150,
    "requestCount": 1000,
    "errorCount": 2,
    "timestamp": "2024-11-20T10:30:00Z"
  },
  {
    "id": "metric-2",
    "cpu": 28.3,
    "memory": 520,
    "uptime": 86401,
    "responseTime": 145,
    "requestCount": 1005,
    "errorCount": 1,
    "timestamp": "2024-11-20T10:35:00Z"
  }
]
```

**Example:**
```bash
curl "http://localhost:3000/api/applications/app-123/metrics?limit=50"
```

---

## Downtime Management

### Report Downtime

Reports that an application is experiencing downtime.

**Endpoint:** `POST /agents/:agentId/downtimes`

**Headers:**
```
x-api-key: your-api-key
x-secret: your-secret
```

**Request Body:**
```json
{
  "applicationId": "app-123",
  "reason": "Process crashed",
  "severity": "critical"
}
```

**Response:** `201 Created`
```json
{
  "id": "downtime-uuid",
  "startTime": "2024-11-20T10:30:00Z",
  "endTime": null,
  "reason": "Process crashed",
  "severity": "critical",
  "resolved": false,
  "clickupTaskId": "task-123",
  "agentId": "agent-id",
  "applicationId": "app-123",
  "application": {
    "id": "app-123",
    "name": "Web API"
  },
  "agent": {
    "id": "agent-id",
    "name": "Production Server"
  }
}
```

**Severity Levels:**
- `low`: Minor issue, monitoring
- `medium`: Moderate downtime
- `high`: Significant downtime
- `critical`: Complete failure

---

### Resolve Downtime

Marks a downtime incident as resolved.

**Endpoint:** `PATCH /downtimes/:downtimeId`

**Request Body:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "id": "downtime-uuid",
  "startTime": "2024-11-20T10:30:00Z",
  "endTime": "2024-11-20T10:45:00Z",
  "reason": "Process crashed",
  "severity": "critical",
  "resolved": true,
  "clickupTaskId": "task-123"
}
```

---

### Get Downtimes

Retrieves downtime incidents.

**Endpoint:** `GET /downtimes`

**Query Parameters:**
- `applicationId`: Filter by application
- `agentId`: Filter by agent
- `limit`: Number of results (default: 50)

**Response:** `200 OK`
```json
[
  {
    "id": "downtime-1",
    "startTime": "2024-11-20T10:30:00Z",
    "endTime": null,
    "reason": "Connection timeout",
    "severity": "high",
    "resolved": false,
    "application": {
      "id": "app-1",
      "name": "API Server"
    },
    "agent": {
      "id": "agent-1",
      "name": "Production Server"
    }
  }
]
```

**Example:**
```bash
# Get all active downtime incidents
curl "http://localhost:3000/api/downtimes"

# Get downtime for specific application
curl "http://localhost:3000/api/downtimes?applicationId=app-123"

# Get last 20 incidents
curl "http://localhost:3000/api/downtimes?limit=20"
```

---

## Dashboard Endpoints

### Get Summary

Retrieves overall dashboard summary statistics.

**Endpoint:** `GET /dashboard/summary`

**Response:** `200 OK`
```json
{
  "totalAgents": 5,
  "onlineAgents": 4,
  "totalApplications": 12,
  "activeDowntimes": 1
}
```

---

### Get All Agents

Retrieves all agents with their details.

**Endpoint:** `GET /dashboard/agents`

**Response:** `200 OK`
```json
[
  {
    "id": "agent-1",
    "name": "Production Server 1",
    "status": "online",
    "lastSeen": "2024-11-20T10:30:00Z",
    "applications": [
      {
        "id": "app-1",
        "name": "API Server",
        "port": 3000,
        "status": "running"
      },
      {
        "id": "app-2",
        "name": "Workers",
        "port": 3001,
        "status": "running"
      }
    ],
    "_count": {
      "downtimes": 2
    }
  },
  {
    "id": "agent-2",
    "name": "Production Server 2",
    "status": "offline",
    "lastSeen": "2024-11-20T09:00:00Z",
    "applications": [],
    "_count": {
      "downtimes": 0
    }
  }
]
```

---

## Error Responses

All errors return appropriate HTTP status codes:

**400 Bad Request**
```json
{
  "error": "Name and userId are required"
}
```

**401 Unauthorized**
```json
{
  "error": "Missing API key or secret"
}
```

**404 Not Found**
```json
{
  "error": "Agent not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Database connection error"
}
```

---

## Example Workflow

### 1. Register Agent
```bash
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "userId": "user-1"
  }'
```

Response:
```json
{
  "id": "agent-abc123",
  "apiKey": "key-xyz",
  "secret": "secret-xyz"
}
```

### 2. Register Applications
```bash
curl -X POST http://localhost:3000/api/agents/agent-abc123/applications \
  -H "Content-Type: application/json" \
  -H "x-api-key: key-xyz" \
  -H "x-secret: secret-xyz" \
  -d '{
    "name": "API",
    "port": 3000,
    "processName": "node"
  }'
```

### 3. Send Heartbeat
```bash
curl -X POST http://localhost:3000/api/agents/agent-abc123/heartbeat \
  -H "Content-Type: application/json" \
  -H "x-api-key: key-xyz" \
  -H "x-secret: secret-xyz" \
  -d '{"status": "online"}'
```

### 4. Submit Metrics
```bash
curl -X POST http://localhost:3000/api/agents/agent-abc123/metrics \
  -H "Content-Type: application/json" \
  -H "x-api-key: key-xyz" \
  -H "x-secret: secret-xyz" \
  -d '{
    "applicationId": "app-abc123",
    "cpu": 25,
    "memory": 512,
    "uptime": 86400
  }'
```

### 5. View Dashboard
```bash
curl http://localhost:3000/api/dashboard/summary
curl http://localhost:3000/api/dashboard/agents
```

---

## Rate Limiting (Future)

Currently no rate limiting is implemented. In production, consider implementing:

- Per-agent API key rate limits
- Per-IP rate limits
- Burst protection

---

## Versioning

API Version: `1.0.0`

Future versions will maintain backwards compatibility.
