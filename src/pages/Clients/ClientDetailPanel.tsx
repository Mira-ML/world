import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

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
interface TrendPoint { date: string; conversations: number; newPersons: number; }
interface NoteConvo { conversationId: string; closedAt: string; outcome: string; summary: string; personDisplayName: string; }
interface ClientDetail {
  orgId: string; orgName: string; status?: string; agentId?: string;
  conversationsMtd?: number; conversationsLastMonth?: number; totalPersons?: number;
  trend?: TrendPoint[]; segmentBreakdown?: Record<string, number>;
  billingStatus?: string; lastActive?: string; noteworthy?: NoteConvo[];
  notes: Note[]; flags: Flag[]; billing?: BillingInfo;
}

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

// Phase 2 will add partner agent rules here with ruleScope="partner_agent#{agentId}"
interface DecorumRules {
  staffPresentBehavior: string | null;
  staffOfferTrigger: string | null;
  staffDepartureMessage: string | null;
  heartbeatTimeoutSeconds: number | null;
}

const DECORUM_DEFAULTS: DecorumRules = {
  staffPresentBehavior: 'muted_listening',
  staffOfferTrigger: 'contextual',
  staffDepartureMessage: '',
  heartbeatTimeoutSeconds: 90,
};

const BEHAVIOR_OPTIONS = [
  { value: 'muted_listening', label: 'Muted listening' },
  { value: 'silent', label: 'Silent' },
  { value: 'active', label: 'Active' },
];

const TRIGGER_OPTIONS = [
  { value: 'explicit_request_only', label: 'Explicit request only' },
  { value: 'contextual', label: 'Contextual (agent judgment)' },
];

interface Props { orgId: string; onClose: () => void; }

