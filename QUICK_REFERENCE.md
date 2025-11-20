# Quick Reference Card

Print this page and keep it handy!

---

## Key Commands

### Server
```bash
# Start development
cd server && npm run dev

# Build for production
npm run build

# Database migrations
npm run prisma:migrate

# View database UI
npm run prisma:studio

# Check status
sudo systemctl status watcher-server

# View logs
sudo journalctl -u watcher-server -f
```

### Agent
```bash
# Start development
cd agent && npm run dev

# Build for production
npm run build

# Interactive setup
chmod +x install.sh && ./install.sh

# Check status
sudo systemctl status watcher-agent

# View logs
sudo journalctl -u watcher-agent -f

# Restart service
sudo systemctl restart watcher-agent
```

### Dashboard
```bash
# Start development
cd dashboard && npm start

# Build for production
npm run build

# Production serve
npm start
```

---

## API Endpoints

```
POST   /api/agents/register                           Register agent
GET    /api/agents/:agentId                           Get agent info
POST   /api/agents/:agentId/heartbeat                Send heartbeat

POST   /api/agents/:agentId/applications              Register app
GET    /api/agents/:agentId/applications              List apps

POST   /api/agents/:agentId/metrics                   Submit metrics
GET    /api/applications/:applicationId/metrics      Get metrics

POST   /api/agents/:agentId/downtimes                Report downtime
PATCH  /api/downtimes/:downtimeId                    Resolve downtime
GET    /api/downtimes                                Get all downtimes

GET    /api/dashboard/summary                        Dashboard summary
GET    /api/dashboard/agents                         All agents
```

---

## Headers (Agent Auth)

Required for all agent endpoints:
```
x-api-key: your-api-key
x-secret: your-secret
```

---

## Environment Variables

### Server
```
DATABASE_URL          PostgreSQL connection URL
JWT_SECRET           Random secret string
PORT                 Server port (default: 3000)
NODE_ENV             development or production
CLICKUP_API_TOKEN    ClickUp API token
CLICKUP_WORKSPACE_ID ClickUp workspace ID
CLICKUP_LIST_ID      ClickUp list ID
```

### Agent
```
WATCHER_SERVER_URL   Server URL (http://localhost:3000)
AGENT_ID             From registration
API_KEY              From registration
SECRET               From registration
AGENT_NAME           Display name
MONITOR_APPS         name:port:processName (comma-separated)
```

---

## Database Connection

```bash
# Test PostgreSQL
psql postgresql://user:password@localhost:5432/watcher

# Create database
createdb watcher

# Create user
createuser watcher

# Grant permissions
psql -c "ALTER USER watcher WITH PASSWORD 'secure_password';"
psql -c "ALTER ROLE watcher CREATEDB;"

# Backup
pg_dump watcher > backup.sql

# Restore
psql watcher < backup.sql
```

---

## Systemd Service Files

### Server Service
```
/etc/systemd/system/watcher-server.service
```

### Agent Service
```
/etc/systemd/system/watcher-agent.service
```

### Commands
```bash
sudo systemctl daemon-reload
sudo systemctl enable SERVICE_NAME
sudo systemctl start SERVICE_NAME
sudo systemctl stop SERVICE_NAME
sudo systemctl restart SERVICE_NAME
sudo systemctl status SERVICE_NAME
sudo journalctl -u SERVICE_NAME -f
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Agent offline | Check WATCHER_SERVER_URL, restart agent |
| No metrics | Verify process name with `ps aux` |
| Database error | Check DATABASE_URL, test connection |
| ClickUp not working | Verify credentials, check server logs |
| Port in use | `lsof -i :3000`, `kill -9 PID` |
| Permission denied | Check file ownership and permissions |

---

## Test Commands

```bash
# Test server API
curl http://localhost:3000/api/dashboard/summary

# Register agent
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","userId":"user1"}'

# Test agent auth
curl http://localhost:3000/api/agents/agent-id \
  -H "x-api-key: YOUR_KEY" \
  -H "x-secret: YOUR_SECRET"

# Send metrics
curl -X POST http://localhost:3000/api/agents/agent-id/metrics \
  -H "x-api-key: YOUR_KEY" \
  -H "x-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"app-id","cpu":25,"memory":512,"uptime":3600}'

# Get downtimes
curl http://localhost:3000/api/downtimes | jq
```

---

## File Structure

```
server/
  src/index.ts              ← All server code
  prisma/schema.prisma      ← Database schema
  package.json
  .env                      ← Config (create from .env.example)

