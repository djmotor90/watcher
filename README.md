# Watcher - Application Monitoring System

A comprehensive monitoring solution for managing multiple applications across different servers. Features a centralized dashboard, lightweight agent system, and ClickUp integration for downtime alerts.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Watcher Dashboard                    │
│                   (React Frontend)                      │
│                                                         │
│  • View all agents and their status                     │
│  • Monitor application performance                      │
│  • View downtime alerts                                 │
│  • Register new agents                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST API
┌──────────────────▼──────────────────────────────────────┐
│               Watcher Server                            │
│           (Node.js + Express + PostgreSQL)              │
│                                                         │
│  • Agent management & registration                      │
│  • Metrics collection & storage                         │
│  • Downtime detection & alerting                        │
│  • ClickUp integration                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────┐      ┌──────▼────────┐
│  Agent #1    │      │  Agent #2     │
│              │      │               │
│ • Monitor    │      │ • Monitor     │
│   Apps       │      │   Apps        │
│ • Collect    │      │ • Collect     │
│   Metrics    │      │   Metrics     │
└──────────────┘      └───────────────┘
(Server 1)            (Server 2)
```

## Project Structure

```
watcher/
├── server/              # Backend API server
│   ├── src/
│   │   └── index.ts    # Express server with API endpoints
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   └── tsconfig.json
├── agent/               # Lightweight agent for monitoring
│   ├── src/
│   │   └── index.ts    # Agent application
│   ├── package.json
│   └── tsconfig.json
├── dashboard/           # React-based dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/  # React components
│   │   └── App.css
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database
- ClickUp API token (optional, for alerting)

### 1. Server Setup

```bash
cd server
npm install
# Copy .env.example to .env and update values
cp .env.example .env

# Update DATABASE_URL in .env
# DATABASE_URL="postgresql://user:password@localhost:5432/watcher"

# Run migrations
npm run prisma:migrate

# Start server
npm run dev
```

The server will run on `http://localhost:3000`

### 2. Agent Setup (on each server to monitor)

```bash
cd agent
npm install
# Copy .env.example to .env and fill in values
cp .env.example .env

# Fill in required fields:
# WATCHER_SERVER_URL=http://your-server:3000
# AGENT_ID=<from dashboard registration>
# API_KEY=<from dashboard registration>
# SECRET=<from dashboard registration>
# AGENT_NAME=production-server-1
# MONITOR_APPS=myapp:3001:node,api:3002:node

# Start agent
npm run dev
```

For production with systemd:

```bash
npm run build
sudo cp dist/* /opt/watcher-agent/
# Create systemd service file (see below)
```

### 3. Dashboard Setup

```bash
cd dashboard
npm install
npm start
```

The dashboard will run on `http://localhost:3000` (React dev server)

## Configuration

### Server Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/watcher
JWT_SECRET=your-super-secret-key
PORT=3000
NODE_ENV=development

# ClickUp Integration (optional)
CLICKUP_API_TOKEN=your-token
CLICKUP_WORKSPACE_ID=your-workspace-id
CLICKUP_LIST_ID=your-list-id
```

### Agent Environment Variables

```env
WATCHER_SERVER_URL=http://localhost:3000
AGENT_ID=unique-agent-id
API_KEY=your-api-key
SECRET=your-secret
AGENT_NAME=production-server