const ClientDetailModal: React.FC<Props> = ({ orgId, onClose }) => {
  const { apiFetch, baseApiFetch } = useWorldData();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  // Outcomes
  const [outcomes, setOutcomes] = useState<{ outcomeCounts: Record<string, number>; conversionRate: number; totalScored: number } | null>(null);
  const [outcomesLoading, setOutcomesLoading] = useState(false);

  // Noteworthy Logic pill
  const [noteworthyOpen, setNoteworthyOpen] = useState(false);
  const [noteworthyPrompt, setNoteworthyPrompt] = useState<string | null>(null);
  const [noteworthyLoading, setNoteworthyLoading] = useState(false);

  // Agent prompt
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptSections, setPromptSections] = useState<PromptSection[]>([]);
  const [promptAgentName, setPromptAgentName] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);

  // Org settings (for toggles like dashboardAssistantEnabled)
  const [orgSettings, setOrgSettings] = useState<{ dashboardAssistantEnabled?: boolean }>({});
  const [orgSettingsLoading, setOrgSettingsLoading] = useState(false);
  const [orgSettingsSaving, setOrgSettingsSaving] = useState<string | null>(null);

  // Global decorum defaults
  const [globalDecorum, setGlobalDecorum] = useState<DecorumRules>({ ...DECORUM_DEFAULTS });
  const [globalDecorumLoading, setGlobalDecorumLoading] = useState(false);
  const [globalDecorumSaving, setGlobalDecorumSaving] = useState(false);
  const [globalDecorumDirty, setGlobalDecorumDirty] = useState(false);

  // Per-org decorum overrides (null = inherit from global)
  const [decorumRules, setDecorumRules] = useState<DecorumRules>({ staffPresentBehavior: null, staffOfferTrigger: null, staffDepartureMessage: null, heartbeatTimeoutSeconds: null });
  const [decorumHasOverride, setDecorumHasOverride] = useState(false);
  const [decorumLoading, setDecorumLoading] = useState(false);
  const [decorumSaving, setDecorumSaving] = useState(false);
  const [decorumDirty, setDecorumDirty] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/clients/${orgId}`).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Load outcomes
    setOutcomesLoading(true);
    apiFetch(`/outcomes?orgId=${orgId}`)
      .then(setOutcomes)
      .catch(() => {})
      .finally(() => setOutcomesLoading(false));
    // Load integrations
    setIntegrationsLoading(true);
    apiFetch(`/clients/${orgId}/integrations`)
      .then(d => setIntegrations(d.integrations ?? []))
      .catch(() => {})
      .finally(() => setIntegrationsLoading(false));
    // Load org settings
    setOrgSettingsLoading(true);
    baseApiFetch(`/orgs/settings`, { headers: { 'X-Internal-Org-Id': orgId } })
      .then(d => setOrgSettings({ dashboardAssistantEnabled: d.dashboardAssistantEnabled ?? false }))
      .catch(() => {})
      .finally(() => setOrgSettingsLoading(false));
    // Load global decorum defaults
    setGlobalDecorumLoading(true);
    baseApiFetch(`/decorum/rules/global`)
      .then(d => {
        setGlobalDecorum({
          staffPresentBehavior: d.staffPresentBehavior ?? DECORUM_DEFAULTS.staffPresentBehavior,
          staffOfferTrigger: d.staffOfferTrigger ?? DECORUM_DEFAULTS.staffOfferTrigger,
          staffDepartureMessage: d.staffDepartureMessage ?? DECORUM_DEFAULTS.staffDepartureMessage,
          heartbeatTimeoutSeconds: d.heartbeatTimeoutSeconds ?? DECORUM_DEFAULTS.heartbeatTimeoutSeconds,
        });
        setGlobalDecorumDirty(false);
      })
      .catch(() => setGlobalDecorum({ ...DECORUM_DEFAULTS }))
      .finally(() => setGlobalDecorumLoading(false));
    // Load per-org decorum overrides (raw org record, not merged)
    setDecorumLoading(true);
    baseApiFetch(`/decorum/rules`, { headers: { 'X-Internal-Org-Id': orgId } })
      .then(d => {
        // The GET endpoint returns merged values; we store them as overrides
        // but we mark hasOverride so the UI knows this org has a record
        setDecorumRules({
          staffPresentBehavior: d.staffPresentBehavior ?? null,
          staffOfferTrigger: d.staffOfferTrigger ?? null,
          staffDepartureMessage: d.staffDepartureMessage ?? null,
          heartbeatTimeoutSeconds: d.heartbeatTimeoutSeconds ?? null,
        });
        setDecorumHasOverride(true);
        setDecorumDirty(false);
      })
      .catch(() => {
        setDecorumRules({ staffPresentBehavior: null, staffOfferTrigger: null, staffDepartureMessage: null, heartbeatTimeoutSeconds: null });
        setDecorumHasOverride(false);
      })
      .finally(() => setDecorumLoading(false));
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

  const handleGlobalDecorumChange = (field: keyof DecorumRules, value: string | number | null) => {
    setGlobalDecorum(prev => ({ ...prev, [field]: value }));
    setGlobalDecorumDirty(true);
  };

  const handleGlobalDecorumSave = async () => {
    setGlobalDecorumSaving(true);
    try {
      await baseApiFetch(`/decorum/rules/global`, {
        method: 'PUT',
        body: JSON.stringify({ ruleScope: 'staff', ...globalDecorum }),
      });
      setGlobalDecorumDirty(false);
    } catch (e) {} finally { setGlobalDecorumSaving(false); }
  };

  const handleDecorumChange = (field: keyof DecorumRules, value: string | number | null) => {
    setDecorumRules(prev => ({ ...prev, [field]: value === '' ? null : value }));
    setDecorumDirty(true);
  };

  const handleDecorumSave = async () => {
    setDecorumSaving(true);
    try {
      // Only send non-null fields so the server does a partial update
      const payload: Record<string, unknown> = { ruleScope: 'staff' };
      if (decorumRules.staffPresentBehavior != null) payload.staffPresentBehavior = decorumRules.staffPresentBehavior;
      if (decorumRules.staffOfferTrigger != null) payload.staffOfferTrigger = decorumRules.staffOfferTrigger;
      if (decorumRules.staffDepartureMessage != null) payload.staffDepartureMessage = decorumRules.staffDepartureMessage;
      if (decorumRules.heartbeatTimeoutSeconds != null) payload.heartbeatTimeoutSeconds = decorumRules.heartbeatTimeoutSeconds;
      await baseApiFetch(`/decorum/rules`, {
        method: 'PUT',
        headers: { 'X-Internal-Org-Id': orgId },
        body: JSON.stringify(payload),
      });
      setDecorumHasOverride(true);
      setDecorumDirty(false);
    } catch (e) {} finally { setDecorumSaving(false); }
  };

  const handleOrgSettingToggle = async (key: string) => {
    const newValue = !((orgSettings as any)[key] ?? false);
    setOrgSettingsSaving(key);
    try {
      await baseApiFetch(`/orgs/settings`, {
        method: 'PATCH',
        headers: { 'X-Internal-Org-Id': orgId },
        body: JSON.stringify({ [key]: newValue }),
      });
      setOrgSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (e) {} finally { setOrgSettingsSaving(null); }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Styles ──────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(44,40,37,0.5)', backdropFilter: 'blur(2px)',
  };
  const modal: React.CSSProperties = {
    position: 'relative', width: '90vw', maxWidth: 720, maxHeight: '85vh',
    background: 'var(--color-bg-surface)', borderRadius: 16,
    border: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  };
  const section: React.CSSProperties = { padding: '20px 28px', borderBottom: '1px solid var(--color-border)' };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 };
  const collapsibleHeader: React.CSSProperties = {
    ...section, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none',
  };

  const statusDotColor = (status: string) => {
    if (status === 'connected' || status === 'enabled') return 'var(--color-positive)';
    return 'var(--color-text-subtle)';
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ ...section, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>{detail?.orgName || orgId}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>{orgId}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 28, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</div>
          ) : detail && (
            <>
              {/* Meta */}
              <div style={section}>
                <div style={label}>Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['Status', detail.status || '—']].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Stats (from daily snapshots) ────────── */}
              <div style={section}>
                <div style={label}>Performance</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {(detail.conversationsMtd ?? 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Conversations MTD <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>live</span></div>
                    {detail.conversationsLastMonth != null && (() => {
                      const diff = (detail.conversationsMtd ?? 0) - detail.conversationsLastMonth;
                      if (diff === 0) return null;
                      const arrow = diff > 0 ? '\u2191' : '\u2193';
                      const color = diff > 0 ? '#5F8D72' : '#A85951';
                      return <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2 }}>{arrow}{Math.abs(diff)} vs last month</div>;
                    })()}
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {(detail.totalPersons ?? 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Total Persons <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>as of yesterday</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {detail.lastActive || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Last Active</div>
                  </div>
                </div>
                {/* Trend chart */}
                {detail.trend && detail.trend.length >= 2 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 6 }}>
                      Last 30 days <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>as of yesterday</span>
                    </div>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={detail.trend}>
                        <XAxis dataKey="date" tick={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}
                          formatter={(v: number, name: string) => [v, name === 'conversations' ? 'Conversations' : 'New Persons']}
                          labelFormatter={(l: string) => l}
                        />
                        <Line type="monotone" dataKey="conversations" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="newPersons" stroke="#CCA33B" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Segment breakdown */}
                {detail.segmentBreakdown && Object.keys(detail.segmentBreakdown).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 6 }}>Segment Breakdown (yesterday)</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {Object.entries(detail.segmentBreakdown).map(([seg, count]) => (
                        <div key={seg} style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{seg}</span>
                          <span style={{ color: 'var(--color-text-subtle)', marginLeft: 4 }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Noteworthy Conversations ──────────── */}
              {detail.noteworthy && detail.noteworthy.length > 0 && (
                <div style={section}>
                  <div style={label}>Noteworthy Conversations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detail.noteworthy.map(c => (
                      <div key={c.conversationId} style={{ background: 'var(--color-bg-primary)', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {c.personDisplayName || 'Guest'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                            {c.closedAt?.slice(0, 10)} · {c.outcome}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{c.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Integrations ──────────────────────────── */}
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

              {/* ── Outcomes ────────────────────────────── */}
              <div style={section}>
                <div style={label}>Outcomes</div>
                {outcomesLoading ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
                ) : outcomes && outcomes.totalScored > 0 ? (() => {
                  const oc = outcomes.outcomeCounts;
                  const total = outcomes.totalScored;
                  const segments: { key: string; label: string; count: number; color: string }[] = [
                    { key: 'converted',  label: 'Converted',  count: oc.converted ?? 0,  color: '#2e7d32' },
                    { key: 'engaged',    label: 'Engaged',     count: oc.engaged ?? 0,    color: '#00695c' },
                    { key: 'browsed',    label: 'Browsed',     count: oc.browsed ?? 0,    color: '#9e9e9e' },
                    { key: 'bounced',    label: 'Bounced',     count: oc.bounced ?? 0,    color: '#f57f17' },
                    { key: 'frustrated', label: 'Frustrated',  count: oc.frustrated ?? 0, color: '#c62828' },
                  ];
                  return (
                    <>
                      <div style={{ display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                        {segments.filter(s => s.count > 0).map(s => (
                          <div
                            key={s.key}
                            title={`${s.label}: ${s.count} (${((s.count / total) * 100).toFixed(1)}%)`}
                            style={{
                              flex: s.count, background: s.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 10, fontWeight: 600, minWidth: s.count > 0 ? 18 : 0,
                            }}
                          >
                            {((s.count / total) * 100) >= 10 ? s.label : ''}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                        {segments.map(s => (
                          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                            <span style={{ color: 'var(--color-text-primary)' }}>{s.label}</span>
                            <span style={{ color: 'var(--color-text-subtle)', fontWeight: 500 }}>{s.count}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#2e7d32' }}>
                          {(outcomes.conversionRate * 100).toFixed(1)}%
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>conversion rate</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                          ({total.toLocaleString()} scored)
                        </span>
                      </div>
                    </>
                  );
                })() : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>No outcome data available</div>
                )}
              </div>

              {/* ── Billing & Usage ────────────────────── */}
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

              {/* ── Decorum Rules ── */}
              <div style={section}>
                <div style={label}>Decorum Rules</div>

                {/* ── Global Defaults ── */}
                <div style={{ background: 'var(--color-bg-primary)', borderRadius: 10, padding: '16px 18px', marginBottom: 16, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Global Defaults</div>
                  {globalDecorumLoading ? (
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff present behavior</div>
                          <select value={globalDecorum.staffPresentBehavior ?? ''} onChange={e => handleGlobalDecorumChange('staffPresentBehavior', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none', cursor: 'pointer' }}>
                            {BEHAVIOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff offer trigger</div>
                          <select value={globalDecorum.staffOfferTrigger ?? ''} onChange={e => handleGlobalDecorumChange('staffOfferTrigger', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none', cursor: 'pointer' }}>
                            {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff departure message</div>
                          <input type="text" value={globalDecorum.staffDepartureMessage ?? ''} onChange={e => handleGlobalDecorumChange('staffDepartureMessage', e.target.value)} placeholder="e.g. 'I'm back if you need anything else!'" style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Auto-resume timeout (seconds)</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4, fontStyle: 'italic' }}>How long after staff heartbeat expires before the agent auto-resumes</div>
                          <input type="number" value={globalDecorum.heartbeatTimeoutSeconds ?? 90} onChange={e => handleGlobalDecorumChange('heartbeatTimeoutSeconds', e.target.value ? parseInt(e.target.value, 10) : null)} min={10} max={600} style={{ width: 100, padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none' }} />
                        </div>
                      </div>
                      <button onClick={handleGlobalDecorumSave} disabled={globalDecorumSaving || !globalDecorumDirty} style={{ marginTop: 14, padding: '6px 20px', fontSize: 13, fontWeight: 600, background: 'var(--color-accent)', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: globalDecorumDirty ? 'pointer' : 'default', opacity: globalDecorumSaving || !globalDecorumDirty ? 0.45 : 1, fontFamily: 'var(--font-input)' }}>
                        {globalDecorumSaving ? 'Saving…' : 'Save Global Defaults'}
                      </button>
                    </>
                  )}
                </div>

                {/* ── Per-Org Override ── */}
                <div style={{ borderRadius: 10, padding: '16px 18px', border: '1px dashed var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Override for this client</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 12, fontStyle: 'italic' }}>Leave empty to inherit global defaults</div>
                  {decorumLoading ? (
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff present behavior</div>
                          <select value={decorumRules.staffPresentBehavior ?? ''} onChange={e => handleDecorumChange('staffPresentBehavior', e.target.value || null)} style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: decorumRules.staffPresentBehavior ? 'var(--color-text-primary)' : 'var(--color-text-subtle)', fontFamily: 'var(--font-input)', outline: 'none', cursor: 'pointer' }}>
                            <option value="">Inherit global ({BEHAVIOR_OPTIONS.find(o => o.value === globalDecorum.staffPresentBehavior)?.label ?? globalDecorum.staffPresentBehavior})</option>
                            {BEHAVIOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff offer trigger</div>
                          <select value={decorumRules.staffOfferTrigger ?? ''} onChange={e => handleDecorumChange('staffOfferTrigger', e.target.value || null)} style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: decorumRules.staffOfferTrigger ? 'var(--color-text-primary)' : 'var(--color-text-subtle)', fontFamily: 'var(--font-input)', outline: 'none', cursor: 'pointer' }}>
                            <option value="">Inherit global ({TRIGGER_OPTIONS.find(o => o.value === globalDecorum.staffOfferTrigger)?.label ?? globalDecorum.staffOfferTrigger})</option>
                            {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Staff departure message</div>
                          <input type="text" value={decorumRules.staffDepartureMessage ?? ''} onChange={e => handleDecorumChange('staffDepartureMessage', e.target.value)} placeholder={globalDecorum.staffDepartureMessage ? `Inherit: "${globalDecorum.staffDepartureMessage}"` : 'Inherit global default'} style={{ width: '100%', padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Auto-resume timeout (seconds)</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 4, fontStyle: 'italic' }}>How long after staff heartbeat expires before the agent auto-resumes</div>
                          <input type="number" value={decorumRules.heartbeatTimeoutSeconds ?? ''} onChange={e => handleDecorumChange('heartbeatTimeoutSeconds', e.target.value ? parseInt(e.target.value, 10) : null)} min={10} max={600} placeholder={`Inherit: ${globalDecorum.heartbeatTimeoutSeconds ?? 90}s`} style={{ width: 140, padding: '6px 10px', fontSize: 13, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontFamily: 'var(--font-input)', outline: 'none' }} />
                        </div>
                      </div>
                      <button onClick={handleDecorumSave} disabled={decorumSaving || !decorumDirty} style={{ marginTop: 14, padding: '6px 20px', fontSize: 13, fontWeight: 600, background: 'var(--color-accent)', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: decorumDirty ? 'pointer' : 'default', opacity: decorumSaving || !decorumDirty ? 0.45 : 1, fontFamily: 'var(--font-input)' }}>
                        {decorumSaving ? 'Saving…' : 'Save Override'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Noteworthy Logic ─────────────────────── */}
              <div
                style={collapsibleHeader}
                onClick={() => setNoteworthyOpen(o => !o)}
              >
                <div style={{ ...label, marginBottom: 0 }}>Noteworthy Logic</div>
                {noteworthyOpen ? <ChevronUp size={16} color="var(--color-text-subtle)" /> : <ChevronDown size={16} color="var(--color-text-subtle)" />}
              </div>
              {noteworthyOpen && (
                <div style={{ padding: '0 28px 20px' }}>
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

              {/* ── Agent Prompt ──────────────────────────── */}
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
                <div style={{ padding: '0 28px 20px' }}>
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

              {/* ── Org Settings Toggles ─────────────── */}
              <div style={section}>
                <div style={label}>Org Settings</div>
                {orgSettingsLoading ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Dashboard Assistant (Beta)</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>Enable AI assistant in the client dashboard</div>
                    </div>
                    <button
                      onClick={() => handleOrgSettingToggle('dashboardAssistantEnabled')}
                      disabled={orgSettingsSaving === 'dashboardAssistantEnabled'}
                      style={{
                        position: 'relative', width: 40, height: 22, borderRadius: 11,
                        border: 'none', cursor: orgSettingsSaving ? 'default' : 'pointer',
                        background: orgSettings.dashboardAssistantEnabled ? 'var(--color-accent)' : 'var(--color-border)',
                        transition: 'background 0.2s', flexShrink: 0,
                        opacity: orgSettingsSaving === 'dashboardAssistantEnabled' ? 0.5 : 1,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2, left: orgSettings.dashboardAssistantEnabled ? 20 : 2,
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                )}
              </div>

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
              <div style={{ ...section, borderBottom: 'none' }}>
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
    </div>
  );
};

export default ClientDetailModal;
