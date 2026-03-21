import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';

/* ── Types ────────────────────────────────────────────── */

interface Client { orgId: string; orgName: string; industry?: string; }

interface WidgetConfig {
  orbColor?: string;
  brandColor?: string;
  position?: string;
  previewPlaceholderText?: string;
  previewBarBackgroundColor?: string;
  previewBarBorderColor?: string;
  previewPlaceholderTextColor?: string;
  previewMessageBackgroundColor?: string;
  previewMessageTextColor?: string;
  previewMessageFontFamily?: string;
  previewMessageFontSize?: string;
  previewPlaceholderFontFamily?: string;
  expandedBackgroundColor?: string;
  expandedMessageBubbleColor?: string;
  expandedMessageTextColor?: string;
  expandedAgentBubbleColor?: string;
  expandedAgentTextColor?: string;
  expandedInputBarBackgroundColor?: string;
  expandedInputBarBorderColor?: string;
  expandedInputBarTextColor?: string;
  inputBarGlowColor?: string;
  inputBarGlowEnabled?: boolean;
  agentDisplayName?: string;
  sessionPersistence?: string;
  [key: string]: unknown;
}

/* ── Color field definitions ─────────────────────────── */

interface ColorField {
  key: keyof WidgetConfig;
  label: string;
  section: 'collapsed' | 'expanded';
}

const COLOR_FIELDS: ColorField[] = [
  // Collapsed / launcher
  { key: 'orbColor', label: 'Orb', section: 'collapsed' },
  { key: 'brandColor', label: 'Brand accent', section: 'collapsed' },
  { key: 'previewBarBackgroundColor', label: 'Bar background', section: 'collapsed' },
  { key: 'previewBarBorderColor', label: 'Bar border', section: 'collapsed' },
  { key: 'previewPlaceholderTextColor', label: 'Placeholder text', section: 'collapsed' },
  { key: 'previewMessageBackgroundColor', label: 'Message bubble', section: 'collapsed' },
  { key: 'previewMessageTextColor', label: 'Message text', section: 'collapsed' },
  // Expanded / chat
  { key: 'expandedBackgroundColor', label: 'Chat background', section: 'expanded' },
  { key: 'expandedMessageBubbleColor', label: 'User bubble', section: 'expanded' },
  { key: 'expandedMessageTextColor', label: 'User text', section: 'expanded' },
  { key: 'expandedAgentBubbleColor', label: 'Agent bubble', section: 'expanded' },
  { key: 'expandedAgentTextColor', label: 'Agent text', section: 'expanded' },
  { key: 'expandedInputBarBackgroundColor', label: 'Input bar bg', section: 'expanded' },
  { key: 'expandedInputBarBorderColor', label: 'Input bar border', section: 'expanded' },
  { key: 'expandedInputBarTextColor', label: 'Input bar text', section: 'expanded' },
  { key: 'inputBarGlowColor', label: 'Input glow', section: 'expanded' },
];

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
const inputStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 6, padding: '6px 10px', fontSize: 13, color: 'var(--color-text-primary)',
  outline: 'none', fontFamily: 'var(--font-input)', width: 160,
};
const btnPrimary: React.CSSProperties = {
  background: 'var(--color-accent)', color: '#fff', border: 'none',
  borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'opacity 0.15s',
};

/* ── Component ────────────────────────────────────────── */

