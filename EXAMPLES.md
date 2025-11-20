# Real-World Usage Examples

## Example 1: Monitoring a Single Digital Ocean Droplet

### Scenario
You have a Node.js web application running on a Digital Ocean Droplet.

**Applications to monitor:**
- Main API server on port 3000
- Background worker on port 3001
- Cache service (Redis) on port 6379

### Step 1: Register Agent from Dashboard

```bash
# Navigate to http://your-dashboard-url
# Click "Add Agent"
# Enter:
# - Agent Name: "prod-droplet-1"
# - User ID: "team-lead"

# You'll receive:
# - Agent ID: abc123xyz
# - API Key: key-uuid-here
# - Secret: secret-uuid-here
```

### Step 2: Install Agent on Droplet

```bash
# SSH to droplet
ssh root@your.droplet.ip

# Get the agent code
git clone <repo> && cd watcher/agent

# Create .env
cat > .env << EOF
WATCHER_SERVER_URL=https://api.watcher.yourcompany.com
AGENT_ID=abc123xyz
API_KEY=key-uuid-here
SECRET=secret-uuid-here
AGENT_NAME=prod-droplet-1
MONITOR_APPS=api:3000:node,workers:3001:node,redis:6379:redis-server
EOF

# Build and install
npm install --production
npm run build
sudo chmod +x install-service.sh
sudo ./install-service.sh

# Check status
sudo systemctl status watcher-agent
```

### Step 3: Monitor from Dashboard

```
✓ Agent shows "online"
✓ Three applications listed: API, Workers, Redis
✓ CPU/Memory metrics collecting
✓ If API crashes → ClickUp task created automatically
```

---

## Example 2: Multi-Server Monitoring

### Scenario
You're monitoring a production environment with 3 servers:
- Server 1: Web API
- Server 2: Workers
- Server 3: Database backup scripts

### Installation Script

Create `deploy-agents.sh`:

```bash
#!/bin/bash

SERVERS=("api.prod.com" "worker.prod.com" "backup.prod.com")
AGENT_IDS=("agent-api" "agent-worker" "agent-backup")
API_KEYS=("key-api" "key-worker" "key-backup")
SECRETS=("secret-api" "secret-worker" "secret-backup")

for i in "${!SERVERS[@]}"; do
  SERVER=${SERVERS[$i]}
  AGENT_ID=${AGENT_IDS[$i]}
  API_KEY=${API_KEYS[$i]}
  SECRET=${SECRETS[$i]}
  
  echo "Installing agent on $SERVER..."
  
  ssh -i ~/.ssh/prod-key root@$SERVER << EOF
    cd /tmp
    git clone <repo> && cd watcher/agent
    
    cat > .env << ENVEOF
WATCHER_SERVER_URL=https://api.watcher.yourcompany.com
AGENT_ID=$AGENT_ID
API_KEY=$API_KEY
SECRET=$SECRET
AGENT_NAME=prod-$SERVER
MONITOR_APPS=app:3000:node
ENVEOF
    
    npm install --production
    npm run build
    sudo chmod +x install-service.sh
    sudo ./install-service.sh
    sudo systemctl restart watcher-agent
EOF
  
  echo "✓ Agent installed on $SERVER"
done
```

Run it:
```bash
chmod +x deploy-agents.sh
./deploy-agents.sh
```

---

## Example 3: Complex Application Stack

### Scenario
E-commerce platform with multiple interconnected services.

**Server 1: Web Frontend**
```env
MONITOR_APPS=nginx:80:nginx,web-app:3000:node,frontend-api:3001:node
```

**Server 2: Backend API**
```env
MONITOR_APPS=api:8000:python,graphql:8001:node,auth:8002:java
```

**Server 3: Data Layer**
```env
MONITOR_APPS=postgres:5432:postgres,redis:6379:redis-server,elasticsearch:9200:java
```

**Server 4: Workers & Cronjobs**
```env
MONITOR_APPS=email-worker:3000:node,payment-processor:3001:python,image-processor:3002:node
```

### Dashboard View
```
Agents: 4 online
Applications: 12 total
Active Downtime: 0

✓ web-app: running (API: 25% CPU, 340MB RAM)
✓ api: running (API: 18% CPU, 512MB RAM)
✓ postgres: running (Database: 10% CPU, 1.2GB RAM)
✓ email-worker: running (Worker: 5% CPU, 128MB RAM)
✓ image-processor: running (Worker: 45% CPU, 256MB RAM)
...
```

