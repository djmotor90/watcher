import axios from 'axios';
import dotenv from 'dotenv';
import os from 'os';
import psList from 'ps-list';
import pidtree from 'pidtree';

dotenv.config();

const WATCHER_SERVER_URL = process.env.WATCHER_SERVER_URL || 'http://localhost:3000';
const AGENT_ID = process.env.AGENT_ID!;
const API_KEY = process.env.API_KEY!;
const SECRET = process.env.SECRET!;
const AGENT_NAME = process.env.AGENT_NAME || os.hostname();
const MONITOR_APPS = (process.env.MONITOR_APPS || '').split(',').map(app => {
  const [name, port, processName] = app.trim().split(':');
  return { name, port: parseInt(port), processName };
}).filter(app => app.name);

// API instance with auth headers
const api = axios.create({
  baseURL: WATCHER_SERVER_URL,
  headers: {
    'x-api-key': API_KEY,
    'x-secret': SECRET,
  },
});

interface ProcessMetrics {
  cpu: number;
  memory: number;
  uptime: number;
  pid: number;
}

class WatcherAgent {
  private collectionInterval: NodeJS.Timer | null = null;
  private heartbeatInterval: NodeJS.Timer | null = null;
  private applications: Map<string, any> = new Map();

  async initialize() {
    console.log('Initializing Watcher Agent...');
    console.log(`Agent Name: ${AGENT_NAME}`);
    console.log(`Server: ${WATCHER_SERVER_URL}`);
    console.log(`Applications to monitor: ${MONITOR_APPS.map(a => a.name).join(', ')}`);

    // Register applications
    for (const app of MONITOR_APPS) {
      await this.registerApplication(app);
    }

    // Start monitoring
    this.startMonitoring();
  }

  async registerApplication(app: any) {
    try {
      const response = await api.post(`/api/agents/${AGENT_ID}/applications`, {
        name: app.name,
        port: app.port,
        processName: app.processName,
        url: `http://localhost:${app.port}`,
      });
      this.applications.set(app.name, response.data);
      console.log(`✓ Registered application: ${app.name}`);
    } catch (error: any) {
      console.error(`✗ Failed to register ${app.name}:`, error.message);
    }
  }

  startMonitoring() {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);

    // Collect metrics every 60 seconds
    this.collectionInterval = setInterval(() => this.collectMetrics(), 60000);

    console.log('Monitoring started');
  }

  async sendHeartbeat() {
    try {
      await api.post(`/api/agents/${AGENT_ID}/heartbeat`, {
        status: 'online',
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  async collectMetrics() {
    console.log('Collecting metrics...');

    for (const [appName, appData] of this.applications) {
      try {
        const metrics = await this.getApplicationMetrics(appName);
        
        if (metrics) {
          await this.submitMetrics(appData.id, metrics);
        }
      } catch (error: any) {
        console.error(`Error collecting metrics for ${appName}:`, error.message);
      }
    }
  }

  async getApplicationMetrics(appName: string): Promise<ProcessMetrics | null> {
    try {
      const appConfig = MONITOR_APPS.find(a => a.name === appName)!;
      const processes = await psList();
      
      // Find process by name
      const process = processes.find(p => p.name.includes(appConfig.processName));
      
      if (!process) {
        console.warn(`⚠ Process not found: ${appConfig.processName}`);
        await this.reportDowntime(appName, 'Process not found');
        return null;
      }

      // Get CPU usage (simplified, in real scenario use more sophisticated monitoring)
      const cpuUsage = process.cpu || 0;
      const memoryUsage = process.memory ? process.memory / (1024 * 1024) : 0; // Convert to MB

      // Get process uptime
      const uptime = await this.getProcessUptime(process.pid);

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        uptime,
        pid: process.pid,
      };
    } catch (error) {
      console.error(`Error getting metrics for ${appName}:`, error);
      return null;
    }
  }

  async getProcessUptime(pid: number): Promise<number> {
    try {
      // This is a simplified version
      // In production, you'd want to track process start time
      const startTime = Date.now() / 1000;
      return startTime;
    } catch {
      return 0;
    }
  }

  async submitMetrics(applicationId: string, metrics: ProcessMetrics) {
    try {
      await api.post(`/api/agents/${AGENT_ID}/metrics`, {
        applicationId,
        cpu: metrics.cpu,
        memory: metrics.memory,
        uptime: metrics.uptime,
        responseTime: null,
        requestCount: 0,
        errorCount: 0,
      });
      console.log(`✓ Metrics submitted for app`);
    } catch (error: any) {
      console.error('Failed to submit metrics:', error.message);
    }
  }

  async reportDowntime(appName: string, reason: string) {
    try {
      const appData = this.applications.get(appName);
      if (!appData) return;

      await api.post(`/api/agents/${AGENT_ID}/downtimes`, {
        applicationId: appData.id,
        reason,
        severity: 'high',
      });
      console.log(`✓ Downtime reported for ${appName}`);
    } catch (error: any) {
      console.error('Failed to report downtime:', error.message);
    }
  }

  stop() {
    if (this.collectionInterval) clearInterval(this.collectionInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    console.log('Agent stopped');
  }
}

// Main execution
const agent = new WatcherAgent();

agent.initialize().catch(error => {
  console.error('Initialization error:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  agent.stop();
  process.exit(0);
});
