## Quick Start Guide

### For Dashboard Users

1. **Access the Dashboard**
   ```
   http://localhost:3000
   ```

2. **Register New Agent**
   - Click "Add Agent" button
   - Enter agent name and user ID
   - Save the returned API Key and Secret securely

3. **Monitor Applications**
   - View agent status in real-time
   - Check application health and metrics
   - Receive downtime alerts automatically

### For Agent Installation

1. **On Your Server**
   ```bash
   cd agent
   chmod +x install.sh
   ./install.sh
   ```

2. **Answer Configuration Questions**
   - Paste Agent ID, API Key, and Secret from dashboard
   - Configure which applications to monitor
   - Specify process names for each app

3. **Test the Agent**
   ```bash
   npm run dev
   ```

4. **Production Setup (Ubuntu/Debian)**
   ```bash
   npm run build
   sudo chmod +x install-service.sh
   sudo ./install-service.sh
   ```

### Configuration Examples

**Monitor Node.js applications:**
```
MONITOR_APPS=web:3000:node,api:3001:node,workers:3002:node
```

**Monitor mixed applications:**
```
MONITOR_APPS=frontend:80:nginx,backend:8000:python,cache:6379:redis
```

**Single application:**
```
MONITOR_APPS=myapp:3000:node
```

### Check Agent Status

```bash
# View running status
sudo systemctl status watcher-agent

# View recent logs
sudo journalctl -u watcher-agent -n 50

# View logs in real-time
sudo journalctl -u watcher-agent -f

# Restart agent
sudo systemctl restart watcher-agent
```

### Troubleshooting

**Agent shows offline:**
- Check network connectivity to watcher server
- Verify credentials are correct
- Check firewall rules
- View agent logs for errors

**Applications not detected:**
- Verify process names match exactly (case-sensitive)
- Check application is running: `ps aux | grep processName`
- Make sure agent has permission to read process info

**ClickUp tasks not created:**
- Verify ClickUp API token on server
- Check List ID is correct
- Ensure server has internet access