agent/
  src/index.ts              ← All agent code
  package.json
  .env                      ← Config (create from .env.example)
  install.sh                ← Interactive setup
  install-service.sh        ← Systemd setup

dashboard/
  src/App.tsx               ← Main component
  src/components/           ← React components
  src/App.css               ← Styles
  package.json
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| README.md | Complete documentation |
| QUICKSTART.md | 5-minute quick start |
| API.md | Full API reference |
| DEPLOYMENT.md | Production deployment guide |
| EXAMPLES.md | Real-world examples |
| TROUBLESHOOTING.md | FAQ & common issues |
| PRE_DEPLOYMENT_CHECKLIST.md | Deployment checklist |

---

## URL Endpoints (Examples)

```
Development:
  Server:    http://localhost:3000
  Dashboard: http://localhost:3000 (React dev server)

Production:
  Server API:  https://api.watcher.example.com
  Dashboard:   https://watcher.example.com
```

---

## Key Statistics

```
Agents:           Limited by server resources (~1000 per server)
Applications:     Unlimited (multiple per agent)
Metrics:          Collected every 60 seconds
Heartbeat:        Every 30 seconds
ClickUp Tasks:    Created on downtime detection
Metrics Stored:   All historical data (prune old data manually)
```

---

## Default Ports

| Service | Port | Notes |
|---------|------|-------|
| Server | 3000 | Configurable via PORT env |
| PostgreSQL | 5432 | Standard |
| React Dev | 3000 | Can be changed by react-scripts |
| Application 1 | 3000 | Example |
| Application 2 | 3001 | Example |

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized (missing auth) |
| 404 | Not found |
| 500 | Server error |

---

## Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs postgres

# Access database
docker exec -it watcher-db psql -U watcher -d watcher
```

---

## Git Workflow

```bash
# Initial setup
git clone <repo>
cd watcher

# Setup dev environment
chmod +x setup-dev.sh
./setup-dev.sh

# Make changes
git add .
git commit -m "Description"
git push

# Deploy
git pull
npm install
npm run build
```

---

## Performance Tuning

```bash
# Reduce collection interval (agent)
# Edit: agent/src/index.ts, line 67-69

# Limit metrics history (server)
# Delete old metrics monthly:
psql watcher -c "DELETE FROM metrics WHERE timestamp < now() - interval '30 days';"

# Monitor database size
du -h /var/lib/postgresql/data/

# Check agent memory usage
ps aux | grep "node.*agent" | grep -v grep
```

---

## Security Reminders

- ✓ Use HTTPS in production
- ✓ Keep .env files private (never commit)
- ✓ Use strong JWT_SECRET (openssl rand -base64 32)
- ✓ Rotate API keys regularly
- ✓ Don't run agents as root
- ✓ Firewall production servers
- ✓ Enable SSL on PostgreSQL
- ✓ Use strong database passwords

---

## Debug Mode

```bash
# Server debug
DEBUG=* npm run dev

# Node debug
node --inspect dist/index.js
# Open: chrome://inspect

# Browser DevTools
# F12 in dashboard

# PostgreSQL debug
psql -d watcher
\d agents
\d applications
\d metrics
SELECT * FROM agents;
```

---

## Support Resources

- GitHub Issues: <repo>/issues
- Documentation: See README.md
- API Docs: See API.md
- Examples: See EXAMPLES.md
- Troubleshooting: See TROUBLESHOOTING.md

---

## Useful Scripts

```bash
# Setup development
./setup-dev.sh

# Install agent
cd agent && ./install.sh

# Install as service
sudo ./install-service.sh

# Test API
curl http://localhost:3000/api/dashboard/summary
```

---

## Remember

1. **Start Simple:** Begin with 1 server, 1-2 apps
2. **Test First:** Use staging before production
3. **Monitor Yourself:** Set up self-monitoring
4. **Document Changes:** Keep runbooks updated
5. **Backup Regularly:** Test restore procedures
6. **Review Metrics:** Check trends, not just current state
7. **Alert Smartly:** Avoid alert fatigue

---

## Contact & Help

- Check logs first: `journalctl -u watcher-*`
- Review error messages in detail
- Test with curl before debugging code
- Check database connectivity
- Verify network connectivity
- Search documentation
- Review EXAMPLES.md for similar scenarios

---

**Last Updated:** November 20, 2024
**Version:** 1.0.0
**Status:** Production Ready ✓

---

Keep this handy for quick reference!
