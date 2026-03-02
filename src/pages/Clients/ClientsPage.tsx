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
    apiFetch('/clients')
      .then(d => setClients(d.clients ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const filtered = clients.filter(c =>
    c.orgName?.toLowerCase().includes(search.toLowerCase()) ||
    c.orgId?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white">Clients</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Industry</th>
                <th className="text-right px-4 py-3">Convos (all)</th>
                <th className="text-right px-4 py-3">Convos (30d)</th>
                <th className="text-right px-4 py-3">Unique Users</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                    {search ? 'No clients match your search' : 'No clients found'}
                  </td>
                </tr>
              ) : (
                filtered.map(client => (
                  <tr
                    key={client.orgId}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrgId(client.orgId)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{client.orgName || '—'}</div>
                      <div className="text-xs text-gray-600">{client.orgId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{client.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{client.conversationsTotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{client.conversationsLast30d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{client.uniqueUsers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrgId && (
        <ClientDetailPanel orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />
      )}
    </div>
  );
};

export default ClientsPage;
