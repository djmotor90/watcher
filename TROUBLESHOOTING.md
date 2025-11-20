# FAQ & Troubleshooting

## Frequently Asked Questions

### General Questions

**Q: Do I need to modify any code to get started?**
A: No! The system is ready to use. Just fill in the `.env` files with your configuration.

**Q: How many applications can I monitor?**
A: Unlimited. Each agent can monitor any number of applications configured in the `MONITOR_APPS` environment variable.

**Q: How many servers/agents can I have?**
A: Unlimited. Register each agent from the dashboard and install it on your servers.

**Q: Is the agent lightweight?**
A: Yes! The agent uses minimal resources and only collects metrics every 60 seconds by default.

**Q: Can I change the monitoring interval?**
A: Yes. Edit `agent/src/index.ts` and change the intervals in `startMonitoring()`:
```typescript
// Line 66: Heartbeat interval (currently 30 seconds)
this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);

// Line 69: Metrics collection interval (currently 60 seconds)
this.collectionInterval = setInterval(() => this.collectMetrics(), 60000);
```

**Q: Can I monitor applications on the same server as the Watcher server?**
A: Yes! Just install an agent on the same server and configure it to monitor your apps.

**Q: Does the agent require sudo permissions?**
A: For systemd service installation only. The agent itself runs as the `nobody` user.

---

## Installation & Setup Issues

### Docker PostgreSQL not starting

**Error:** `Error response from daemon: driver failed programming external connectivity on endpoint...`

**Solution:**
```bash
# Check Docker is running
docker ps

# If not, start Docker
sudo systemctl start docker

# Try again
docker-compose up postgres
```

### Port already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port - edit server .env:
PORT=3001
```

### PostgreSQL connection refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Make sure PostgreSQL is running
docker-compose ps

# If not running, start it
docker-compose up -d postgres

# Wait a few seconds for it to start
sleep 5

# Check the logs
docker-compose logs postgres
```

### npm install fails

**Error:** `npm ERR! code E404 not found`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still failing, check internet connection
```

---

## Server Setup Issues

### Prisma migration fails

**Error:** `P3018: A migration failed when it was applied to the database`

**Solution:**
```bash
# Reset the database (development only!)
npx prisma migrate reset --force

# Or manually check database connection
psql postgresql://user:password@localhost:5432/watcher

# If database doesn't exist
createdb watcher
```

### JWT_SECRET not set

**Error:** `Cannot read property 'SECRET' of undefined`

**Solution:**
```bash
# Edit server/.env
JWT_SECRET="your-super-secret-key"

# Or generate a random one
openssl rand -base64 32 > .secret
cat .secret
# Copy output to .env
```

---

## Agent Setup Issues

### Agent not connecting to server

**Error:** Agent shows "offline" in dashboard

**Checklist:**
```bash
# 1. Check server URL
grep WATCHER_SERVER_URL agent/.env

# 2. Check credentials are correct
grep "AGENT_ID\|API_KEY\|SECRET" agent/.env

# 3. Test network connectivity
curl http://localhost:3000/api/dashboard/summary

# 4. Check agent logs
npm run dev
# Look for error messages

# 5. Verify firewall allows connection
# On server: Allow incoming on port 3000
sudo ufw allow 3000
```

### Process not detected

**Error:** "Applications showing as unknown/stopped"

**Solution:**
```bash
# 1. Verify process name is correct (case-sensitive)
ps aux | grep "your-process-name"

# 2. Check MONITOR_APPS format
# Should be: name:port:processName
grep MONITOR_APPS agent/.env

# 3. Verify application is actually running
curl http://localhost:3000  # For app on port 3000

# 4. Check agent logs for specific errors
npm run dev
```

### Agent keeps restarting

**Error:** Systemd shows agent restarting constantly

**Solution:**
```bash
# Check the error logs
sudo journalctl -u watcher-agent -f

