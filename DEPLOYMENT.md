# Deployment Guide

## Overview

This guide covers deploying Watcher in production environments:
- **Server**: Production Node.js server with PostgreSQL
- **Agent**: Systemd service on Ubuntu/Debian servers
- **Dashboard**: Standalone static site or Node.js server

## Prerequisites

### Server Deployment
- Ubuntu/Debian server
- PostgreSQL 12+
- Node.js 16+
- nginx (optional, for reverse proxy)
- Git

### Agent Deployment
- Ubuntu/Debian server
- Node.js 16+
- Sudo access for systemd setup

### Dashboard Deployment
- Any web server or Node.js server
- CDN (optional, for static files)

---

## Server Deployment (Ubuntu/Debian)

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres createdb watcher
sudo -u postgres createuser watcher
sudo -u postgres psql -c "ALTER USER watcher WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE watcher CREATEDB;"
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/yourusername/watcher.git
cd watcher/server

# Install dependencies
npm install --production

# Create production .env
cat > .env << EOF
DATABASE_URL="postgresql://watcher:secure_password@localhost:5432/watcher"
JWT_SECRET="$(openssl rand -base64 32)"
PORT=3000
NODE_ENV=production
CLICKUP_API_TOKEN=your-token
CLICKUP_WORKSPACE_ID=your-workspace
CLICKUP_LIST_ID=your-list
EOF

# Run migrations
npm run prisma:migrate -- --name "initial"

# Build
npm run build
```

### 3. Setup Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/watcher-server.service > /dev/null << EOF
[Unit]
Description=Watcher Application Monitoring Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/watcher/server
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/watcher/server/.env
ExecStart=/usr/bin/node /var/www/watcher/server/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable watcher-server
sudo systemctl start watcher-server
sudo systemctl status watcher-server
```

### 4. Nginx Reverse Proxy (Optional)

```bash
# Install nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/watcher-api > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.watcher.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/watcher-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Setup (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d api.watcher.example.com
```

---

## Agent Deployment

### On Each Server to Monitor

```bash
# Get latest agent
git clone https://github.com/yourusername/watcher.git
cd watcher/agent

# Build
npm install --production
npm run build

# Copy to production location
sudo mkdir -p /opt/watcher-agent
sudo cp -r dist/* /opt/watcher-agent/
sudo cp node_modules /opt/watcher-agent/

# Create .env
sudo tee /opt/watcher-agent/.env > /dev/null << EOF
WATCHER_SERVER_URL=http://api.watcher.example.com
AGENT_ID=<from-dashboard>
API_KEY=<from-dashboard>
SECRET=<from-dashboard>
AGENT_NAME=$(hostname)
MONITOR_APPS=app1:3000:node,app2:3001:python
EOF

# Setup permissions
sudo chown -R nobody:nobody /opt/watcher-agent
sudo chmod 600 /opt/watcher-agent/.env

# Create systemd service
sudo tee /etc/systemd/system/watcher-agent.service > /dev/null << EOF
[Unit]
Description=Watcher Monitoring Agent
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/watcher-agent
EnvironmentFile=/opt/watcher-agent/.env
ExecStart=/usr/bin/node /opt/watcher-agent/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable watcher-agent
sudo systemctl start watcher-agent
sudo systemctl status watcher-agent
```

### Verify Agent

```bash
# Check status
sudo systemctl status watcher-agent

# View logs
sudo journalctl -u watcher-agent -f

# Test connection
curl -X POST http://localhost:3000/api/agents/test
```

---

## Dashboard Deployment

### Option 1: Static Build with Nginx

```bash
cd dashboard
npm install --production
npm run build

# Deploy to web server
sudo cp -r build/* /var/www/watcher-dashboard/
sudo chown -r www-data:www-data /var/www/watcher-dashboard

# Configure nginx
sudo tee /etc/nginx/sites-available/watcher-dashboard > /dev/null << 'EOF'
server {
    listen 80;
    server_name watcher.example.com;
    root /var/www/watcher-dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api.watcher.example.com;
        proxy_http_version 1.1;
    }
}
EOF

sudo systemctl restart nginx
```

