import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Plus } from 'lucide-react';

interface Flag { flagKey: string; scopeOrg: string; value: string | boolean; updatedAt: string; updatedBy: string; }
type ValueType = 'boolean' | 'string';

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)',
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
};

const FeatureFlagsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newScope, setNewScope] = useState('global');
  const [newValueType, setNewValueType] = useState<ValueType>('boolean');
  const [newValue, setNewValue] = useState('true');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/flags').then(d => setFlags(d.flags ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newKey.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const val = newValueType === 'boolean' ? (newValue === 'true') : newValue;
      await apiFetch('/flags', { method: 'PUT', body: JSON.stringify({ flagKey: newKey.trim(), scopeOrg: newScope || 'global', value: val }) });
      setNewKey('');
      setNewScope('global');
      setNewValue('true');
      load();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const globalFlags = flags.filter(f => f.scopeOrg === 'global');
  const orgFlags = flags.filter(f => f.scopeOrg !== 'global');

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--color-text-primary)',
    outline: 'none', fontFamily: 'var(--font-input)',
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Feature Flags</h1>

      {/* Create new flag */}
      <div style={card}>
        <div style={sectionLabel}>New Flag</div>
        <div style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4 }}>Flag Key</div>
            <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. join_chat_enabled" style={{ ...inputStyle, width: 220 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4 }}>Scope</div>
            <input value={newScope} onChange={e => setNewScope(e.target.value)} placeholder="global or org#id" style={{ ...inputStyle, width: 160 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4 }}>Type</div>
            <select value={newValueType} onChange={e => setNewValueType(e.target.value as ValueType)} style={{ ...inputStyle }}>
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4 }}>Value</div>
            {newValueType === 'boolean' ? (
              <select value={newValue} onChange={e => setNewValue(e.target.value)} style={{ ...inputStyle }}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input value={newValue} onChange={e => setNewValue(e.target.value)} style={{ ...inputStyle, width: 140 }} />
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newKey.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'var(--color-accent)', color: '#FFFFFF', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-primary)',
              cursor: 'pointer', opacity: creating || !newKey.trim() ? 0.5 : 1,
            }}
          >
            <Plus size={14} />
            {creating ? 'Saving…' : 'Create'}
          </button>
          {createError && <div style={{ fontSize: 12, color: 'var(--color-negative)', width: '100%' }}>{createError}</div>}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{ color: 'var(--color-negative)', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* Global flags */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={sectionLabel}>Global Flags ({globalFlags.length})</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Key', 'Value', 'Updated', 'By'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {globalFlags.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px', color: 'var(--color-text-subtle)', fontSize: 13 }}>No global flags yet</td></tr>
                ) : globalFlags.map(f => (
                  <tr key={f.flagKey} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{f.flagKey}</td>
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: f.value === 'true' ? 'rgba(95,141,114,0.12)' : 'rgba(44,40,37,0.06)',
                        color: f.value === 'true' ? 'var(--color-positive)' : 'var(--color-text-muted)',
                      }}>{String(f.value)}</span>
                    </td>
                    <td style={{ padding: '10px 20px', color: 'var(--color-text-subtle)' }}>{f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 20px', color: 'var(--color-text-subtle)' }}>{f.updatedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Org-scoped flags */}
          {orgFlags.length > 0 && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={sectionLabel}>Org-Scoped Flags ({orgFlags.length})</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Key', 'Scope', 'Value', 'Updated'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgFlags.map(f => (
                    <tr key={`${f.flagKey}${f.scopeOrg}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{f.flagKey}</td>
                      <td style={{ padding: '10px 20px', color: 'var(--color-text-muted)', fontSize: 12 }}>{f.scopeOrg}</td>
                      <td style={{ padding: '10px 20px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: f.value === 'true' ? 'rgba(95,141,114,0.12)' : 'rgba(44,40,37,0.06)',
                          color: f.value === 'true' ? 'var(--color-positive)' : 'var(--color-text-muted)',
                        }}>{String(f.value)}</span>
                      </td>
                      <td style={{ padding: '10px 20px', color: 'var(--color-text-subtle)' }}>{f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeatureFlagsPage;
