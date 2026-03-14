import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Activity, DollarSign, Users, Network, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'stopped' | 'unknown';
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

const STATUS_COLORS: Record<string, string> = {
  healthy: '#5F8D72',
  degraded: '#B98B2A',
  down: '#A85951',
  stopped: '#8F7F73',
  unknown: '#8F7F73',
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: STATUS_COLORS[status] ?? '#8F7F73', flexShrink: 0,
  }} />
);

const StatCard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div style={{
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-tile)', padding: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ color: 'var(--color-accent)', opacity: 0.7 }}>{icon}</div>
    </div>
  </div>
);

const fmt$ = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const OverviewPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshState, setRefreshState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastTriggeredAt, setLastTriggeredAt] = useState<string | null>(null);

  const handleRefreshStats = useCallback(async () => {
    setRefreshState('loading');
    try {
      const data = await apiFetch('/refresh-stats', { method: 'POST' });
      setLastTriggeredAt(data.triggeredAt);
      setRefreshState('success');
      setTimeout(() => setRefreshState('idle'), 2000);
    } catch {
      setRefreshState('error');
      setTimeout(() => setRefreshState('idle'), 3000);
    }
  }, [apiFetch]);

  useEffect(() => {
    apiFetch('/overview').then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [apiFetch]);

  if (loading) return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading overview…</div>;
  if (error || !data) return <div style={{ padding: 24, color: 'var(--color-negative)', fontSize: 14 }}>{error ?? 'Failed to load overview data'}</div>;

  const awsDelta = data.awsCostCurrentMonth - data.awsCostLastMonth;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Overview</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <button
            onClick={handleRefreshStats}
            disabled={refreshState === 'loading'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: refreshState === 'success' ? '#5F8D72' : refreshState === 'error' ? '#A85951' : 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '8px 12px', fontSize: 13,
              color: refreshState === 'success' || refreshState === 'error' ? '#fff' : 'var(--color-text-muted)',
              cursor: refreshState === 'loading' ? 'wait' : 'pointer',
              fontFamily: 'var(--font-input)',
              transition: 'background 0.2s, color 0.2s',
            }}
            title="Trigger stats refresh for all orgs"
          >
            <RefreshCw size={14} style={{ animation: refreshState === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
            {refreshState === 'loading' ? 'Refreshing...' : refreshState === 'success' ? 'Refresh triggered' : refreshState === 'error' ? 'Refresh failed' : 'Refresh Stats'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
            {lastTriggeredAt
              ? `Last triggered: ${(() => {
                  const diff = Math.round((Date.now() - new Date(lastTriggeredAt).getTime()) / 1000);
                  if (diff < 60) return `${diff}s ago`;
                  return `${Math.round(diff / 60)}m ago`;
                })()}`
              : 'Stats update in ~30 seconds'}
          </span>
        </div>
      </div>

      {/* Service health strip */}
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Service Health
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {data.serviceHealth.map(svc => (
            <div key={svc.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-primary)' }}>
              <StatusDot status={svc.status} />
              <span>{svc.name.replace(/-/g, ' ').replace('mira ', '').replace(' tasks service', '').replace(' family service', '')}</span>
              {svc.runningTasks > 0 && <span style={{ color: 'var(--color-text-subtle)', fontSize: 11 }}>({svc.runningTasks})</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="AWS Cost (MTD)" value={fmt$(data.awsCostCurrentMonth)} sub={`${awsDelta >= 0 ? '+' : ''}${fmt$(awsDelta)} vs last month`} icon={<DollarSign size={20} />} />
        <StatCard label="Anthropic Cost (MTD)" value={fmt$(data.anthropicCostCurrentMonth)} icon={<Activity size={20} />} />
        <StatCard label="Active Clients (30d)" value={String(data.activeClients30d)} sub={`${data.totalClients} total`} icon={<Users size={20} />} />
        <StatCard label="Network Connections" value={String(data.networkConnections)} icon={<Network size={20} />} />
      </div>

      {/* Recent alarms */}
      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Active Alarms
        </div>
        {data.recentAlarms.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-positive)', fontSize: 14 }}>
            <CheckCircle size={14} />
            <span>No active alarms</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recentAlarms.map((alarm, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                {alarm.stateValue === 'ALARM'
                  ? <XCircle size={14} style={{ color: 'var(--color-negative)', flexShrink: 0 }} />
                  : <AlertTriangle size={14} style={{ color: '#B98B2A', flexShrink: 0 }} />}
                <span style={{ color: 'var(--color-text-primary)' }}>{alarm.alarmName}</span>
                <span style={{ color: 'var(--color-text-subtle)', fontSize: 11, marginLeft: 'auto' }}>{alarm.updatedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;