### ClickUp Integration

When `image-processor` crashes:
1. Agent detects process not running
2. Server creates downtime incident
3. ClickUp task created automatically:
   ```
   [CRITICAL] image-processor is DOWN
   Agent: Production Worker Server
   Time: Nov 20, 10:32 AM UTC
   ```
4. Team notified in ClickUp
5. OnCall engineer investigates
6. Process restarted
7. Downtime marked as resolved

---

## Example 4: Staging Environment Monitoring

### Scenario
You want to monitor staging environment for testing.

### Setup

```env
# staging-agent/.env
WATCHER_SERVER_URL=https://api.watcher.yourcompany.com
AGENT_ID=staging-agent
API_KEY=staging-key
SECRET=staging-secret
AGENT_NAME=staging-server
MONITOR_APPS=staging-web:3000:node,staging-api:3001:node
```

### Benefits
- Test new features before production
- Catch issues before they reach production
- Monitor staging deployments
- Performance benchmarking

---

## Example 5: Blue-Green Deployment Monitoring

### Scenario
Running blue-green deployments with health checks.

**Before deployment:**
```env
# Blue environment (current production)
MONITOR_APPS=api-blue:3000:node,workers-blue:3001:node

# Green environment (new version)
MONITOR_APPS=api-green:3002:node,workers-green:3003:node
```

**Monitoring during switch:**
```
Dashboard shows:
  Blue version:  ✓ All services running
  Green version: ✓ All services running, metrics good
  
  Switching traffic...
  
  Blue version:  Slowly reduced traffic
  Green version: ✓ Handling full load, metrics excellent
  
  Blue version:  Shutdown
  Green version: ✓ Monitoring complete
```

---

## Example 6: Microservices Architecture

### Scenario
Netflix-style microservices setup.

**Services to monitor:**
- User Service: port 5001
- Product Service: port 5002
- Order Service: port 5003
- Payment Service: port 5004
- Notification Service: port 5005
- API Gateway: port 3000

### Configuration

```env
MONITOR_APPS=\
api-gateway:3000:node,\
user-service:5001:node,\
product-service:5002:python,\
order-service:5003:java,\
payment-service:5004:go,\
notification-service:5005:node
```

### Dashboard Insights

```
Total Requests: 1.2M/min
Average Response Time: 145ms
Error Rate: 0.001%
Slowest Service: payment-service (250ms)
```

---

## Example 7: Database & Backup Monitoring

### Scenario
Monitoring databases and backup processes.

```env
MONITOR_APPS=\
postgresql:5432:postgres,\
mysql:3306:mysqld,\
mongodb:27017:mongod,\
backup-script:0:bash,\
replication-check:0:python
```

### Alert Scenarios

**Database goes down:**
```
[CRITICAL] postgresql is DOWN
→ ClickUp: Page on-call DBA
→ Auto-disable write operations
→ Failover to replica
```

**Backup fails:**
```
[HIGH] backup-script is DOWN
→ ClickUp: Alert backup admin
→ Manual backup triggered
→ Email sent to team
```

---

## Example 8: Monitoring Agent Health Itself

### Scenario
Monitor the Watcher server components.

**Create monitoring agent on dashboard server:**

```env
WATCHER_SERVER_URL=http://localhost:3000
AGENT_ID=watcher-self-monitor
API_KEY=self-monitor-key
SECRET=self-monitor-secret
AGENT_NAME=dashboard-server
MONITOR_APPS=watcher-server:3000:node,postgres:5432:postgres
```

**Benefits:**
- Know if Watcher server goes down
- Monitor database health
- Track Watcher's own metrics
- Self-healing infrastructure

---

## Example 9: Alerting Scenarios

### Scenario 1: Application Crashes

```timeline
10:30:05 - API server crashes
10:30:07 - Agent detects process gone
10:30:08 - Server reports downtime
10:30:09 - ClickUp task created [CRITICAL]
10:30:10 - Dashboard shows alert
10:30:12 - Engineer notified
10:30:45 - Engineer restarts service
10:31:00 - Agent detects process running again
10:31:02 - Downtime marked resolved
10:31:03 - ClickUp task closed
```

