# Watcher - Implementation Summary

## Project Overview

You now have a **complete application monitoring system** designed to monitor multiple applications across different Digital Ocean servers and send alerts to ClickUp. The system consists of three main components:

### 1. **Dashboard** (Frontend)
- React-based web interface
- Real-time agent status monitoring
- Application performance tracking
- Downtime alerts with severity levels
- One-click agent registration

### 2. **Server** (Backend API)
- Node.js + Express REST API
- PostgreSQL database with Prisma ORM
- Agent registration and authentication
- Metrics collection and storage
- ClickUp integration for downtime alerts
- Security with API keys and secrets

### 3. **Agent** (Monitoring Software)
- Lightweight Node.js application
- Runs on each server to be monitored
- Monitors local applications by process name
- Collects CPU, memory, and uptime metrics
- Reports downtime automatically
- Sends heartbeats to dashboard

---

## Project Structure

```
watcher/
├── server/                    # Backend API
│   ├── src/
│   │   └── index.ts          # Express server with all endpoints
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── agent/                     # Monitoring agent
│   ├── src/
│   │   └── index.ts          # Agent application
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── install.sh            # Interactive installation script
│   └── install-service.sh    # Systemd service setup
│
├── dashboard/                # React dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── DashboardSummary.tsx
│   │       ├── AgentsList.tsx
│   │       ├── DowntimeAlerts.tsx
│   │       ├── MetricsChart.tsx
│   │       └── AddAgentModal.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── tsconfig.node.json
│
├── docker-compose.yml        # PostgreSQL setup for development
├── setup-dev.sh              # Development environment setup
├── .gitignore
│
├── README.md                 # Full documentation
├── QUICKSTART.md             # Quick start guide
├── DEPLOYMENT.md             # Production deployment guide
└── API.md                    # Complete API documentation
```

---

## Key Features

### ✅ Agent Registration
- Simple one-click registration from dashboard
- Automatic generation of unique credentials
- Secure API key + secret authentication

### ✅ Application Monitoring
- Monitor any number of applications per server
- Track by process name and port
- Automatic status detection (running/stopped)
- Real-time status updates

### ✅ Performance Metrics
- CPU usage tracking
- Memory consumption monitoring
- Uptime tracking
- Response time metrics (extensible)
- Request/error counting

### ✅ Downtime Detection
- Automatic process crash detection
- Manual downtime reporting
- Severity levels (low, medium, high, critical)
- Automatic ClickUp task creation
- Dashboard alerts

### ✅ ClickUp Integration
- Automatic task creation on downtime
- Configurable task priority
- Includes app name, agent name, and timestamp
- Task reference stored in database

### ✅ Dashboard
- Real-time agent status
- Application status overview
- Active downtime alerts
- Easy agent management
- Beautiful, responsive UI

### ✅ Production Ready
- Systemd service setup
- Docker Compose for development
- Environment-based configuration
- Database migrations
- Error handling and logging

---

## Quick Start (5 Minutes)

### 1. Start PostgreSQL
```bash
docker-compose up -d postgres
```

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database URL
npm run prisma:migrate
npm run dev
```

### 3. Setup Agent
```bash
cd agent
npm install
cp .env.example .env
# Fill in:
# WATCHER_SERVER_URL=http://localhost:3000
# AGENT_NAME=my-agent
# MONITOR_APPS=myapp:3000:node
npm run dev
```

### 4. Start Dashboard
```bash
cd dashboard
npm install
npm start
```

### 5. Register Agent from Dashboard
- Navigate to http://localhost:3000
- Click "Add Agent"
- Get credentials and paste into agent .env

---

## API Endpoints Summary

### Agent Management
- `POST /api/agents/register` - Register new agent
- `GET /api/agents/:agentId` - Get agent details
- `POST /api/agents/:agentId/heartbeat` - Send heartbeat

### Application Management
- `POST /api/agents/:agentId/applications` - Register app
- `GET /api/agents/:agentId/applications` - List apps

### Metrics
- `POST /api/agents/:agentId/metrics` - Submit metrics
- `GET /api/applications/:applicationId/metrics` - Get history

### Downtime
- `POST /api/agents/:agentId/downtimes` - Report downtime
- `PATCH /api/downtimes/:downtimeId` - Resolve downtime
- `GET /api/downtimes` - Get incidents

### Dashboard
- `GET /api/dashboard/summary` - Statistics
- `GET /api/dashboard/agents` - All agents

---

## Environment Configuration

### Server (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/watcher
JWT_SECRET=your-super-secret-key
PORT=3000
CLICKUP_API_TOKEN=your-token
CLICKUP_WORKSPACE_ID=workspace-id
CLICKUP_LIST_ID=list-id
```

### Agent (.env)
```env
WATCHER_SERVER_URL=http://localhost:3000
AGENT_ID=from-dashboard
API_KEY=from-dashboard
SECRET=from-dashboard
AGENT_NAME=my-server
MONITOR_APPS=app1:3000:node,app2:3001:python
```

---

## Database Schema

### Users
- Store dashboard administrators
- Email, password, role

### Agents
- Registered monitoring agents
- Unique API key + secret
- Status tracking
- Last seen timestamp

### Applications
- Apps being monitored
- Port and process name
- Associated agent
- Status

### Metrics
- Performance data points
- CPU, memory, uptime, response time
- Timestamped for historical analysis
- Indexed for fast queries

