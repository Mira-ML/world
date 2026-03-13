import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface Flag { flagKey: string; scopeOrg: string; value: string | boolean; updatedAt: string; }
interface Note { orgId: string; createdAt: string; noteBody: string; createdBy: string; }
interface BillingInfo {
  subscriptionStatus?: string;
  includedConversations?: number;
  overageBlocksCharged?: number;
  conversationsUsed?: number;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}
interface ClientDetail { orgId: string; orgName: string; industry?: string; status?: string; agentId?: string; notes: Note[]; flags: Flag[]; billing?: BillingInfo; }

interface Integration {
  key: string;
  label: string;
  status: string;
  details: Record<string, string>;
}

interface PromptSection {
  key: string;
  label: string;
  description: string;
  content: string;
}

interface Props { orgId: string; onClose: () => void; }

const ClientDetailPanel: React.FC<Props> = ({ orgId, onClose }) => {
  const { apiFetch } = useWorldData();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  // Noteworthy Logic pill
  const [noteworthyOpen, setNoteworthyOpen] = useState(false);
  const [noteworthyPrompt, setNoteworthyPrompt] = useState<string | null>(null);
  const [noteworthyLoading, setNoteworthyLoading] = useState(false);

  // Widget preview
  const [widgetOpen, setWidgetOpen] = useState(false);

  // Agent prompt
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptSections, setPromptSections] = useState<PromptSection[]>([]);
  const [promptAgentName, setPromptAgentName] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/clients/${orgId}`).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Load integrations
    setIntegrationsLoading(true);
    apiFetch(`/clients/${orgId}/integrations`)
      .then(d => setIntegrations(d.integrations ?? []))
      .catch(() => {})
      .finally(() => setIntegrationsLoading(false));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load noteworthy prompt lazily when expanded
  useEffect(() => {
    if (noteworthyOpen && noteworthyPrompt === null && !noteworthyLoading) {
      setNoteworthyLoading(true);
      apiFetch('/prompts')
        .then((d: { prompts?: Array<{ prompt_id: string; prompt_body: string }> }) => {
          const entry = (d.prompts ?? []).find((p) => p.prompt_id === 'NOTEWORTHY_001');
          setNoteworthyPrompt(entry?.prompt_body ?? '');
        })
        .catch(() => setNoteworthyPrompt(''))
        .finally(() => setNoteworthyLoading(false));
    }
  }, [noteworthyOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load prompt data lazily when expanded
  useEffect(() => {
    if (promptOpen && promptSections.length === 0 && !promptLoading) {
      setPromptLoading(true);
      apiFetch(`/clients/${orgId}/prompt`)
        .then(d => {
          setPromptSections(d.sections ?? []);
          setPromptAgentName(d.agentName ?? '');
        })
        .catch(() => {})
        .finally(() => setPromptLoading(false));
    }
  }, [promptOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/notes/${orgId}`, { method: 'POST', body: JSON.stringify({ noteBody: newNote.trim() }) });
      setNewNote('');
      load();
    } catch (e) {} finally { setSaving(false); }
  };

  // ── Styles ──────────────────────────────────────────────────────
  const panel: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end',
  };
  const backdrop: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(44,40,37,0.4)' };
  const drawer: React.CSSProperties = {
    position: 'relative', width: 480, background: 'var(--color-bg-surface)',
    borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
    overflowY: 'auto', zIndex: 201,
  };
  const section: React.CSSProperties = { padding: '20px 24px', borderBottom: '1px solid var(--color-border)' };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 };
  const collapsibleHeader: React.CSSProperties = {
    ...section, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none',
  };

  const statusDotColor = (status: string) => {
    if (status === 'connected' || status === 'enabled') return 'var(--color-positive)';
    return 'var(--color-text-subtle)';
  };

  const buildWidgetSrcdoc = (agentId: string, organizationId: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; height: 100%; background: #f5f5f5; }
</style></head><body>
<script src="https://cdn.mira.ml/embed.html"></script>
<script>
  window.addEventListener('load', function() {
    if (window.MiraDirect) {
      window.MiraDirect.init({
        agentId: '${agentId}',
        organizationId: '${organizationId}',
      });
    }
  });
</script>
</body></html>`;

  return (
    <div style={panel}>
      <div style={backdrop} onClick={onClose} />
      <div style={drawer}>
        {/* Header */}
        <div style={{ ...section, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{detail?.orgName || orgId}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>{orgId}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
        ) : detail && (
          <>
            {/* Meta */}
            <div style={section}>
              <div style={label}>Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Industry', detail.industry || '—'], ['Status', detail.status || '—']].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 1: Integrations ──────────────────────────── */}
            <div style={section}>
              <div style={label}>Integrations</div>
              {integrationsLoading ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
              ) : integrations.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>No integrations found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {integrations.map(ig => (
                    <div key={ig.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: statusDotColor(ig.status),
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{ig.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{ig.status}</span>
                        </div>
                        {ig.details.shopDomain && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>
                            {ig.details.shopDomain}
                            {ig.details.connectedAt && ` · connected ${new Date(ig.details.connectedAt).toLocaleDateString()}`}
                          </div>
                        )}
                        {ig.details.propertyId && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>
                            Property: {ig.details.propertyId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SECTION 1b: Billing & Usage ────────────────────── */}
            {detail.billing && (() => {
              const b = detail.billing;
              const included = b.includedConversations ?? 1000;
              const used = b.conversationsUsed ?? 0;
              const overage = b.overageBlocksCharged ?? 0;
              const pct = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0;
              const statusColor = b.subscriptionStatus === 'active' ? 'var(--color-positive)'
                : b.subscriptionStatus === 'canceled' || b.subscriptionStatus === 'past_due' ? '#e74c3c'
                : 'var(--color-text-muted)';
              return (
                <div style={section}>
                  <div style={label}>Billing & Usage</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 2 }}>Subscription</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: statusColor }}>
                        {b.subscriptionStatus ?? 'none'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 2 }}>Overage Blocks</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{overage}</div>
                    </div>
                  </div>
                  {/* Usage bar */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 4 }}>
                      <span>Conversations this month</span>
                      <span>{used.toLocaleString()} / {included.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, transition: 'width 0.3s ease',
                        width: `${pct}%`,
                        background: pct >= 100 ? '#e74c3c' : pct >= 80 ? '#f39c12' : 'var(--color-accent)',
                      }} />
                    </div>
                  </div>
                  {b.currentPeriodEnd && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                      Period ends {new Date(b.currentPeriodEnd * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── SECTION 1c: Noteworthy Logic ─────────────────────── */}
            <div
              style={collapsibleHeader}
              onClick={() => setNoteworthyOpen(o => !o)}
            >
              <div style={{ ...label, marginBottom: 0 }}>Noteworthy Logic</div>
              {noteworthyOpen ? <ChevronUp size={16} color="var(--color-text-subtle)" /> : <ChevronDown size={16} color="var(--color-text-subtle)" />}
            </div>
            {noteworthyOpen && (
              <div style={{ padding: '0 24px 20px' }}>
                <div style={{
                  fontSize: 12, color: 'var(--color-text-subtle)', fontStyle: 'italic',
                  marginBottom: 12, lineHeight: 1.5,
                }}>
                  This prompt governs noteworthy classification across all conversations. Per-org overrides are a future feature.
                </div>
                {noteworthyLoading ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
                ) : noteworthyPrompt === '' ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>No prompt found</div>
                ) : (
                  <pre style={{
                    fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                    background: 'var(--color-bg-primary)', borderRadius: 8,
                    padding: '12px 16px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    color: 'var(--color-text-primary)', border: '1px solid var(--color-border)',
                  }}>
                    {noteworthyPrompt}
                  </pre>
                )}
              </div>
            )}

            {/* ── SECTION 2: Widget Preview ────────────────────────── */}
            <div
              style={collapsibleHeader}
              onClick={() => setWidgetOpen(o => !o)}
            >
              <div style={{ ...label, marginBottom: 0 }}>Widget Preview</div>
              {widgetOpen ? <ChevronUp size={16} color="var(--color-text-subtle)" /> : <ChevronDown size={16} color="var(--color-text-subtle)" />}
            </div>
            {widgetOpen && (
              <div style={{ padding: '0 24px 20px' }}>
                <div style={{
                  fontSize: 12, color: 'var(--color-text-subtle)', fontStyle: 'italic',
                  marginBottom: 12, lineHeight: 1.5,
                }}>
                  This is how their widget behaves — CSS overrides from their website won't appear here
                </div>
                {detail.agentId ? (
                  <iframe
                    title="Widget preview"
                    srcDoc={buildWidgetSrcdoc(detail.agentId, orgId)}
                    style={{
                      width: '100%', height: 500, border: '1px solid var(--color-border)',
                      borderRadius: 8, background: '#f5f5f5',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>
                    No agent ID found for this client
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION 3: Agent Prompt ──────────────────────────── */}
            <div
              style={collapsibleHeader}
              onClick={() => setPromptOpen(o => !o)}
            >
              <div style={{ ...label, marginBottom: 0 }}>
                Agent Prompt{promptAgentName ? ` — ${promptAgentName}` : ''}
              </div>
              {promptOpen ? <ChevronUp size={16} color="var(--color-text-subtle)" /> : <ChevronDown size={16} color="var(--color-text-subtle)" />}
            </div>
            {promptOpen && (
              <div style={{ padding: '0 24px 20px' }}>
                {promptLoading ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading prompt data…</div>
                ) : promptSections.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>No prompt data available</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {promptSections.map(ps => (
                      <div key={ps.key}>
                        <div style={{
                          fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: 'var(--color-accent)', marginBottom: 4,
                        }}>
                          {ps.label}
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic',
                          marginBottom: 8, lineHeight: 1.4,
                        }}>
                          {ps.description}
                        </div>
                        {ps.key === 'tools' ? (
                          /* Tools section — use colored badges */
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {ps.content.split('\n').map(line => {
                              const active = line.includes('Active');
                              return (
                                <span key={line} style={{
                                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 4,
                                  background: active ? 'rgba(95,141,114,0.12)' : 'rgba(44,40,37,0.06)',
                                  color: active ? 'var(--color-positive)' : 'var(--color-text-muted)',
                                }}>
                                  {line}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          /* All other sections — monospace code block */
                          <pre style={{
                            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                            background: 'var(--color-bg-primary)', borderRadius: 8,
                            padding: '12px 16px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            color: 'var(--color-text-primary)', border: '1px solid var(--color-border)',
                          }}>
                            {ps.content}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Flags */}
            {detail.flags.length > 0 && (
              <div style={section}>
                <div style={label}>Feature Flags</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detail.flags.map(f => (
                    <div key={`${f.flagKey}${f.scopeOrg}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-primary)' }}>{f.flagKey}</span>
                      <span style={{ color: f.value === 'true' || f.value === true ? 'var(--color-positive)' : 'var(--color-text-muted)' }}>
                        {String(f.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ ...section, flex: 1 }}>
              <div style={label}>Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {detail.notes.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>No notes yet</div>}
                {detail.notes.map(n => (
                  <div key={n.createdAt} style={{ background: 'var(--color-bg-primary)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{n.noteBody}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 6 }}>
                      {n.createdBy} · {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note…"
                  rows={2}
                  style={{
                    flex: 1, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--color-text-primary)',
                    outline: 'none', resize: 'vertical', fontFamily: 'var(--font-input)',
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={saving || !newNote.trim()}
                  style={{
                    background: 'var(--color-accent)', color: '#FFFFFF', border: 'none',
                    borderRadius: 8, padding: '0 12px', cursor: 'pointer', flexShrink: 0,
                    opacity: saving || !newNote.trim() ? 0.5 : 1,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPanel;
