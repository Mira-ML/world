import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import ClientDetailPanel from './ClientDetailPanel';
import { Search, ChevronRight, EyeOff, Eye, Info, RefreshCw } from 'lucide-react';

const fmtPct = (rate?: number): string => {
  if (rate === undefined || rate === null || rate === 0) return '\u2014';
  return `${(Number(rate) * 100).toFixed(1)}%`;
};

interface Client {
  orgId: string;
  orgName: string;
  industry?: string;
  conversationsTotal: number;
  conversationsLast30d: number;
  uniqueUsers: number;
  totalVisits30d?: number;
  widgetOpenRate?: number;
  engagementRate?: number;
  status?: string;
  tombstoned?: boolean;
  tombstonedAt?: string;
}

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
      c.orgName?.toLowerCase().includes(search.toLowerCase()) ||
      c.orgId?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
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
                : 'Stats update in ~30 seconds'}
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
                  { label: 'Name', align: 'left' },
                  { label: 'Industry', align: 'left' },
                  { label: 'Convos (all)', align: 'right' },
                  { label: 'Convos (30d)', align: 'right' },
                  { label: 'Unique Users', align: 'right' },
                  { label: 'Visits (30d)', align: 'right', tooltip: 'Page load events in the last 30 days' },
                  { label: 'Open Rate', align: 'right', tooltip: 'Widget opens / site visits' },
                  { label: 'Engagement Rate', align: 'right', tooltip: 'Conversations started / widget opens' },
                  { label: '', align: 'left' },
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', textAlign: h.align as any,
                    fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {h.label}
                      {h.tooltip && <span title={h.tooltip}><Info size={11} style={{ color: 'var(--color-text-subtle)', cursor: 'help' }} /></span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 14 }}>
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
                      {client.orgName || '—'}
                      {client.tombstoned && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                          background: '#B91C1C', color: '#fff', borderRadius: 4,
                          padding: '2px 6px', letterSpacing: '0.04em',
                          textDecoration: 'none',
                        }}>Tombstoned</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2,
                      textDecoration: client.tombstoned ? 'line-through' : 'none',
                    }}>{client.orgId}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textDecoration: client.tombstoned ? 'line-through' : 'none' }}>{client.industry ?? '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.conversationsTotal.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.conversationsLast30d.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.uniqueUsers.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.totalVisits30d ? client.totalVisits30d.toLocaleString() : '\u2014'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{fmtPct(client.widgetOpenRate)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{fmtPct(client.engagementRate)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
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
                      <ChevronRight size={14} style={{ color: 'var(--color-text-subtle)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrgId && <ClientDetailPanel orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />}
    </div>
  );
};

export default ClientsPage;