### Downtimes
- Incident records
- Start/end times
- Severity levels
- ClickUp task references

### ClickupLog
- Integration audit trail
- Success/failure tracking

---

## Deployment Steps

### Production Server Setup
```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y postgresql nodejs

# 2. Clone and setup
git clone <repo> && cd watcher/server
npm install --production
npm run build

# 3. Create systemd service
sudo tee /etc/systemd/system/watcher-server.service << EOF
[Unit]
Description=Watcher Server
After=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/watcher/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
EnvironmentFile=/var/www/watcher/server/.env

[Install]
WantedBy=multi-user.target
EOF

# 4. Start service
sudo systemctl daemon-reload
sudo systemctl enable watcher-server
sudo systemctl start watcher-server
```

### Agent Installation (Per Server)
```bash
cd agent
npm install --production
npm run build
sudo chmod +x install-service.sh
sudo ./install-service.sh
```

See `DEPLOYMENT.md` for complete production setup guide.

---

## Configuration Examples

### Monitor Node.js Apps
```env
MONITOR_APPS=web:3000:node,api:3001:node,workers:3002:node
```

### Monitor Mixed Stack
```env
MONITOR_APPS=nginx:80:nginx,api:8000:python,cache:6379:redis
```

### ClickUp Integration
1. Get API token from ClickUp Settings
2. Find workspace and list IDs in ClickUp
3. Add to server `.env`:
   ```env
   CLICKUP_API_TOKEN=pk_xxxxx
   CLICKUP_WORKSPACE_ID=xxxxx
   CLICKUP_LIST_ID=xxxxx
   ```

---

## Development Tips

### Running All Components Locally

**Terminal 1 - Database:**
```bash
docker-compose up postgres
```

**Terminal 2 - Server:**
```bash
cd server && npm run dev
```

**Terminal 3 - Agent:**
```bash
cd agent && npm run dev
```

**Terminal 4 - Dashboard:**
```bash
cd dashboard && npm start
```

### Database Management
```bash
# View database
npm run prisma:studio

# Create migration
npm run prisma:migrate -- --name "migration_name"

# Reset database (development only!)
npx prisma migrate reset
```

### Testing Endpoints
```bash
# Get summary
curl http://localhost:3000/api/dashboard/summary

# Register agent
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","userId":"test"}'

# Send metrics
curl -X POST http://localhost:3000/api/agents/agent-id/metrics \
  -H "x-api-key: key" -H "x-secret: secret" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"app-id","cpu":25,"memory":512,"uptime":3600}'
```

---

## Security Considerations

### ✅ Already Implemented
- API Key + Secret authentication for agents
- Unique credentials per agent
- Environment-based configuration
- Input validation

### 🔒 Production Enhancements
- Use HTTPS only
- Implement rate limiting
- Add CORS restrictions
- Use strong JWT secrets
- Enable database SSL
- Regular security audits
- Keep dependencies updated

---

## Monitoring Capabilities

### Per-Application
- Process running status
- CPU usage percentage
- Memory consumption
- Uptime tracking
- Response time (if configured)
- Request/error counting

### Per-Agent
- Online/offline status
- Last heartbeat timestamp
- All monitored applications
- Downtime incident count

### System-Wide
- Total agents count
- Online agents count
- Total applications
- Active downtime incidents
- Historical metrics

---

## Extensibility

The system is designed to be extended:

### Add New Metrics
Edit agent `src/index.ts` - `getApplicationMetrics()` method

### Add New Dashboard Features
Create components in `dashboard/src/components/`

### Custom Alerting
Add integration in server `src/index.ts` - `sendToClickup()` function

### Database Enhancements
Modify `server/prisma/schema.prisma` and run migrations

---

## Troubleshooting

### Agent Not Connecting
- Check `WATCHER_SERVER_URL` is correct
- Verify credentials match
- Check network/firewall
- View agent logs

### No Metrics Collected
- Verify process names are correct
- Confirm applications are running
- Check agent logs for errors

### Dashboard Not Loading
- Check server is running on port 3000
- Clear browser cache
- Check browser console for errors

### ClickUp Tasks Not Creating
- Verify API token is valid
- Confirm workspace/list IDs
- Check server network connectivity

See `README.md` for more troubleshooting.

---

## Next Steps

1. **Development:**
   - Run locally with `setup-dev.sh`
   - Test with sample applications
   - Familiarize with API endpoints

2. **Production:**
   - Follow `DEPLOYMENT.md` for setup
   - Configure SSL/HTTPS
   - Setup automated backups
   - Monitor server resources

3. **Customization:**
   - Add additional metrics
   - Extend ClickUp integration
   - Implement custom alerting
   - Build mobile app (future)

4. **Scaling:**
   - Add multiple agents
   - Monitor hundreds of apps
   - Setup high availability
   - Implement load balancing

---

## Support & Documentation

- `README.md` - Complete documentation
- `QUICKSTART.md` - Quick start guide
- `API.md` - Full API reference
- `DEPLOYMENT.md` - Production setup

---

## License

MIT - Use freely for personal and commercial projects

---

## Summary

You now have a **production-ready application monitoring system** with:

✅ Full-stack TypeScript implementation
✅ Real-time dashboard
✅ Lightweight agents
✅ ClickUp integration
✅ Comprehensive documentation
✅ Easy deployment
✅ Scalable architecture

The system is ready to monitor your Digital Ocean applications and alert you on ClickUp when issues occur!