### Option 2: Node.js Server

```bash
# Create service
sudo tee /etc/systemd/system/watcher-dashboard.service > /dev/null << EOF
[Unit]
Description=Watcher Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/watcher/dashboard
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable watcher-dashboard
sudo systemctl start watcher-dashboard
```

---

## Monitoring and Maintenance

### View Logs

```bash
# Server logs
sudo journalctl -u watcher-server -f

# Agent logs
sudo journalctl -u watcher-agent -f

# Dashboard logs
sudo journalctl -u watcher-dashboard -f
```

### Database Backup

```bash
# Daily backup script
sudo tee /usr/local/bin/backup-watcher-db.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/watcher"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump watcher > $BACKUP_DIR/watcher-$(date +%Y%m%d).sql
# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-watcher-db.sh

# Add to crontab
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-watcher-db.sh") | sudo crontab -
```

### Health Checks

```bash
# Check server health
curl -s http://localhost:3000/api/dashboard/summary | jq .

# Check agent connectivity
sudo systemctl status watcher-agent

# Check database
sudo -u postgres psql -d watcher -c "SELECT COUNT(*) FROM agents;"
```

---

## Troubleshooting

### Agent Not Connecting

```bash
# Check network connectivity
curl -v http://api.watcher.example.com/api/dashboard/summary

# Check agent credentials
grep -E "AGENT_ID|API_KEY|SECRET" /opt/watcher-agent/.env

# Check agent process
ps aux | grep "node.*watcher"

# Check listening ports
sudo netstat -tulpn | grep node
```

### Database Issues

```bash
# Check database status
sudo -u postgres psql -l | grep watcher

# Check disk space
df -h /var/lib/postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Performance Issues

```bash
# Check system resources
free -h
df -h
top

# Check PostgreSQL slow queries
sudo -u postgres psql -d watcher -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check server logs for errors
sudo journalctl -u watcher-server --since "1 hour ago" | grep -i error
```

---

## Security Hardening

### Firewall Rules

```bash
# UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw default deny incoming
sudo ufw enable

# Or iptables
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Database Security

```bash
# Use strong password
sudo -u postgres psql -c "ALTER USER watcher WITH PASSWORD 'very_strong_password';"

# Restrict connections
sudo tee /etc/postgresql/13/main/pg_hba.conf.d/watcher.conf > /dev/null << EOF
local   watcher    watcher                        md5
host    watcher    watcher   127.0.0.1/32         md5
EOF

sudo systemctl restart postgresql
```

### API Security

- Use HTTPS only in production
- Implement rate limiting
- Use strong JWT secrets
- Keep dependencies updated
- Regular security audits

---

## Updates and Maintenance

### Update Application

```bash
# Stop services
sudo systemctl stop watcher-server watcher-agent watcher-dashboard

# Pull updates
cd /var/www/watcher
git pull origin main

# Install dependencies
cd server && npm install && npm run build
cd ../agent && npm install && npm run build
cd ../dashboard && npm install && npm run build

# Run migrations if needed
cd ../server
npm run prisma:migrate

# Start services
sudo systemctl start watcher-server watcher-agent watcher-dashboard
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update major versions (be careful)
npm install -g npm-check-updates
ncu -u
npm install
```

---

## Backup and Recovery

### Full Backup

```bash
tar -czf watcher-backup-$(date +%Y%m%d).tar.gz \
  /var/www/watcher \
  /etc/systemd/system/watcher*.service \
  /etc/nginx/sites-available/watcher* \
  <(sudo -u postgres pg_dump watcher)
```

### Recovery

```bash
# Restore files
tar -xzf watcher-backup-*.tar.gz -C /

# Restore database
sudo -u postgres psql watcher < watcher.sql

# Restart services
sudo systemctl restart watcher-server watcher-agent
```
