# Pre-Deployment Checklist

Use this checklist before deploying Watcher to production.

---

## Pre-Deployment Planning

- [ ] Define monitoring strategy
  - [ ] Identify all servers to monitor
  - [ ] List all applications to monitor
  - [ ] Determine monitoring intervals
  - [ ] Plan alert escalation process

- [ ] Hardware & Infrastructure
  - [ ] Server for Watcher dashboard (2GB+ RAM, 10GB+ storage)
  - [ ] PostgreSQL database access/server
  - [ ] SSL certificates ready
  - [ ] Domain names allocated
  - [ ] Firewall rules documented

- [ ] External Services
  - [ ] ClickUp workspace and API token
  - [ ] List ID for downtime alerts
  - [ ] Email/Slack integration (optional)
  - [ ] Backup storage location

---

## Server Preparation

### Operating System
- [ ] Ubuntu/Debian server with latest updates
- [ ] SSH access configured
- [ ] User with sudo privileges created
- [ ] Firewall configured
- [ ] NTP time sync enabled
- [ ] Hostname set appropriately

### System Dependencies
- [ ] Node.js 16+ installed
- [ ] npm installed and updated
- [ ] PostgreSQL 12+ installed and running
- [ ] nginx installed (optional, for reverse proxy)
- [ ] certbot for SSL (if using nginx)
- [ ] curl/wget for testing

### Database Setup
- [ ] PostgreSQL service running
- [ ] Watcher database created
- [ ] Watcher user created with secure password
- [ ] User has CREATEDB permissions
- [ ] Connection tested successfully
- [ ] Backup strategy in place

---

## Server Deployment

### Code Deployment
- [ ] Repository cloned to /var/www/watcher
- [ ] .env file created with all required variables
- [ ] DATABASE_URL set correctly
- [ ] JWT_SECRET set to random value (openssl rand -base64 32)
- [ ] NODE_ENV set to "production"
- [ ] ClickUp credentials configured (if enabled)

### Database Setup
- [ ] npm dependencies installed
- [ ] Prisma migrations run successfully
- [ ] Database tables created
- [ ] Seed data loaded (optional)

### Application Build
- [ ] npm run build completed without errors
- [ ] dist/ directory contains compiled code
- [ ] File permissions set correctly (www-data:www-data)

### Systemd Service
- [ ] Service file created at /etc/systemd/system/watcher-server.service
- [ ] Service file has correct paths
- [ ] Service file has correct user (www-data)
- [ ] Service enabled: systemctl enable watcher-server
- [ ] Service running: systemctl start watcher-server
- [ ] Service status checked: systemctl status watcher-server

### Reverse Proxy (if using)
- [ ] nginx installed and running
- [ ] nginx config created and tested
- [ ] SSL certificate installed
- [ ] HTTPS redirect configured
- [ ] CORS headers configured
- [ ] Proxy headers set correctly

### Verification
- [ ] curl http://localhost:3000/api/dashboard/summary returns data
- [ ] External testing: curl https://api.watcher.example.com/api/dashboard/summary
- [ ] No errors in systemd logs
- [ ] No errors in database logs

---

## Dashboard Deployment

### Preparation
- [ ] Choose deployment method (static or Node.js)
- [ ] Configure API_BASE URL for production server
- [ ] Review API endpoints are accessible

### Static Build Deployment
- [ ] npm run build completed
- [ ] build/ directory ready
- [ ] nginx/Apache configured to serve files
- [ ] index.html serves on all routes
- [ ] /api requests proxied to backend

### Node.js Server Deployment
- [ ] npm dependencies installed
- [ ] npm start works correctly
- [ ] Systemd service created
- [ ] Service running
- [ ] Reverse proxy configured

### Verification
- [ ] Dashboard loads at https://watcher.example.com
- [ ] Dashboard can fetch agents summary
- [ ] Add agent form works
- [ ] Agent list displays correctly
- [ ] No console errors in browser DevTools

---

## Agent Preparation (Per Server)

### Pre-Installation
- [ ] Identify applications to monitor
- [ ] Get process names: ps aux | grep app-name
- [ ] Confirm application ports
- [ ] Plan monitoring strategy
- [ ] Generate unique agent name

### Installation
- [ ] Clone or download agent code
- [ ] Register agent in dashboard (get credentials)
- [ ] Create .env file with:
  - [ ] WATCHER_SERVER_URL
  - [ ] AGENT_ID
  - [ ] API_KEY
  - [ ] SECRET
  - [ ] AGENT_NAME
  - [ ] MONITOR_APPS (format: name:port:processName)

### Build & Setup
- [ ] npm install --production completed
- [ ] npm run build completed
- [ ] Files copied to /opt/watcher-agent
- [ ] Ownership set to nobody:nobody
- [ ] .env file permission set to 600

### Systemd Service
- [ ] Service file created
- [ ] Working directory correct
- [ ] User set to nobody
- [ ] Service enabled
- [ ] Service started
- [ ] Service status checked

### Verification
- [ ] Agent shows "online" in dashboard
- [ ] Applications detected and listed
- [ ] Metrics appearing in dashboard
- [ ] Heartbeat working (every 30 seconds)
- [ ] No errors in systemd logs

---

## ClickUp Integration

- [ ] ClickUp account and workspace ready
- [ ] API token generated
- [ ] Token stored securely
- [ ] Workspace ID confirmed
- [ ] List ID confirmed
- [ ] Test task can be created manually
- [ ] Server .env configured with credentials
- [ ] Server restarted after ClickUp config

