import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';

/* -- Types ------------------------------------------------- */

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

interface OrgSummary {
  orgId: string;
  orgName: string;
}

/* -- Default config ---------------------------------------- */

const DEFAULT_CONFIG: WidgetConfig = {
  orbColor: '#A85951',
  brandColor: '#A85951',
  position: 'bottom-right',
  previewPlaceholderText: 'Ask Mira anything...',
  previewBarBackgroundColor: '#2C2218',
  previewBarBorderColor: 'rgba(168,89,81,0.3)',
  previewPlaceholderTextColor: 'rgba(255,255,255,0.5)',
  expandedBackgroundColor: '#FAF3ED',
  expandedMessageBubbleColor: '#FFFFFF',
  expandedMessageTextColor: '#2C2218',
  expandedAgentBubbleColor: '#F0E6DC',
  expandedAgentTextColor: '#2C2218',
  expandedInputBarBackgroundColor: '#FFFFFF',
  expandedInputBarBorderColor: 'rgba(44,40,37,0.12)',
  expandedInputBarTextColor: '#2C2218',
  inputBarGlowColor: '#A85951',
  agentDisplayName: 'Mira',
};

/* -- Color field labels for read-only display -------------- */

const COLOR_FIELDS: { key: string; label: string; section: 'collapsed' | 'expanded' }[] = [
  { key: 'orbColor', label: 'Orb', section: 'collapsed' },
  { key: 'brandColor', label: 'Brand accent', section: 'collapsed' },
  { key: 'previewBarBackgroundColor', label: 'Bar background', section: 'collapsed' },
  { key: 'previewBarBorderColor', label: 'Bar border', section: 'collapsed' },
  { key: 'previewPlaceholderTextColor', label: 'Placeholder text', section: 'collapsed' },
  { key: 'previewMessageBackgroundColor', label: 'Message bubble', section: 'collapsed' },
  { key: 'previewMessageTextColor', label: 'Message text', section: 'collapsed' },
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

/* -- Styles ------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', overflow: 'hidden',
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
};
const swatchRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
};
const swatch: React.CSSProperties = {
  width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--color-border)', flexShrink: 0,
};

/* -- Component --------------------------------------------- */

const WidgetConfigPage: React.FC = () => {
  const { apiFetch } = useWorldData();

  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  const [config, setConfig] = useState<WidgetConfig>({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  // Load org list
  const loadOrgs = useCallback(async () => {
    try {
      const data = await apiFetch('/clients');
      const list: OrgSummary[] = (data.clients || data || []).map((c: any) => ({
        orgId: c.orgId || c.organizationId,
        orgName: c.orgName || c.organizationName || c.orgId || c.organizationId,
      }));
      setOrgs(list);
      if (list.length > 0) {
        setSelectedOrgId(list[0].orgId);
        setSelectedOrgName(list[0].orgName);
      }
    } catch {
      // fallback — no org list available
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Load widget config for selected org
  const loadConfig = useCallback(async (orgId: string) => {
    if (!orgId) return;
    setConfigLoading(true);
    try {
      const data = await apiFetch(`/widget-config?orgId=${encodeURIComponent(orgId)}`);
      const stored = data.config || {};
      setConfig({ ...DEFAULT_CONFIG, ...stored });
    } catch {
      setConfig({ ...DEFAULT_CONFIG });
    } finally {
      setConfigLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void loadOrgs(); }, [loadOrgs]);
  useEffect(() => { if (selectedOrgId) void loadConfig(selectedOrgId); }, [selectedOrgId, loadConfig]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = orgs.find(o => o.orgId === orgId);
    setSelectedOrgName(org?.orgName || orgId);
  };

  const collapsedFields = COLOR_FIELDS.filter(f => f.section === 'collapsed');
  const expandedFields = COLOR_FIELDS.filter(f => f.section === 'expanded');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Widget Configuration
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Read-only view of each org's live widget settings.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading...</div>
      ) : (
        <>
          {/* Org selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>Organization</label>
            <select
              value={selectedOrgId}
              onChange={e => handleOrgChange(e.target.value)}
              style={{
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--color-text-primary)',
                outline: 'none', fontFamily: 'var(--font-input)', minWidth: 240,
              }}
            >
              {orgs.map(o => (
                <option key={o.orgId} value={o.orgId}>{o.orgName}</option>
              ))}
            </select>
          </div>

          {configLoading ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading widget config...</div>
          ) : (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {/* Left: read-only color swatches */}
              <div style={{ flex: '1 1 55%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* General info */}
                <div style={cardStyle}>
                  <div style={sectionLabel}>General</div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-muted)', width: 140 }}>Agent display name</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{config.agentDisplayName || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-muted)', width: 140 }}>Placeholder text</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{config.previewPlaceholderText || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-muted)', width: 140 }}>Position</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{config.position || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsed colors */}
                <div style={cardStyle}>
                  <div style={sectionLabel}>Collapsed (Launcher)</div>
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {collapsedFields.map(field => (
                      <div key={field.key} style={swatchRow}>
                        <div style={{ ...swatch, background: (config[field.key] as string) || '#000' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{field.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {(config[field.key] as string) || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded colors */}
                <div style={cardStyle}>
                  <div style={sectionLabel}>Expanded (Chat)</div>
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {expandedFields.map(field => (
                      <div key={field.key} style={swatchRow}>
                        <div style={{ ...swatch, background: (config[field.key] as string) || '#000' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{field.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {(config[field.key] as string) || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: live preview */}
              <div style={{ flex: '0 0 380px', position: 'sticky', top: 24 }}>
                <div style={cardStyle}>
                  <div style={sectionLabel}>Live Preview</div>
                  {/* Preview stage */}
                  <div style={{ background: '#1a1a2e', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {/* Collapsed bar preview */}
                    <div style={{
                      width: '100%', maxWidth: 320,
                      background: config.previewBarBackgroundColor || '#2C2218',
                      border: `1px solid ${config.previewBarBorderColor || 'rgba(168,89,81,0.3)'}`,
                      borderRadius: 28, padding: '10px 16px',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: config.orbColor || '#A85951', flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 13, color: config.previewPlaceholderTextColor || 'rgba(255,255,255,0.5)',
                        fontFamily: config.previewPlaceholderFontFamily || 'Inter, sans-serif',
                      }}>
                        {config.previewPlaceholderText || 'Ask me anything...'}
                      </span>
                    </div>

                    {/* Expanded chat preview */}
                    <div style={{
                      width: '100%', maxWidth: 320,
                      background: config.expandedBackgroundColor || '#FAF3ED',
                      borderRadius: 16, overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {/* Chat header */}
                      <div style={{
                        padding: '10px 14px',
                        background: config.brandColor || '#A85951',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                      }}>
                        {config.agentDisplayName || 'Mira'}
                      </div>
                      {/* Messages */}
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Agent message */}
                        <div style={{
                          alignSelf: 'flex-start', maxWidth: '80%',
                          background: config.expandedAgentBubbleColor || '#F0E6DC',
                          color: config.expandedAgentTextColor || '#2C2218',
                          padding: '8px 12px', borderRadius: '14px 14px 14px 4px',
                          fontSize: 12, lineHeight: 1.4,
                        }}>
                          Hi there! How can I help you today?
                        </div>
                        {/* User message */}
                        <div style={{
                          alignSelf: 'flex-end', maxWidth: '80%',
                          background: config.expandedMessageBubbleColor || '#FFFFFF',
                          color: config.expandedMessageTextColor || '#2C2218',
                          padding: '8px 12px', borderRadius: '14px 14px 4px 14px',
                          fontSize: 12, lineHeight: 1.4,
                        }}>
                          Tell me about your products
                        </div>
                      </div>
                      {/* Input bar */}
                      <div style={{
                        padding: '8px 12px', margin: '0 10px 10px',
                        background: config.expandedInputBarBackgroundColor || '#FFFFFF',
                        border: `1px solid ${config.expandedInputBarBorderColor || 'rgba(44,40,37,0.12)'}`,
                        borderRadius: 20, fontSize: 12,
                        color: config.expandedInputBarTextColor || '#2C2218',
                        boxShadow: config.inputBarGlowColor ? `0 0 8px ${config.inputBarGlowColor}40` : 'none',
                      }}>
                        Type a message...
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 20px', fontSize: 11, color: 'var(--color-text-subtle)',
                    borderTop: '1px solid var(--color-border)',
                  }}>
                    Preview uses {selectedOrgName}'s live widget settings.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WidgetConfigPage;
