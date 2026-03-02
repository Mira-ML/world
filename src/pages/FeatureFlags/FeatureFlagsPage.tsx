import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Plus, Save } from 'lucide-react';

interface Flag {
  flagKey: string;
  scopeOrg: string;
  value: string | boolean;
  updatedAt: string;
  updatedBy: string;
}

type ValueType = 'boolean' | 'string';

const SCOPE_GLOBAL = 'global';

const FeatureFlagsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New flag form
  const [newKey, setNewKey] = useState('');
  const [newScope, setNewScope] = useState(SCOPE_GLOBAL);
  const [newValueType, setNewValueType] = useState<ValueType>('boolean');
  const [newValue, setNewValue] = useState('true');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/flags')
      .then(d => setFlags(d.flags ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newKey.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const val = newValueType === 'boolean' ? (newValue === 'true') : newValue;
      await apiFetch('/flags', {
        method: 'PUT',
        body: JSON.stringify({ flagKey: newKey.trim(), scopeOrg: newScope || SCOPE_GLOBAL, value: val }),
      });
      setNewKey('');
      setNewScope(SCOPE_GLOBAL);
      setNewValue('true');
      load();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (flag: Flag) => {
    const newVal = String(flag.value) === 'true' ? false : true;
    try {
      await apiFetch('/flags', {
        method: 'PUT',
        body: JSON.stringify({ flagKey: flag.flagKey, scopeOrg: flag.scopeOrg, value: newVal }),
      });
      load();
    } catch {
      // silent
    }
  };

  const globalFlags = flags.filter(f => f.scopeOrg === SCOPE_GLOBAL);
  const orgFlags = flags.filter(f => f.scopeOrg !== SCOPE_GLOBAL);

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading flags…</div>;
  if (error) return <div className="p-6 text-red-400 text-sm">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-white">Feature Flags</h1>

      {/* Create form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Create / Update Flag</div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Key</label>
            <input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="otp_verification_enabled"
              className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Scope (org_id or "global")</label>
            <input
              value={newScope}
              onChange={e => setNewScope(e.target.value)}
              placeholder="global"
              className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Type</label>
            <select
              value={newValueType}
              onChange={e => setNewValueType(e.target.value as ValueType)}
              className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Value</label>
            {newValueType === 'boolean' ? (
              <select
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="value"
                className="bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-32"
              />
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newKey.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-gray-950 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <Save size={13} />
            {creating ? 'Saving…' : 'Save'}
          </button>
        </div>
        {createError && <div className="text-xs text-red-400 mt-2">{createError}</div>}
      </div>

      {/* Global flags */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Global Flags</div>
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {globalFlags.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-600">No global flags yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-white/10">
                  <th className="text-left px-5 py-2">Key</th>
                  <th className="text-left px-5 py-2">Value</th>
                  <th className="text-left px-5 py-2">Last Updated</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {globalFlags.map(flag => (
                  <tr key={`${flag.flagKey}-${flag.scopeOrg}`} className="border-b border-white/5">
                    <td className="px-5 py-2 text-gray-300 font-mono text-xs">{flag.flagKey}</td>
                    <td className="px-5 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${String(flag.value) === 'true' ? 'bg-green-800' : 'bg-gray-700'}`}>
                        {String(flag.value)}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-gray-600 text-xs">
                      {flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {(flag.value === true || flag.value === false || flag.value === 'true' || flag.value === 'false') && (
                        <button
                          onClick={() => handleToggle(flag)}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          Toggle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Per-org flags */}
      {orgFlags.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Per-Org Overrides</div>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-white/10">
                  <th className="text-left px-5 py-2">Key</th>
                  <th className="text-left px-5 py-2">Org</th>
                  <th className="text-left px-5 py-2">Value</th>
                  <th className="text-left px-5 py-2">Last Updated</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {orgFlags.map(flag => (
                  <tr key={`${flag.flagKey}-${flag.scopeOrg}`} className="border-b border-white/5">
                    <td className="px-5 py-2 text-gray-300 font-mono text-xs">{flag.flagKey}</td>
                    <td className="px-5 py-2 text-gray-500 text-xs">{flag.scopeOrg.replace('org#', '')}</td>
                    <td className="px-5 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${String(flag.value) === 'true' ? 'bg-green-800' : 'bg-gray-700'}`}>
                        {String(flag.value)}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-gray-600 text-xs">
                      {flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {(flag.value === true || flag.value === false || flag.value === 'true' || flag.value === 'false') && (
                        <button
                          onClick={() => handleToggle(flag)}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          Toggle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsPage;