---

## Monitoring & Alerts

### Downtime Detection
- [ ] Test: Stop application, check alert appears
- [ ] Test: Restart application, check resolved
- [ ] ClickUp task created automatically
- [ ] ClickUp task has correct priority
- [ ] Alert severity levels set appropriately

### Metrics Collection
- [ ] Metrics appearing in dashboard
- [ ] CPU tracking working
- [ ] Memory tracking working
- [ ] Uptime tracking working
- [ ] Historical data stored
- [ ] No database growth issues

### Agent Health
- [ ] All agents showing as online
- [ ] Heartbeats received regularly
- [ ] No connection timeouts
- [ ] Logs show normal operation

---

## Security Checklist

### Network Security
- [ ] Firewall blocks unnecessary ports
- [ ] SSH key-based authentication only
- [ ] Only required ports open (22, 80, 443)
- [ ] DDoS protection configured
- [ ] IP whitelisting for admin access

### Application Security
- [ ] HTTPS enforced (no HTTP)
- [ ] SSL certificate valid (not self-signed)
- [ ] JWT secret is random and strong
- [ ] Database password is strong
- [ ] API credentials are unique per agent

### Database Security
- [ ] PostgreSQL only listens on localhost
- [ ] Database user has minimal permissions
- [ ] Backups are encrypted
- [ ] Backup location is secure
- [ ] Database logs checked for suspicious activity

### Credential Management
- [ ] No credentials in code
- [ ] All secrets in .env files
- [ ] .env files not committed to git
- [ ] .env files have 600 permissions
- [ ] Credentials rotated regularly

---

## Backup & Disaster Recovery

### Backup Strategy
- [ ] Automated daily database backups
- [ ] Backup retention policy: 30 days
- [ ] Backups tested for restore capability
- [ ] Backups stored off-server
- [ ] Backup storage monitored for space

### Application Backups
- [ ] Code repository has git history
- [ ] Configuration backed up
- [ ] Systemd service files backed up
- [ ] nginx configs backed up

### Recovery Procedures
- [ ] Recovery procedure documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Recovery tested monthly
- [ ] Team trained on recovery process

---

## Monitoring Infrastructure

### System Monitoring
- [ ] Server CPU monitored
- [ ] Server memory monitored
- [ ] Disk space monitored (alert at 80%)
- [ ] Network connectivity monitored
- [ ] Service status monitored

### Application Monitoring
- [ ] Server health check: curl /api/dashboard/summary
- [ ] Agent health: all agents online
- [ ] Database health: response time normal
- [ ] Metrics collection: data flowing
- [ ] ClickUp integration: tasks creating

### Alert Setup
- [ ] Alerts configured for critical issues
- [ ] Alert recipients defined
- [ ] Alert escalation process documented
- [ ] Test alerts sent and verified

---

## Logging & Audit Trail

- [ ] Systemd journal enabled
- [ ] Log retention configured
- [ ] Logs monitored for errors
- [ ] Access logs enabled
- [ ] Audit trail for credential access
- [ ] Database query logging enabled

---

## Documentation

- [ ] Deployment procedure documented
- [ ] Configuration details documented
- [ ] Administrator runbook created
- [ ] Incident response plan created
- [ ] Escalation contacts listed
- [ ] Recovery procedures documented
- [ ] Team trained on procedures

---

## Performance Testing

- [ ] Load test: Can handle expected agent count
- [ ] Stress test: Database under load
- [ ] Failover test: Server restart doesn't lose data
- [ ] Agent disconnect/reconnect tested
- [ ] Network latency tested

---

## Final Verification

### Full System Test
- [ ] Dashboard loads
- [ ] All agents connected
- [ ] All applications showing status
- [ ] Metrics collecting correctly
- [ ] Test downtime → ClickUp task created
- [ ] System under load = acceptable performance

### User Access
- [ ] Team members can access dashboard
- [ ] Credentials distributed securely
- [ ] First-time user training completed
- [ ] Documentation accessible to team

### Sign-Off
- [ ] Project manager approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Go/No-Go decision made

---

## Go Live

- [ ] Deployment scheduled
- [ ] Maintenance window announced
- [ ] Team on standby
- [ ] Runbooks ready
- [ ] Rollback plan ready
- [ ] Deployment executed
- [ ] Post-deployment verification done
- [ ] Announcement sent to stakeholders
- [ ] Monitoring alert email sent

---

## Post-Deployment (First Week)

- [ ] Daily health check
- [ ] Monitor for issues
- [ ] Check backup status
- [ ] Review metrics for anomalies
- [ ] Team feedback collected
- [ ] Any immediate fixes deployed
- [ ] Success celebrated!

---

## Maintenance Schedule

### Daily
- [ ] Check agent status
- [ ] Review downtime alerts
- [ ] Monitor ClickUp task creation

### Weekly
- [ ] Review logs for errors
- [ ] Check disk space usage
- [ ] Verify backups completed
- [ ] Review performance metrics

### Monthly
- [ ] Test backup restoration
- [ ] Review and update documentation
- [ ] Check for pending updates
- [ ] Capacity planning review

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill
- [ ] Team training update

---

## Notes & Comments

```
_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________
```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | | | |
| System Admin | | | |
| Security Team | | | |
| Operations | | | |

---

**Deployment Completed:** _____________ (Date)

**Post-Deployment Review:** _____________ (Date)

**Production-Ready Date:** _____________ (Date)
