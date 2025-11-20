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
- Node.js 18+ and npm
- SQLite (included) or PostgreSQL database
- ClickUp API token (optional, for alerting)

### Quick Start

```bash
# 1. Clone and install dependencies
cd watcher
npm install --workspaces

# 2. Configure environment
cp server/.env.example server/.env
cp agent/.env.example agent/.env

# 3. Setup database
cd server && npm run prisma:migrate && cd ..

# 4. Start services
# Terminal 1 - Server
cd server && npm start

# Terminal 2 - Dashboard
cd dashboard && npm start

# Terminal 3 - Agent (on different machine)
cd agent && npm start
```

Dashboard available at: `http://localhost:3001`

### Detailed Setup

#### 1. Server Setup

```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings:
# - DATABASE_URL (SQLite by default)
# - JWT_SECRET (for authentication)
# - ClickUp settings (optional)

# Initialize database
npm run prisma:migrate

# Start server
npm run dev
```

The server runs on `http://localhost:3000`

#### 2. Dashboard Setup

```bash
cd dashboard
npm install
npm start
```

Dashboard runs on `http://localhost:3001`

Access with default test account or create a new one:
- Email: `admin@example.com`
- Password: `password123`

#### 3. Agent Setup (on each server to monitor)

```bash
cd agent
npm install

# Configure environment
cp .env.example .env
# Required settings:
# - WATCHER_SERVER_URL=http://your-server:3000
# - AGENT_NAME=production-server-1
# - MONITOR_APPS=myapp:3001:node,api:3002:node

npm start
```

### Authentication

The dashboard requires user login. See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete details.

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"User"}'
```

## Configuration

### Server Environment Variables

```env
# Database (SQLite by default, change for production)
DATABASE_URL=file:./dev.db

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Server
PORT=3000
NODE_ENV=development

# ClickUp Integration (optional)
CLICKUP_API_TOKEN=your-token
CLICKUP_WORKSPACE_ID=your-workspace-id
CLICKUP_LIST_ID=your-list-id
```

### Agent Environment Variables

```env
# Server connection
WATCHER_SERVER_URL=http://localhost:3000
AGENT_NAME=production-server-1

# Applications to monitor (format: name:port:processName)
MONITOR_APPS=web:3000:node,api:3001:python,cache:6379:redis
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

## Key Features

- **Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **Real-time Dashboard**: Monitor all agents and applications from a web interface
- **Agent Management**: Register and manage lightweight monitoring agents
- **Performance Tracking**: CPU, memory, response time, and request metrics
- **Downtime Alerts**: Automatic detection and notification of application failures
- **ClickUp Integration**: Automatically create tasks for critical incidents
- **RESTful API**: Complete API for dashboard and agent communication

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

## Documentation

- [Authentication Guide](./AUTHENTICATION.md) - User login, signup, and API token usage
- [API Reference](./API.md) - Complete API endpoint documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Quick Reference](./QUICK_REFERENCE.md) - Quick commands and shortcuts

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
