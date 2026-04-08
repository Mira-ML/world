import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Plus, X, Save, RefreshCw, ChevronDown, Info, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

interface SegmentDef {
  segmentId: string;
  orgId: string;
  segmentName: string;
  segmentDescription: string;
  segmentType: string;
  color: string;
  memberCount: number;
  scope: string;
  tier: 'system' | 'channel' | 'emergent';
  channel: string;
  rules: RuleCondition[] | null;
  priority: number;
  active: boolean;
  autoActivateOn: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RuleCondition {
  attribute: string;
  operator: string;
  value: string;
}

interface OrgOption {
  orgId: string;
  orgName: string;
}

type TabId = 'system' | 'channel' | 'emergent';

/* ──────────────────────────── Styles ─────────────────────────── */

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11,
  fontWeight: 600, color: 'var(--color-text-subtle)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid var(--color-border)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13,
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border)',
};

const ADMIN_KEY = 'mira-internal-admin-2026';

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'is', gte: '≥', lte: '≤', gt: '>', lt: '<', contains: 'contains',
};

const CHANNEL_LABELS: Record<string, string> = {
  universal: 'Universal', toast: 'Toast', shopify: 'Shopify', lodgify: 'Lodgify', chat: 'Chat',
};

const CHANNEL_COLORS: Record<string, string> = {
  toast: '#ea580c', shopify: '#16a34a', lodgify: '#0284c7', universal: 'var(--color-accent)', chat: '#8b5cf6',
};

/* ──────────────────────────── Helpers ────────────────────────── */

function humanizeRule(r: RuleCondition): string {
  const op = OPERATOR_LABELS[r.operator] || r.operator;
  const attr = r.attribute.replace(/_/g, ' ');
  return `${attr} ${op} ${r.value}`;
}

function humanizeRules(rules: RuleCondition[] | null): string {
  if (!rules || rules.length === 0) return '—';
  return rules.map(humanizeRule).join(' AND ');
}

/* ──────────────────────────── Component ──────────────────────── */