# Applications to monitor
# Format: name:port:processName
MONITOR_APPS=myapp:3001:node,api:3002:python
```

## API Endpoints

### Agent Registration

```bash
POST /api/agents/register
{
  "name": "Production Server",
  "userId": "user-id"
}
```

Response includes `apiKey` and `secret` for agent authentication.

### Agent Heartbeat

```bash
POST /api/agents/:agentId/heartbeat
Headers: x-api-key, x-secret
{
  "status": "online"
}
```

### Submit Metrics

```bash
POST /api/agents/:agentId/metrics
Headers: x-api-key, x-secret
{
  "applicationId": "app-id",
  "cpu": 25.5,
  "memory": 512,
  "uptime": 86400,
  "responseTime": 150,
  "requestCount": 1000,
  "errorCount": 2
}
```

### Report Downtime

```bash
POST /api/agents/:agentId/downtimes
Headers: x-api-key, x-secret
{
  "applicationId": "app-id",
  "reason": "Process crashed",
  "severity": "critical"
}
```

### Get Dashboard Summary

```bash
GET /api/dashboard/summary
```

### Get All Agents

```bash
GET /api/dashboard/agents
```

## Features

### Dashboard
- **Real-time Agent Status**: View online/offline agents
- **Application Monitoring**: Track status of all monitored applications
- **Performance Metrics**: CPU, memory, response time tracking
- **Downtime Alerts**: Active downtime incidents with severity levels
- **Agent Registration**: Easy agent setup with unique credentials

### Agent
- **Process Monitoring**: Monitor running applications by process name
- **Metrics Collection**: CPU, memory, uptime tracking
- **Downtime Detection**: Automatic detection when processes stop
- **Heartbeat System**: Regular communication with server
- **Simple Installation**: Easy configuration via environment variables

### Server
- **RESTful API**: Complete API for dashboard and agents
- **Database**: PostgreSQL with Prisma ORM
- **ClickUp Integration**: Automatic task creation on downtime events
- **Agent Management**: Registration, status tracking, security

## ClickUp Integration

When an application goes down, the system automatically creates a ClickUp task:

1. Task is created in your configured ClickUp list
2. Task includes application name, agent name, and timestamp
3. Priority based on severity level (critical > high > medium > low)
4. Task ID is stored for future reference

### Setup ClickUp Integration

1. Get your ClickUp API token from [ClickUp Settings](https://app.clickup.com/settings)
2. Find your Workspace ID and List ID in ClickUp
3. Add to server `.env`:
   ```
   CLICKUP_API_TOKEN=pk_xxxxx
   CLICKUP_WORKSPACE_ID=xxxxx
   CLICKUP_LIST_ID=xxxxx
   ```

## Systemd Service Setup (Ubuntu)

Create `/etc/systemd/system/watcher-agent.service`:

```ini
[Unit]
Description=Watcher Application Monitoring Agent
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/watcher-agent
Environment="NODE_ENV=production"
EnvironmentFile=/opt/watcher-agent/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable watcher-agent
sudo systemctl start watcher-agent
sudo systemctl status watcher-agent
```

## Monitoring Applications

### Basic Setup

1. Register agent from dashboard
2. Configure `.env` with applications:
   ```
   MONITOR_APPS=web:3000:node,api:3001:node,db-sync:5000:python
   ```
3. Start agent
4. Monitor from dashboard

### Application Format

```
name:port:processName
```

- **name**: Display name in dashboard
- **port**: Port application runs on
- **processName**: Exact process name to monitor

## Database Schema

The system uses PostgreSQL with the following main tables:

- **users**: Dashboard users
- **agents**: Monitoring agents
- **applications**: Apps being monitored
- **metrics**: Performance metrics collected
- **downtimes**: Downtime incidents
- **clickup_logs**: ClickUp integration logs

## Development

### Build

```bash
# Server
cd server && npm run build

# Agent
cd agent && npm run build

# Dashboard
cd dashboard && npm run build
```

### Development Mode

```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Agent
cd agent && npm run dev

# Terminal 3 - Dashboard
cd dashboard && npm start
```

## Troubleshooting

### Agent not connecting
- Check `WATCHER_SERVER_URL` is correct
- Verify `AGENT_ID`, `API_KEY`, and `SECRET`
- Check network connectivity to server
- Look at agent logs for errors

### Metrics not being collected
- Verify process names in `MONITOR_APPS` are correct
- Check that applications are running
- Check agent has permission to read process info

### ClickUp tasks not creating
- Verify API token is valid
- Check List ID exists
- Check network connectivity to ClickUp API

## License

MIT

## Support

For issues or questions, refer to the documentation or check server logs.
