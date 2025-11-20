import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  applications: any[];
}

interface AgentsListProps {
  agents: Agent[];
}

function AgentsList({ agents }: AgentsListProps) {
  return (
    <div className="agents-list">
      {agents.map(agent => (
        <div key={agent.id} className="agent-card">
          <div className="agent-header">
            <div className="agent-status">
              {agent.status === 'online' ? (
                <CheckCircle size={20} className="status-online" />
              ) : (
                <AlertCircle size={20} className="status-offline" />
              )}
              <span>{agent.name}</span>
            </div>
            <span className={`status-badge status-${agent.status}`}>
              {agent.status}
            </span>
          </div>

          <div className="agent-info">
            <div className="info-item">
              <Clock size={16} />
              <span>Last seen: {agent.lastSeen ? new Date(agent.lastSeen).toLocaleString() : 'Never'}</span>
            </div>
            <div className="info-item">
              <span>{agent.applications.length} applications</span>
            </div>
          </div>

          {agent.applications.length > 0 && (
            <div className="apps-list">
              {agent.applications.map(app => (
                <div key={app.id} className="app-item">
                  <span className="app-name">{app.name}</span>
                  <span className={`app-status status-${app.status}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AgentsList;
