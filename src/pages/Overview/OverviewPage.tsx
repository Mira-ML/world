import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Activity, DollarSign, Users, Network, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  runningTasks: number;
}

interface OverviewData {
  serviceHealth: ServiceHealth[];
  awsCostCurrentMonth: number;
  awsCostLastMonth: number;
  anthropicCostCurrentMonth: number;
  activeClients30d: number;
  totalClients: number;
  networkConnections: number;
  recentAlarms: { alarmName: string; stateValue: string; updatedAt: string }[];
}

const StatusDot: React.FC<{ status: ServiceHealth['status'] }> = ({ status }) => {
  const colors: Record<ServiceHealth['status'], string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ label, value, sub, icon, trend }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-2xl font-semibold text-white">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      </div>
      <div className="text-gray-600">{icon}</div>
    </div>
  </div>
);

const fmt$ = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const OverviewPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/overview')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading overview…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        {error ?? 'Failed to load overview data'}
      </div>
    );
  }

  const awsDelta = data.awsCostCurrentMonth - data.awsCostLastMonth;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-white">Overview</h1>

      {/* Service health strip */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Service Health</div>
        <div className="flex flex-wrap gap-3">
          {data.serviceHealth.map(svc => (
            <div key={svc.name} className="flex items-center gap-2 text-xs text-gray-300">
              <StatusDot status={svc.status} />
              <span>{svc.name}</span>
              {svc.runningTasks > 0 && (
                <span className="text-gray-600">({svc.runningTasks})</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="AWS Cost (this month)"
          value={fmt$(data.awsCostCurrentMonth)}
          sub={`${awsDelta >= 0 ? '+' : ''}${fmt$(awsDelta)} vs last month`}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Anthropic Cost (this month)"
          value={fmt$(data.anthropicCostCurrentMonth)}
          icon={<Activity size={20} />}
        />
        <StatCard
          label="Active Clients (30d)"
          value={String(data.activeClients30d)}
          sub={`${data.totalClients} total`}
          icon={<Users size={20} />}
        />
        <StatCard
          label="Network Connections"
          value={String(data.networkConnections)}
          icon={<Network size={20} />}
        />
      </div>

      {/* Recent alarms */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Recent Alarms</div>
        {data.recentAlarms.length === 0 ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={14} />
            <span>No active alarms</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentAlarms.map((alarm, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {alarm.stateValue === 'ALARM' ? (
                  <XCircle size={14} className="text-red-400 shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                )}
                <span className="text-gray-300">{alarm.alarmName}</span>
                <span className="text-gray-600 text-xs ml-auto">{alarm.updatedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;
