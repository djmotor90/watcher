import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, DownloadCloud, Plus, LogOut } from 'lucide-react';
import AgentsList from './components/AgentsList';
import DashboardSummary from './components/DashboardSummary';
import DowntimeAlerts from './components/DowntimeAlerts';
import AddAgentModal from './components/AddAgentModal';
import LoginPage from './LoginPage';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [agentsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/agents`, { headers }),
        axios.get(`${API_BASE}/dashboard/summary`, { headers }),
      ]);
      setAgents(agentsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setAgents([]);
    setSummary(null);
    setUser(null);
  };

  return isAuthenticated ? (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Activity size={32} className="logo" />
            <h1>Watcher Dashboard</h1>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowAddAgent(true)}
            >
              <Plus size={20} />
              Add Agent
            </button>
            <button 
              className="btn-secondary"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
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
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
