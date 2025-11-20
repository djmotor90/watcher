import React from 'react';
import { Server, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardSummaryProps {
  summary: {
    totalAgents: number;
    onlineAgents: number;
    totalApplications: number;
    activeDowntimes: number;
  };
}

function DashboardSummary({ summary }: DashboardSummaryProps) {
  const stats = [
    {
      icon: Server,
      label: 'Total Agents',
      value: summary.totalAgents,
      subtext: `${summary.onlineAgents} online`,
    },
    {
      icon: Activity,
      label: 'Applications',
      value: summary.totalApplications,
      color: 'blue',
    },
    {
      icon: AlertTriangle,
      label: 'Active Downtime',
      value: summary.activeDowntimes,
      color: summary.activeDowntimes > 0 ? 'red' : 'green',
    },
  ];

  return (
    <div className="summary-grid">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="stat-card">
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              {stat.subtext && <p className="stat-subtext">{stat.subtext}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardSummary;