### Scenario 2: High Memory Usage

```
Agent collects metrics every minute:
- 10:00 - Memory: 512MB (normal)
- 10:01 - Memory: 620MB (warning)
- 10:02 - Memory: 750MB (warning)
- 10:03 - Memory: 890MB (approaching limit)

Dashboard shows trend chart:
[Graph with upward trend]

Engineer can:
1. Increase allocated memory
2. Optimize code
3. Enable auto-restart at threshold
```

### Scenario 3: Slow Response Times

```
Response time metrics:
- 10:00 - 45ms (normal)
- 10:15 - 150ms (slow)
- 10:30 - 350ms (very slow)
- 10:45 - 50ms (recovered)

Agent can create alert if threshold exceeded:
[MEDIUM] API response time slow
→ Check database performance
→ Check network latency
→ Check server load
```

---

## Example 10: Scaling from 1 to 100 Servers

### Month 1: Single Server
```env
AGENT_ID=agent-1
MONITOR_APPS=api:3000:node
```
Dashboard: 1 agent, 1 app

### Month 3: 5 Servers
```bash
# Agent 1-5, manually register each
# Each monitors 2-3 apps
```
Dashboard: 5 agents, 12 apps

### Month 6: 20 Servers
```bash
# Use deployment script to install agents
# Generate credentials in bulk
# Automated provisioning
```
Dashboard: 20 agents, 45 apps

### Month 12: 100 Servers
```bash
# Containerized agent deployment
# Kubernetes integration (future)
# Auto-discovery of applications
# Distributed alerting
```
Dashboard: 100 agents, 250+ apps

---

## Troubleshooting Real-World Scenario

### Situation
Customer reports slowness, you see this in dashboard:

```
Agent: prod-server-3
Status: offline (last seen 15 min ago)
App 1: Workers - unknown status
App 2: API - unknown status
```

### Investigation
```bash
# SSH to server
ssh prod-server-3

# Check agent
sudo systemctl status watcher-agent
→ Status: inactive (dead)

# Check logs
sudo journalctl -u watcher-agent -n 50
→ "Connection refused to http://api.watcher.com:3000"

# Check network
curl https://api.watcher.company.com/api/dashboard/summary
→ No response (firewall issue)

# Fix
# Firewall rule was removed, re-enable:
sudo ufw allow 443

# Restart agent
sudo systemctl restart watcher-agent

# Dashboard updates
# Agent: prod-server-3 - back online!
# Apps: All running and reporting metrics
```

---

## Tips & Best Practices

### ✅ DO
- Monitor critical applications first
- Start with 1 agent, add more as needed
- Test in staging before production
- Keep .env files secure
- Review metrics regularly
- Set appropriate alert thresholds
- Document your monitoring setup

### ❌ DON'T
- Don't monitor too many apps (use multiple agents instead)
- Don't ignore offline agents
- Don't create ClickUp tasks for every alert (will get ignored)
- Don't forget to backup configurations
- Don't hardcode credentials in code
- Don't run agents as root (security risk)
- Don't ignore database growth

---

## Scaling Tips

1. **Start small:** 1 server, 5 apps
2. **Scale gradually:** Add servers as needed
3. **Automate setup:** Create deployment scripts
4. **Monitor the monitors:** Watch Watcher itself
5. **Optimize over time:** Reduce noise, improve accuracy
6. **Maintain documentation:** Keep team informed
7. **Plan for growth:** Design with scalability in mind

---

## Integration Examples

### With CI/CD (GitHub Actions)

```yaml
- name: Deploy and Register Agent
  run: |
    ssh deploy@server "cd watcher && git pull && npm install"
    curl -X POST $WATCHER_API/agents/register \
      -H "Content-Type: application/json" \
      -d '{"name":"new-server","userId":"ci-deploy"}'
```

### With Infrastructure as Code (Terraform)

```hcl
resource "digitalocean_droplet" "app_server" {
  name   = "prod-app-server"
  user_data = file("${path.module}/install-watcher.sh")
}
```

### With Kubernetes (Future)

```yaml
spec:
  containers:
  - name: watcher-agent
    image: watcher:agent
    env:
    - name: WATCHER_SERVER_URL
      value: "https://api.watcher.io"
```

---

That's it! These examples show Watcher handling everything from single server monitoring to enterprise-scale infrastructure.
