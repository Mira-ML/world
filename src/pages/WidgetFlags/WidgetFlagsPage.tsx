import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';

/* ── Central flag definitions ────────────────────────── */

interface FlagDef {
  key: string;
  label: string;
  description: string;
}

const WIDGET_FLAGS: FlagDef[] = [
  { key: 'chatTestEnabled', label: 'Live Chat', description: 'Enable live customer chat with join/leave capability in the Chats tab' },
];

/* ── Types ────────────────────────────────────────────── */

interface Client { orgId: string; orgName: string; industry?: string; }
interface WidgetFeatureFlags { [key: string]: boolean | undefined; }

/* ── Styles ───────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', overflow: 'hidden',
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
};
const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--color-text-primary)',
  outline: 'none', fontFamily: 'var(--font-input)', minWidth: 280,
};
const toggleTrack: (on: boolean) => React.CSSProperties = (on) => ({
  width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
  background: on ? 'var(--color-accent)' : 'rgba(44,40,37,0.15)',
  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
  border: 'none', padding: 0,
});
const toggleKnob: (on: boolean) => React.CSSProperties = (on) => ({
  width: 16, height: 16, borderRadius: '50%', background: '#fff',
  position: 'absolute', top: 3, left: on ? 21 : 3,
  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
});

/* ── Component ────────────────────────────────────────── */

const WidgetFlagsPage: React.FC = () => {
  const { apiFetch, baseApiFetch } = useWorldData();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const [flags, setFlags] = useState<WidgetFeatureFlags>({});
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagsError, setFlagsError] = useState<string | null>(null);

  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load org list
  useEffect(() => {
    apiFetch('/clients')
      .then(d => setClients(d.clients ?? []))
      .catch(() => { /* best-effort */ })
      .finally(() => setLoadingClients(false));
  }, [apiFetch]);

  // Fetch widget settings when org changes
  const loadFlags = useCallback(async (orgId: string) => {
    if (!orgId) { setFlags({}); return; }
    setLoadingFlags(true);
    setFlagsError(null);
    setFeedback(null);
    try {
      const data = await baseApiFetch(`/widget?orgId=${encodeURIComponent(orgId)}`);
      setFlags(data.featureFlags ?? {});
    } catch (e: any) {
      setFlagsError(e.message);
      setFlags({});
    } finally {
      setLoadingFlags(false);
    }
  }, [baseApiFetch]);

  useEffect(() => { void loadFlags(selectedOrgId); }, [selectedOrgId, loadFlags]);

  // Toggle a flag
  const handleToggle = async (flagKey: string) => {
    if (!selectedOrgId) return;
    const newValue = !flags[flagKey];
    setSaving(flagKey);
    setFeedback(null);
    try {
      await baseApiFetch(`/widget?orgId=${encodeURIComponent(selectedOrgId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ featureFlags: { [flagKey]: newValue } }),
      });
      setFlags(prev => ({ ...prev, [flagKey]: newValue }));
      setFeedback({ type: 'success', msg: `${flagKey} ${newValue ? 'enabled' : 'disabled'}` });
    } catch (e: any) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setSaving(null);
    }
  };

  const selectedClient = clients.find(c => c.orgId === selectedOrgId);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Widget Feature Flags</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Toggle feature flags stored in each org's widget settings.
        </p>
      </div>

      {/* Org selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>Organization</label>
        {loadingClients ? (
          <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>Loading…</span>
        ) : (
          <select
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select an organization…</option>
            {clients.map(c => (
              <option key={c.orgId} value={c.orgId}>
                {c.orgName || c.orgId}{c.industry ? ` (${c.industry})` : ''}
              </option>
            ))}
          </select>
        )}
        {selectedClient && (
          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-mono)' }}>
            {selectedClient.orgId}
          </span>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: feedback.type === 'success' ? 'rgba(95,141,114,0.1)' : 'rgba(200,60,60,0.08)',
          color: feedback.type === 'success' ? 'var(--color-positive)' : 'var(--color-negative)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(95,141,114,0.2)' : 'rgba(200,60,60,0.15)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Flags table */}
      {!selectedOrgId ? (
        <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-subtle)' }}>
            Select an organization to view and manage its widget feature flags.
          </p>
        </div>
      ) : loadingFlags ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading widget settings…</div>
      ) : flagsError ? (
        <div style={{ color: 'var(--color-negative)', fontSize: 14 }}>{flagsError}</div>
      ) : (
        <div style={card}>
          <div style={sectionLabel}>
            Flags for {selectedClient?.orgName || selectedOrgId}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Flag', 'Description', 'Status', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 20px', textAlign: 'left', fontSize: 11,
                    color: 'var(--color-text-subtle)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WIDGET_FLAGS.map(def => {
                const isOn = !!flags[def.key];
                const isSaving = saving === def.key;
                return (
                  <tr key={def.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {def.label}
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {def.key}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--color-text-muted)', maxWidth: 300 }}>
                      {def.description}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: isOn ? 'rgba(95,141,114,0.12)' : 'rgba(44,40,37,0.06)',
                        color: isOn ? 'var(--color-positive)' : 'var(--color-text-muted)',
                      }}>
                        {isOn ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <button
                        style={{ ...toggleTrack(isOn), opacity: isSaving ? 0.5 : 1 }}
                        onClick={() => void handleToggle(def.key)}
                        disabled={isSaving}
                        aria-label={`Toggle ${def.label}`}
                      >
                        <div style={toggleKnob(isOn)} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WidgetFlagsPage;
