import React, { useState, useEffect, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FeedbackRecord {
  feedbackId: string;
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string;
  rawQuote: string;
  classifiedCategory: 'feature_request' | 'ux_complaint' | 'praise' | 'other';
  timestamp: string;
  status: 'new' | 'reviewed' | 'shipped' | 'declined';
}

const STATUS_OPTIONS: FeedbackRecord['status'][] = ['new', 'reviewed', 'shipped', 'declined'];
const CATEGORY_OPTIONS: FeedbackRecord['classifiedCategory'][] = ['feature_request', 'ux_complaint', 'praise', 'other'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new: { bg: '#4A6C6F', color: '#fff' },
  reviewed: { bg: '#D4A843', color: '#fff' },
  shipped: { bg: '#5F8D72', color: '#fff' },
  declined: { bg: '#A85951', color: '#fff' },
};

const CATEGORY_LABELS: Record<string, string> = {
  feature_request: 'Feature Request',
  ux_complaint: 'UX Complaint',
  praise: 'Praise',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  feature_request: { bg: 'rgba(74, 108, 111, 0.12)', color: '#4A6C6F' },
  ux_complaint: { bg: 'rgba(168, 89, 81, 0.12)', color: '#A85951' },
  praise: { bg: 'rgba(95, 141, 114, 0.12)', color: '#5F8D72' },
  other: { bg: 'rgba(143, 127, 115, 0.12)', color: '#8F7F73' },
};

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
  padding: 24,
};

const FeedbackPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/communications/feedback');
      setRecords(data.records || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (feedbackId: string, status: FeedbackRecord['status']) => {
    try {
      await apiFetch(`/communications/feedback/${feedbackId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setRecords(prev => prev.map(r => r.feedbackId === feedbackId ? { ...r, status } : r));
    } catch {
      // silent
    }
  };

  const filtered = records.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterCategory !== 'all' && r.classifiedCategory !== filterCategory) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SelectFilter label="Status" value={filterStatus} onChange={setFilterStatus}
          options={[{ value: 'all', label: 'All Statuses' }, ...STATUS_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]} />
        <SelectFilter label="Category" value={filterCategory} onChange={setFilterCategory}
          options={[{ value: 'all', label: 'All Categories' }, ...CATEGORY_OPTIONS.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))]} />
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, padding: 48 }}>
          No feedback records yet. Feedback is captured automatically from conversations with the Mira dashboard assistant.
        </div>
      ) : (
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Org', 'User', 'Quote', 'Category', 'Time', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const isExpanded = expandedId === r.feedbackId;
                return (
                  <React.Fragment key={r.feedbackId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : r.feedbackId)}
                      style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{r.orgName || r.orgId}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{r.userEmail || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.rawQuote}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge text={CATEGORY_LABELS[r.classifiedCategory] || r.classifiedCategory} {...CATEGORY_COLORS[r.classifiedCategory]} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(r.timestamp)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge text={r.status} {...STATUS_COLORS[r.status]} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td colSpan={7} style={{ padding: '12px 24px 20px', background: 'var(--color-bg-primary)' }}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Full Quote</div>
                            <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>
                              "{r.rawQuote}"
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Status:</span>
                            <select
                              value={r.status}
                              onChange={e => updateStatus(r.feedbackId, e.target.value as FeedbackRecord['status'])}
                              onClick={e => e.stopPropagation()}
                              style={{
                                padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 13,
                              }}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────── */

const Badge: React.FC<{ text: string; bg: string; color: string }> = ({ text, bg, color }) => (
  <span style={{
    display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px',
    borderRadius: 8, background: bg, color, whiteSpace: 'nowrap',
  }}>
    {text}
  </span>
);

const SelectFilter: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
    {label}:
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 13,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default FeedbackPage;