# Common issues:
# 1. Server not accessible
curl $WATCHER_SERVER_URL/api/dashboard/summary

# 2. Invalid credentials
sudo cat /opt/watcher-agent/.env

# 3. Missing environment variables
env | grep WATCHER

# Fix and restart
sudo systemctl restart watcher-agent
```

---

## Dashboard Issues

### Dashboard not loading

**Error:** Blank page or "Cannot GET /"

**Solution:**
```bash
# 1. Check React dev server is running
npm start

# Should show: "On Your Network: http://..."

# 2. Check port 3000 is available
lsof -i :3000

# 3. Check browser console for errors
# Open DevTools (F12) → Console tab

# 4. Clear cache
rm -rf node_modules/.vite
npm start
```

### API calls failing

**Error:** "Network request failed" in dashboard

**Solution:**
```bash
# 1. Check server is running
curl http://localhost:3000/api/dashboard/summary

# 2. Check CORS is enabled
# Server should have CORS enabled (it does by default)

# 3. Check API URL in dashboard
grep API_BASE dashboard/src/App.tsx
# Should be http://localhost:3000/api

# 4. Check browser console for CORS errors
```

### Metrics not showing

**Error:** Empty metrics chart

**Solution:**
```bash
# 1. Check agent is sending metrics
curl http://localhost:3000/api/applications/app-id/metrics

# 2. Check agent is running
ps aux | grep "agent"

# 3. Check agent logs
sudo journalctl -u watcher-agent -n 50

# 4. Wait for first metrics
# Metrics are collected every 60 seconds
```

---

## Production Deployment Issues

### Systemd service won't start

**Error:** `systemctl status watcher-server` shows failed

**Solution:**
```bash
# 1. Check service logs
sudo journalctl -u watcher-server -n 50

# 2. Check configuration
sudo systemctl show-environment

# 3. Check file permissions
sudo ls -la /var/www/watcher/server/

# 4. Check database connectivity
sudo -u www-data psql postgresql://user:password@localhost/watcher

# 5. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart watcher-server
```

### High memory usage

**Error:** Agent or server consuming too much memory

**Solution:**
```bash
# 1. Check what's using memory
ps aux --sort=-%mem | head

# 2. Reduce metrics collection for agent
# Edit MONITOR_APPS or increase collection interval

# 3. Implement database cleanup
# Add a cron job to delete old metrics:
0 2 * * * psql -d watcher -c \
  "DELETE FROM metrics WHERE timestamp < now() - interval '7 days';"

# 4. Check for memory leaks
# Restart service if needed
sudo systemctl restart watcher-server
```

### Database disk space full

**Error:** `ENOSPC: no space left on device`

**Solution:**
```bash
# 1. Check disk usage
df -h

# 2. Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('watcher'));"

# 3. Delete old metrics
sudo -u postgres psql -d watcher << EOF
DELETE FROM metrics WHERE timestamp < now() - interval '30 days';
VACUUM ANALYZE;
EOF

