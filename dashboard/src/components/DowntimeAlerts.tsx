import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

function DowntimeAlerts() {
  const [downtimes, setDowntimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDowntimes();
    const interval = setInterval(fetchDowntimes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDowntimes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/downtimes?limit=10`);
      setDowntimes(response.data.filter((dt: any) => !dt.resolved));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching downtimes:', error);
    }
  };

  if (loading) return <div className="loading">Loading alerts...</div>;

  if (downtimes.length === 0) {
    return (
      <div className="empty-state">
        <p>No active downtime alerts</p>
      </div>
    );
  }

  return (
    <div className="downtimes-list">
      {downtimes.map(downtime => (
        <div key={downtime.id} className={`downtime-item severity-${downtime.severity}`}>
          <div className="downtime-header">
            <AlertTriangle size={20} />
            <div className="downtime-title">
              <p className="app-name">{downtime.application.name}</p>
              <p className="agent-name">{downtime.agent.name}</p>
            </div>
          </div>
          <p className="downtime-reason">{downtime.reason || 'Unknown reason'}</p>
          <p className="downtime-time">
            Started: {new Date(downtime.startTime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default DowntimeAlerts;