const SegmentsPage: React.FC = () => {
  const { apiFetch, baseApiFetch } = useWorldData();

  const [activeTab, setActiveTab] = useState<TabId>('system');
  const [segments, setSegments] = useState<SegmentDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Org data for coverage panel + emergent tab
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgSegments, setOrgSegments] = useState<Record<string, SegmentDef[]>>({});
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Edit modal
  const [editSeg, setEditSeg] = useState<SegmentDef | null>(null);
  const [editForm, setEditForm] = useState<{
    segmentName: string; segmentDescription: string; color: string; channel: string;
    autoActivateOn: string; priority: number; rules: RuleCondition[];
  }>({ segmentName: '', segmentDescription: '', color: '#6b7280', channel: 'universal', autoActivateOn: '', priority: 50, rules: [] });
  const [saving, setSaving] = useState(false);

  // Create modal (channel tab only)
  const [showCreate, setShowCreate] = useState(false);

  // ── Fetch global segments ─────────────────────────────────────

  const fetchGlobals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await baseApiFetch('/segments/global');
      setSegments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [baseApiFetch]);

  useEffect(() => { fetchGlobals(); }, [fetchGlobals]);

  // ── Fetch orgs + per-org segments ─────────────────────────────

  useEffect(() => {
    apiFetch('/clients').then((data: OrgOption[]) => {
      setOrgs(data.sort((a, b) => (a.orgName || '').localeCompare(b.orgName || '')));
    }).catch(() => {});
  }, [apiFetch]);

  const fetchOrgSegments = useCallback(async () => {
    if (orgs.length === 0) return;
    setLoadingOrgs(true);
    const result: Record<string, SegmentDef[]> = {};
    for (const org of orgs) {
      try {
        const data = await baseApiFetch(`/segments/v2?orgId=${encodeURIComponent(org.orgId)}`);
        result[org.orgId] = data;
      } catch { /* skip */ }
    }
    setOrgSegments(result);
    setLoadingOrgs(false);
  }, [orgs, baseApiFetch]);

  useEffect(() => { fetchOrgSegments(); }, [fetchOrgSegments]);

  // ── Derived data ──────────────────────────────────────────────

  const systemSegs = segments.filter(s => s.tier === 'system' || (!s.tier && s.segmentType === 'system'));
  const channelSegs = segments.filter(s => s.tier === 'channel');

  const emergentSegs: (SegmentDef & { orgName: string })[] = [];
  for (const org of orgs) {
    const segs = orgSegments[org.orgId] || [];
    for (const s of segs) {
      if (s.tier === 'emergent') {
        emergentSegs.push({ ...s, orgName: org.orgName || org.orgId });
      }
    }
  }

  // Count active orgs per channel segment
  function activeOrgCount(seg: SegmentDef): number {
    let count = 0;
    for (const org of orgs) {
      const segs = orgSegments[org.orgId] || [];
      const match = segs.find(s => s.segmentId === seg.segmentId);
      if (match && match.active) count++;
    }
    return count;
  }

  // ── Edit modal handlers ───────────────────────────────────────

  const openEdit = (seg: SegmentDef) => {
    setEditSeg(seg);
    setEditForm({
      segmentName: seg.segmentName,
      segmentDescription: seg.segmentDescription || '',
      color: seg.color,
      channel: seg.channel || 'universal',
      autoActivateOn: seg.autoActivateOn || '',
      priority: seg.priority ?? 50,
      rules: seg.rules ? seg.rules.map(r => ({ ...r })) : [],
    });
    setShowCreate(false);
  };

  const openCreate = () => {
    setEditSeg(null);
    setEditForm({
      segmentName: '', segmentDescription: '', color: '#6b7280',
      channel: 'toast', autoActivateOn: '', priority: 50, rules: [{ attribute: '', operator: 'eq', value: '' }],
    });
    setShowCreate(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (showCreate) {
        // Create new global channel segment via seed update
        const body = {
          segmentName: editForm.segmentName,
          segmentDescription: editForm.segmentDescription,
          color: editForm.color,
          channel: editForm.channel,
          autoActivateOn: editForm.autoActivateOn || null,
          priority: editForm.priority,
          rules: editForm.rules.filter(r => r.attribute.trim()),
          active: true,
        };
        await baseApiFetch('/segments/v2', {
          method: 'POST',
          body: JSON.stringify({ ...body, orgId: 'global', tier: 'channel', scope: 'global' }),
        });
      } else if (editSeg) {
        const body = {
          segmentName: editForm.segmentName,
          segmentDescription: editForm.segmentDescription,
          color: editForm.color,
          channel: editForm.channel,
          autoActivateOn: editForm.autoActivateOn || null,
          priority: editForm.priority,
          rules: editForm.rules.filter(r => r.attribute.trim()),
        };
        await baseApiFetch(`/segments/v2/${encodeURIComponent(editSeg.segmentId)}?orgId=${encodeURIComponent(editSeg.orgId)}`, {
          method: 'PUT',
          headers: { 'X-Admin-Key': ADMIN_KEY },
          body: JSON.stringify(body),
        });
      }
      setEditSeg(null);
      setShowCreate(false);
      await fetchGlobals();
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active for emergent segments ───────────────────────

  const toggleEmergent = async (seg: SegmentDef & { orgName: string }) => {
    try {
      await baseApiFetch(`/segments/v2/${encodeURIComponent(seg.segmentId)}?orgId=${encodeURIComponent(seg.orgId)}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !seg.active }),
      });
      await fetchOrgSegments();
    } catch (e: any) {
      alert('Toggle failed: ' + e.message);
    }
  };

  // ── Tab style ─────────────────────────────────────────────────

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: '8px 18px', fontWeight: activeTab === id ? 600 : 400, fontSize: 13,
    color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
    borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-primary)', transition: 'color 0.15s',
  });

  // ── Render ────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Segments</h1>
        {activeTab === 'channel' && (
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'var(--color-accent)',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-primary)', color: '#FFFFFF',
          }}>
            <Plus size={12} /> Add Channel Segment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
        <button style={tabStyle('system')} onClick={() => setActiveTab('system')}>System</button>
        <button style={tabStyle('channel')} onClick={() => setActiveTab('channel')}>Channel</button>
        <button style={tabStyle('emergent')} onClick={() => setActiveTab('emergent')}>Emergent</button>
      </div>

      {loading && <div style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>Loading segments...</div>}
      {error && <div style={{ padding: 16, color: 'var(--color-negative)', fontSize: 13 }}>{error}</div>}

      {/* ─── System tab ─────────────────────────────────────────── */}
      {!loading && activeTab === 'system' && (
        <div style={card}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--color-border)' }}>
            <Info size={13} style={{ color: 'var(--color-text-subtle)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              System segments are assigned automatically by Mira's analysis pipeline. They cannot be edited.
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Color</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Priority</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Members</th>
              </tr>
            </thead>
            <tbody>
              {systemSegs.map(seg => (
                <tr key={seg.segmentId}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{seg.segmentName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{seg.segmentDescription}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-input)' }}>{seg.color}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-input)' }}>{seg.priority}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{seg.memberCount.toLocaleString()}</td>
                </tr>
              ))}
              {systemSegs.length === 0 && (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-subtle)' }}>No system segments found. Run seed-globals first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Channel tab ────────────────────────────────────────── */}
      {!loading && activeTab === 'channel' && (
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Channel</th>
                <th style={thStyle}>Rules</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Priority</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Active Orgs</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {channelSegs.map(seg => (
                <tr key={seg.segmentId}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{seg.segmentName}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                      background: `${CHANNEL_COLORS[seg.channel] || 'var(--color-accent)'}15`,
                      color: CHANNEL_COLORS[seg.channel] || 'var(--color-accent)',
                    }}>
                      {CHANNEL_LABELS[seg.channel] || seg.channel}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 280 }}>
                    {humanizeRules(seg.rules)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-input)' }}>{seg.priority}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{activeOrgCount(seg)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => openEdit(seg)} style={{
                      padding: '4px 10px', background: 'none',
                      border: '1px solid var(--color-border)', borderRadius: 6,
                      fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                      color: 'var(--color-text-muted)',
                    }}>Edit</button>
                  </td>
                </tr>
              ))}
              {channelSegs.length === 0 && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-subtle)' }}>No channel segments. Add one or run seed-globals.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Emergent tab ───────────────────────────────────────── */}
      {!loading && activeTab === 'emergent' && (
        <div style={card}>
          {loadingOrgs && <div style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>Loading org segments...</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Org</th>
                <th style={thStyle}>Color</th>
                <th style={thStyle}>Rules</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {emergentSegs.map(seg => (
                <tr key={`${seg.orgId}-${seg.segmentId}`}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{seg.segmentName}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)' }}>{seg.orgName}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: seg.color }} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-input)' }}>{seg.color}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 240 }}>
                    {humanizeRules(seg.rules)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {seg.createdAt ? new Date(seg.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => toggleEmergent(seg)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: seg.active ? 'var(--color-accent)' : 'var(--color-text-subtle)',
                    }}>
                      {seg.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {emergentSegs.length === 0 && !loadingOrgs && (
                <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-subtle)' }}>No emergent segments yet. These are auto-created by the agent.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Org coverage panel ──────────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Org Coverage</h2>
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Organization</th>
                <th style={thStyle}>Active Segments</th>
                <th style={thStyle}>Integrations</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => {
                const segs = orgSegments[org.orgId] || [];
                const activeNames = segs.filter(s => s.active !== false).map(s => s.segmentName);
                const integrations: string[] = [];
                if (segs.some(s => s.channel === 'toast' && s.active)) integrations.push('Toast');
                if (segs.some(s => s.channel === 'shopify' && s.active)) integrations.push('Shopify');
                if (segs.some(s => s.channel === 'lodgify' && s.active)) integrations.push('Lodgify');

                return (
                  <tr key={org.orgId}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{org.orgName || org.orgId}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {activeNames.length > 0 ? activeNames.join(', ') : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {integrations.map(i => (
                          <span key={i} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500,
                            background: `${CHANNEL_COLORS[i.toLowerCase()] || 'var(--color-accent)'}15`,
                            color: CHANNEL_COLORS[i.toLowerCase()] || 'var(--color-accent)',
                          }}>{i}</span>
                        ))}
                        {integrations.length === 0 && <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orgs.length === 0 && (
                <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-subtle)' }}>Loading organizations...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Edit / Create Modal ─────────────────────────────────── */}
      {(editSeg || showCreate) && (
        <div onClick={() => { setEditSeg(null); setShowCreate(false); }} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(44,40,37,0.5)', backdropFilter: 'blur(2px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', width: '90vw', maxWidth: 600, maxHeight: '85vh',
            background: 'var(--color-bg-surface)', borderRadius: 16,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {showCreate ? 'New Channel Segment' : `Edit: ${editSeg?.segmentName}`}
              </span>
              <button onClick={() => { setEditSeg(null); setShowCreate(false); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
              }}><X size={16} /></button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name + Color */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
                  <input value={editForm.segmentName} onChange={e => setEditForm(f => ({ ...f, segmentName: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px', marginTop: 4, background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 6,
                      fontSize: 13, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color</label>
                  <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                    style={{ display: 'block', width: 38, height: 38, marginTop: 4, border: 'none', background: 'none', cursor: 'pointer' }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
                <textarea value={editForm.segmentDescription} onChange={e => setEditForm(f => ({ ...f, segmentDescription: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', marginTop: 4, background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)', borderRadius: 6,
                    fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                    resize: 'vertical', boxSizing: 'border-box',
                  }} />
              </div>

              {/* Channel + AutoActivate + Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Channel</label>
                  <select value={editForm.channel} onChange={e => setEditForm(f => ({ ...f, channel: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px', marginTop: 4, background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13,
                      fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)', appearance: 'none',
                    }}>
                    <option value="universal">Universal</option>
                    <option value="toast">Toast</option>
                    <option value="shopify">Shopify</option>
                    <option value="lodgify">Lodgify</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auto-activate on</label>
                  <input value={editForm.autoActivateOn} onChange={e => setEditForm(f => ({ ...f, autoActivateOn: e.target.value }))}
                    placeholder="toast / shopify / lodgify"
                    style={{
                      width: '100%', padding: '8px 10px', marginTop: 4, background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13,
                      fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
                  <input type="number" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%', padding: '8px 10px', marginTop: 4, background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13,
                      fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)', boxSizing: 'border-box',
                    }} />
                </div>
              </div>

              {/* Rules builder */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                  Rules (all must match)
                </label>
                {editForm.rules.map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <input value={rule.attribute} placeholder="attribute key"
                      onChange={e => {
                        const updated = [...editForm.rules];
                        updated[idx] = { ...updated[idx], attribute: e.target.value };
                        setEditForm(f => ({ ...f, rules: updated }));
                      }}
                      style={{
                        flex: 2, padding: '6px 8px', background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)', borderRadius: 6,
                        fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                      }} />
                    <select value={rule.operator}
                      onChange={e => {
                        const updated = [...editForm.rules];
                        updated[idx] = { ...updated[idx], operator: e.target.value };
                        setEditForm(f => ({ ...f, rules: updated }));
                      }}
                      style={{
                        flex: 1, padding: '6px 8px', background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)', borderRadius: 6,
                        fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)', appearance: 'none',
                      }}>
                      <option value="eq">is</option>
                      <option value="gte">≥</option>
                      <option value="lte">≤</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                      <option value="contains">contains</option>
                    </select>
                    <input value={rule.value} placeholder="value"
                      onChange={e => {
                        const updated = [...editForm.rules];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setEditForm(f => ({ ...f, rules: updated }));
                      }}
                      style={{
                        flex: 1, padding: '6px 8px', background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)', borderRadius: 6,
                        fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                      }} />
                    <button onClick={() => {
                      setEditForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-negative)', padding: 4 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setEditForm(f => ({ ...f, rules: [...f.rules, { attribute: '', operator: 'eq', value: '' }] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    background: 'none', border: '1px dashed var(--color-border)', borderRadius: 6,
                    fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-primary)', color: 'var(--color-text-muted)',
                  }}>
                  <Plus size={11} /> Add condition
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8,
              borderTop: '1px solid var(--color-border)',
            }}>
              <button onClick={() => { setEditSeg(null); setShowCreate(false); }} style={{
                padding: '8px 14px', background: 'none', border: '1px solid var(--color-border)',
                borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                color: 'var(--color-text-muted)',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editForm.segmentName.trim()} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 14px', background: 'var(--color-accent)', color: '#FFFFFF',
                border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'var(--font-primary)', opacity: saving ? 0.6 : 1,
              }}>
                <Save size={12} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SegmentsPage;
