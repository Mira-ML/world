import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import ClientDetailModal from './ClientDetailPanel';
import { Search, EyeOff, Eye, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TrendPoint {
  date: string;
  conversations: number;
  newPersons: number;
}

interface Client {
  orgId: string;
  brandName: string;
  conversationsMtd: number;
  conversationsLastMonth: number;
  totalPersons: number;
  trend: TrendPoint[];
  billingStatus: string;
  lastActive: string;
  tombstoned?: boolean;
  tombstonedAt?: string;
}

const billingBadge = (status: string) => {
  const colors: Record<string, { bg: string; fg: string }> = {
    active: { bg: 'rgba(95,141,114,0.15)', fg: '#5F8D72' },
    canceled: { bg: 'rgba(168,89,81,0.15)', fg: '#A85951' },
    cancelled: { bg: 'rgba(168,89,81,0.15)', fg: '#A85951' },
    past_due: { bg: 'rgba(204,163,59,0.15)', fg: '#CCA33B' },
  };
  const c = colors[status] || { bg: 'rgba(120,120,120,0.1)', fg: 'var(--color-text-muted)' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: c.bg, color: c.fg, textTransform: 'capitalize',
    }}>
      {status || 'none'}
    </span>
  );
};

const delta = (mtd: number, last: number) => {
  const diff = mtd - last;
  if (diff === 0) return null;
  const arrow = diff > 0 ? '\u2191' : '\u2193';
  const color = diff > 0 ? '#5F8D72' : '#A85951';
  return <span style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 4 }}>{arrow}{Math.abs(diff)}</span>;
};

const Sparkline: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  // Last 14 days
  const recent = data.slice(-14);
  if (recent.length < 2) return <span style={{ color: 'var(--color-text-subtle)', fontSize: 11 }}>—</span>;
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={recent}>
        <Line
          type="monotone"
          dataKey="conversations"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const ClientsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [showTombstoned, setShowTombstoned] = useState(false);
  const [tombstoning, setTombstoning] = useState<string | null>(null);
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
    apiFetch('/clients').then(d => setClients(d.clients ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [apiFetch]);

  const handleTombstone = async (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to tombstone this client? This will deactivate their account.`)) return;
    setTombstoning(orgId);
    try {
      await apiFetch(`/clients/${orgId}/tombstone`, { method: 'PUT' });
      setClients(prev => prev.map(c => c.orgId === orgId ? { ...c, tombstoned: true, tombstonedAt: new Date().toISOString() } : c));
    } catch (err) {
      alert(`Failed to tombstone client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTombstoning(null);
    }
  };

  const filtered = clients
    .filter(c => showTombstoned || !c.tombstoned)
    .filter(c =>
      c.brandName?.toLowerCase().includes(search.toLowerCase()) ||
      c.orgId?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Clients</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                : 'Trend data as of yesterday'}
            </span>
          </div>
          <button
            onClick={() => setShowTombstoned(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '8px 12px', fontSize: 13,
              color: 'var(--color-text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-input)',
            }}
            title={showTombstoned ? 'Hide tombstoned clients' : 'Show tombstoned clients'}
          >
            {showTombstoned ? <Eye size={14} /> : <EyeOff size={14} />}
            {showTombstoned ? 'Showing all' : 'Hiding tombstoned'}
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients…"
              style={{
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                borderRadius: 8, paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                fontSize: 14, color: 'var(--color-text-primary)', outline: 'none',
                fontFamily: 'var(--font-input)',
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{ color: 'var(--color-negative)', fontSize: 14 }}>{error}</div>
      ) : (
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {[
                  { label: 'Brand', align: 'left' },
                  { label: 'Convos MTD', align: 'right' },
                  { label: 'Persons', align: 'right' },
                  { label: 'Billing', align: 'center' },
                  { label: 'Last 14d', align: 'center' },
                  { label: 'Last Active', align: 'right' },
                  { label: '', align: 'left' },
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', textAlign: h.align as any,
                    fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 14 }}>
                    {search ? 'No clients match your search' : 'No clients found'}
                  </td>
                </tr>
              ) : filtered.map(client => (
                <tr
                  key={client.orgId}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    opacity: client.tombstoned ? 0.45 : 1,
                  }}
                  onClick={() => setSelectedOrgId(client.orgId)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      textDecoration: client.tombstoned ? 'line-through' : 'none',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {client.brandName || '—'}
                      {client.tombstoned && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                          background: '#B91C1C', color: '#fff', borderRadius: 4,
                          padding: '2px 6px', letterSpacing: '0.04em',
                          textDecoration: 'none',
                        }}>Tombstoned</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {client.conversationsMtd.toLocaleString()}
                    </span>
                    {delta(client.conversationsMtd, client.conversationsLastMonth)}
                    <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 1 }}>live</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>
                    {client.totalPersons.toLocaleString()}
                    <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 1 }}>as of yesterday</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {billingBadge(client.billingStatus)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <Sparkline data={client.trend} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {client.lastActive || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {!client.tombstoned && (
                      <button
                        onClick={(e) => handleTombstone(client.orgId, e)}
                        disabled={tombstoning === client.orgId}
                        style={{
                          background: 'transparent', border: '1px solid var(--color-border)',
                          borderRadius: 6, padding: '4px 10px', fontSize: 11,
                          color: 'var(--color-text-muted)', cursor: 'pointer',
                          fontFamily: 'var(--font-input)', opacity: tombstoning === client.orgId ? 0.5 : 1,
                        }}
                        title="Tombstone this client"
                      >
                        {tombstoning === client.orgId ? '…' : 'Tombstone'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrgId && <ClientDetailModal orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />}
    </div>
  );
};

export default ClientsPage;