const WidgetConfigPage: React.FC = () => {
  const { apiFetch, baseApiFetch } = useWorldData();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const [config, setConfig] = useState<WidgetConfig>({});
  const [savedConfig, setSavedConfig] = useState<WidgetConfig>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load org list
  useEffect(() => {
    apiFetch('/clients')
      .then(d => setClients(d.clients ?? []))
      .catch(() => { /* best-effort */ })
      .finally(() => setLoadingClients(false));
  }, [apiFetch]);

  // Fetch widget config when org changes
  const loadConfig = useCallback(async (orgId: string) => {
    if (!orgId) { setConfig({}); setSavedConfig({}); return; }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await baseApiFetch(`/widget?orgId=${encodeURIComponent(orgId)}`);
      setConfig(data);
      setSavedConfig(data);
    } catch (e: any) {
      setError(e.message);
      setConfig({});
      setSavedConfig({});
    } finally {
      setLoading(false);
    }
  }, [baseApiFetch]);

  useEffect(() => { void loadConfig(selectedOrgId); }, [selectedOrgId, loadConfig]);

  // Save changes
  const handleSave = async () => {
    if (!selectedOrgId) return;
    setSaving(true);
    setFeedback(null);
    try {
      // Only send changed fields
      const changes: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(config)) {
        if (val !== savedConfig[key]) changes[key] = val;
      }
      if (Object.keys(changes).length === 0) {
        setFeedback({ type: 'success', msg: 'No changes to save.' });
        setSaving(false);
        return;
      }
      await baseApiFetch(`/widget?orgId=${encodeURIComponent(selectedOrgId)}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
      setSavedConfig({ ...config });
      setFeedback({ type: 'success', msg: 'Widget config saved.' });
    } catch (e: any) {
      setFeedback({ type: 'error', msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const selectedClient = clients.find(c => c.orgId === selectedOrgId);
  const collapsedFields = COLOR_FIELDS.filter(f => f.section === 'collapsed');
  const expandedFields = COLOR_FIELDS.filter(f => f.section === 'expanded');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Widget Configuration
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Configure widget appearance for any organization. Changes apply to both the customer widget and dashboard assistant.
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

      {!selectedOrgId ? (
        <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-subtle)' }}>
            Select an organization to configure its widget appearance.
          </p>
        </div>
      ) : loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading widget config…</div>
      ) : error ? (
        <div style={{ color: 'var(--color-negative)', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* General settings */}
          <div style={card}>
            <div style={sectionLabel}>General</div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', width: 140 }}>
                  Agent display name
                </label>
                <input
                  style={inputStyle}
                  value={(config.agentDisplayName as string) ?? ''}
                  onChange={e => updateField('agentDisplayName', e.target.value)}
                  placeholder="Mira"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', width: 140 }}>
                  Placeholder text
                </label>
                <input
                  style={{ ...inputStyle, width: 260 }}
                  value={(config.previewPlaceholderText as string) ?? ''}
                  onChange={e => updateField('previewPlaceholderText', e.target.value)}
                  placeholder="Ask me anything..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', width: 140 }}>
                  Position
                </label>
                <select
                  style={{ ...selectStyle, minWidth: 180 }}
                  value={(config.position as string) ?? 'bottom-right'}
                  onChange={e => updateField('position', e.target.value)}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collapsed / Launcher colors */}
          <div style={card}>
            <div style={sectionLabel}>Collapsed (Launcher)</div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {collapsedFields.map(field => (
                <ColorPicker
                  key={field.key}
                  label={field.label}
                  value={(config[field.key] as string) ?? ''}
                  onChange={val => updateField(field.key, val)}
                />
              ))}
            </div>
          </div>

          {/* Expanded / Chat colors */}
          <div style={card}>
            <div style={sectionLabel}>Expanded (Chat)</div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {expandedFields.map(field => (
                <ColorPicker
                  key={field.key}
                  label={field.label}
                  value={(config[field.key] as string) ?? ''}
                  onChange={val => updateField(field.key, val)}
                />
              ))}
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{ ...btnPrimary, opacity: isDirty && !saving ? 1 : 0.5 }}
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ── ColorPicker ──────────────────────────────────────── */

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const displayColor = value || '#000000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: displayColor,
            border: '1px solid var(--color-border)',
          }}
        />
        <input
          type="color"
          value={displayColor.startsWith('#') ? displayColor : '#000000'}
          onChange={e => onChange(e.target.value)}
          style={{
            position: 'absolute', inset: 0, opacity: 0,
            width: '100%', height: '100%', cursor: 'pointer',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          style={{
            fontSize: 11, color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)', border: 'none',
            background: 'transparent', outline: 'none', padding: 0,
            width: 100,
          }}
        />
      </div>
    </div>
  );
};

export default WidgetConfigPage;
