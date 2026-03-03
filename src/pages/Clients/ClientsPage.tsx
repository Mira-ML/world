import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import ClientDetailPanel from './ClientDetailPanel';
import { Search, ChevronRight } from 'lucide-react';

interface Client {
  orgId: string;
  orgName: string;
  industry?: string;
  conversationsTotal: number;
  conversationsLast30d: number;
  uniqueUsers: number;
  status?: string;
}

const ClientsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/clients').then(d => setClients(d.clients ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [apiFetch]);

  const filtered = clients.filter(c =>
    c.orgName?.toLowerCase().includes(search.toLowerCase()) ||
    c.orgId?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Clients</h1>
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

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{ color: 'var(--color-negative)', fontSize: 14 }}>{error}</div>
      ) : (
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Industry', 'Convos (all)', 'Convos (30d)', 'Unique Users', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', textAlign: i >= 2 && i < 5 ? 'right' : 'left',
                    fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-subtle)', fontSize: 14 }}>
                    {search ? 'No clients match your search' : 'No clients found'}
                  </td>
                </tr>
              ) : filtered.map(client => (
                <tr
                  key={client.orgId}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => setSelectedOrgId(client.orgId)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{client.orgName || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>{client.orgId}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{client.industry ?? '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.conversationsTotal.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.conversationsLast30d.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-primary)' }}>{client.uniqueUsers.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-subtle)' }}><ChevronRight size={14} /></td>
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
