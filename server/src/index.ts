import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// ============ HEALTH CHECK ============

// Root endpoint - welcome message
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Watcher Monitoring Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      'GET /': 'Welcome message',
      'GET /health': 'Health check',
      'POST /api/agents/register': 'Register a new agent',
      'GET /api/dashboard/summary': 'Dashboard summary statistics',
      'GET /api/dashboard/agents': 'List all agents with applications',
    },
    documentation: 'https://github.com/djmotor90/watcher',
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============ AUTH ROUTES ============

// User signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
      },
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.get('/api/auth/verify', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Types
interface AgentRequest extends Request {
  agentId?: string;
  apiKey?: string;
}

// Middleware: Agent Authentication
const authenticateAgent = (req: AgentRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const secret = req.headers['x-secret'] as string;

  if (!apiKey || !secret) {
    return res.status(401).json({ error: 'Missing API key or secret' });
  }

  req.apiKey = apiKey;
  next();
};

// ============ AGENT ROUTES ============

// Register or get agent info
app.post('/api/agents/register', async (req: Request, res: Response) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }

    const apiKey = uuidv4();
    const secret = uuidv4();

    const agent = await prisma.agent.create({
      data: {
        name,
        apiKey,
        secret,
        userId,
      },
    });

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      apiKey: agent.apiKey,
      secret: agent.secret,
      message: 'Agent registered successfully. Save these credentials securely!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent info
app.get('/api/agents/:agentId', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        applications: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent status (heartbeat)
app.post('/api/agents/:agentId/heartbeat', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: status || 'online',
        lastSeen: new Date(),
      },
    });

    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ APPLICATION ROUTES ============

// Register application on agent
app.post('/api/agents/:agentId/applications', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const { name, port, processName, url } = req.body;

    if (!name || !port || !processName) {
      return res.status(400).json({ error: 'Name, port, and processName are required' });
    }

    const application = await prisma.application.create({
      data: {
        name,
        port,
        processName,
        url,
        agentId,
      },
    });

    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications for agent
app.get('/api/agents/:agentId/applications', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const applications = await prisma.application.findMany({
      where: { agentId },
    });

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ METRICS ROUTES ============

// Submit metrics
app.post('/api/agents/:agentId/metrics', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const { applicationId, cpu, memory, uptime, responseTime, requestCount, errorCount } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    const metric = await prisma.metric.create({
      data: {
        cpu: parseFloat(cpu),
        memory: parseFloat(memory),
        uptime: parseFloat(uptime),
        responseTime: responseTime ? parseFloat(responseTime) : null,
        requestCount: parseInt(requestCount) || 0,
        errorCount: parseInt(errorCount) || 0,
        agentId,
        applicationId,
      },
    });

    res.status(201).json(metric);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics for application
app.get('/api/applications/:applicationId/metrics', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { limit = 100 } = req.query;

    const metrics = await prisma.metric.findMany({
      where: { applicationId: applicationId as string },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DOWNTIME ROUTES ============

// Report downtime
app.post('/api/agents/:agentId/downtimes', authenticateAgent, async (req: AgentRequest, res: Response) => {
  try {
    const { agentId } = req.params;
    const { applicationId, reason, severity } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    const downtime = await prisma.downtime.create({
      data: {
        startTime: new Date(),
        reason,
        severity: severity || 'medium',
        agentId,
        applicationId,
      },
      include: {
        application: true,
        agent: true,
      },
    });

    // Send to ClickUp if configured
    if (process.env.CLICKUP_API_TOKEN) {
      await sendToClickup(downtime);
    }

    res.status(201).json(downtime);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve downtime
app.patch('/api/downtimes/:downtimeId', async (req: Request, res: Response) => {
  try {
    const { downtimeId } = req.params;

    const downtime = await prisma.downtime.update({
      where: { id: downtimeId },
      data: {
        endTime: new Date(),
        resolved: true,
      },
    });

    res.json(downtime);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get downtimes
app.get('/api/downtimes', async (req: Request, res: Response) => {
  try {
    const { applicationId, agentId, limit = 50 } = req.query;
    const where: any = {};

    if (applicationId) where.applicationId = applicationId;
    if (agentId) where.agentId = agentId;

    const downtimes = await prisma.downtime.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: parseInt(limit as string),
      include: {
        application: true,
        agent: true,
      },
    });

    res.json(downtimes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD ROUTES ============

// Get all agents with their status
app.get('/api/dashboard/agents', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        applications: true,
        _count: {
          select: { downtimes: true },
        },
      },
    });

    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard summary
app.get('/api/dashboard/summary', async (req: Request, res: Response) => {
  try {
    const totalAgents = await prisma.agent.count();
    const onlineAgents = await prisma.agent.count({ where: { status: 'online' } });
    const totalApplications = await prisma.application.count();
    const activeDowntimes = await prisma.downtime.count({ where: { resolved: false } });

    res.json({
      totalAgents,
      onlineAgents,
      totalApplications,
      activeDowntimes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HELPER FUNCTIONS ============

async function sendToClickup(downtime: any) {
  try {
    const { CLICKUP_API_TOKEN, CLICKUP_WORKSPACE_ID, CLICKUP_LIST_ID } = process.env;

    if (!CLICKUP_API_TOKEN || !CLICKUP_LIST_ID) {
      console.log('ClickUp not configured');
      return;
    }

    const taskName = `[${downtime.severity.toUpperCase()}] ${downtime.application.name} is DOWN`;
    const description = `Agent: ${downtime.agent.name}\nReason: ${downtime.reason || 'Unknown'}\nTime: ${downtime.startTime}`;

    const response = await fetch('https://api.clickup.com/api/v2/list/' + CLICKUP_LIST_ID + '/task', {
      method: 'POST',
      headers: {
        'Authorization': CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: taskName,
        description,
        priority: downtime.severity === 'critical' ? 1 : downtime.severity === 'high' ? 2 : 3,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      await prisma.downtime.update({
        where: { id: downtime.id },
        data: { clickupTaskId: data.task.id },
      });

      await prisma.clickupLog.create({
        data: {
          taskId: data.task.id,
          applicationName: downtime.application.name,
          agentName: downtime.agent.name,
          message: 'Task created successfully',
          success: true,
        },
      });
    }
  } catch (error: any) {
    console.error('ClickUp error:', error);
  }
}

// ============ ERROR HANDLING ============

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// ============ SERVER START ============

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