# 4. Clean up backups
rm /var/backups/watcher/*.sql.gz -older-than 30 days

# 5. Expand disk if needed
# Consult your server provider
```

---

## ClickUp Integration Issues

### Tasks not creating on downtime

**Error:** Downtime reported but no ClickUp task

**Solution:**
```bash
# 1. Check ClickUp credentials are set
grep CLICKUP server/.env

# 2. Verify credentials are correct
# Get from: https://app.clickup.com/settings

# 3. Test API token
curl -H "Authorization: pk_YOUR_TOKEN" \
  https://api.clickup.com/api/v2/user

# 4. Check list ID is correct
curl -H "Authorization: pk_YOUR_TOKEN" \
  https://api.clickup.com/api/v2/list/LIST_ID

# 5. Check server logs
sudo journalctl -u watcher-server | grep -i clickup

# 6. Restart server to apply changes
sudo systemctl restart watcher-server
```

### ClickUp API rate limited

**Error:** "Too many requests" from ClickUp

**Solution:**
```bash
# ClickUp has rate limits
# Free tier: 100 requests per minute
# Pro tier: 1000 requests per minute

# Reduce alert frequency:
# 1. Increase downtime detection threshold
# 2. Set minimum time between alerts
# 3. Upgrade ClickUp plan if needed
```

---

## Performance Optimization

### Database queries are slow

**Solution:**
```bash
# 1. Add database indexes (already included in schema)
# 2. Clean old metrics regularly
DELETE FROM metrics WHERE timestamp < now() - interval '30 days';

# 3. Analyze slow queries
sudo -u postgres psql -d watcher << EOF
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
EOF

# 4. Optimize agent collection interval
# Reduce frequency if using too much resource
```

### Agent using too much CPU

**Solution:**
```bash
# 1. Reduce collection frequency
# Edit agent/src/index.ts line 67, increase interval

# 2. Monitor fewer applications
# Remove unnecessary apps from MONITOR_APPS

# 3. Reduce metric detail
# Simplify the getApplicationMetrics() function
```

### Dashboard slow to load

**Solution:**
```bash
# 1. Check network speed
# Use browser DevTools → Network tab

# 2. Optimize API calls
# Reduce refresh frequency in App.tsx

# 3. Build for production
cd dashboard
npm run build
# Serve the build/ directory

# 4. Use CDN for static assets
```

---

## Monitoring the Monitors

### Monitor agent availability

```bash
# Add this cron job to check agents are online
# /usr/local/bin/check-agents.sh
#!/bin/bash
curl -s http://localhost:3000/api/dashboard/summary | \
  jq '.onlineAgents' | \
  mail -s "Watcher Status" admin@example.com

# Schedule daily
0 9 * * * /usr/local/bin/check-agents.sh
```

### Monitor database

```bash
# Database backup verification
sudo -u postgres pg_dump watcher | \
  gzip > /var/backups/watcher/backup-$(date +%s).sql.gz

# Monitor backup size
du -h /var/backups/watcher/ | tail -1
```

---

## Common Mistakes

### ❌ Not saving agent credentials
**Fix:** Save API Key and Secret immediately after registration
**Prevention:** Screenshot or save to secure password manager

### ❌ Wrong process name
**Fix:** Run `ps aux | grep your-app` to get exact name
**Prevention:** Test process name before adding to MONITOR_APPS

### ❌ Firewall blocking agent
**Fix:** Allow port 3000 on server (or your custom port)
**Prevention:** Open port before installing agent

### ❌ Database URL wrong
**Fix:** Test connection: `psql postgresql://user:pass@host/db`
**Prevention:** Copy URL from database provider exactly

### ❌ Forgetting .env files
**Fix:** Copy .env.example to .env and fill in values
**Prevention:** Add to deployment checklist

---

## Getting Help

### Check the logs
```bash
# Server logs
sudo journalctl -u watcher-server -f

# Agent logs
sudo journalctl -u watcher-agent -f

# Dashboard console
# Browser DevTools → Console tab
```

### Test connectivity
```bash
# Test server
curl http://localhost:3000/api/dashboard/summary

# Test agent
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"test","userId":"test"}'
```

### Review documentation
- See README.md for complete guide
- See API.md for endpoint details
- See DEPLOYMENT.md for production setup

---

## When All Else Fails

```bash
# 1. Check system resources
free -h
df -h
top

# 2. Review all logs
sudo journalctl -xe | tail -100

# 3. Reset development environment
rm -rf node_modules
npm install
npm run dev

# 4. Check Docker
docker ps
docker logs watcher-db

# 5. Hard reset (development only!)
docker-compose down -v
docker-compose up postgres
```

---

## Still Need Help?

1. Check error messages carefully
2. Review relevant documentation section
3. Check system logs with `journalctl`
4. Test with `curl` commands
5. Review the code in `src/` directories

The system is designed to be self-healing - agent disconnects are normal and will reconnect automatically!
