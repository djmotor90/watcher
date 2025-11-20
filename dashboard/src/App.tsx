import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, DownloadCloud, Plus } from 'lucide-react';
import AgentsList from './components/AgentsList';
import DashboardSummary from './components/DashboardSummary';
import DowntimeAlerts from './components/DowntimeAlerts';
import AddAgentModal from './components/AddAgentModal';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/agents`),
        axios.get(`${API_BASE}/dashboard/summary`),
      ]);
      setAgents(agentsRes.data);
      setSummary(summaryRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Activity size={32} className="logo" />
            <h1>Watcher Dashboard</h1>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowAddAgent(true)}
          >
            <Plus size={20} />
            Add Agent
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {summary && <DashboardSummary summary={summary} />}
            
            <div className="content-grid">
              <div className="agents-section">
                <h2>Agents</h2>
                {agents.length === 0 ? (
                  <div className="empty-state">
                    <DownloadCloud size={48} />
                    <p>No agents registered yet</p>
                    <p className="text-small">Install an agent on your server to start monitoring</p>
                  </div>
                ) : (
                  <AgentsList agents={agents} />
                )}
              </div>

              <div className="alerts-section">
                <h2>Downtime Alerts</h2>
                <DowntimeAlerts />
              </div>
            </div>
          </>
        )}
      </main>

      {showAddAgent && (
        <AddAgentModal 
          onClose={() => setShowAddAgent(false)}
          onAgentAdded={fetchData}
        />
      )}
    </div>
  );
}

export default App;
