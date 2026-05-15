import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';

interface Gap {
  orgId: string;
  brandName: string;
  agentName: string;
  question: string;
  intent: string;
  conversationId: string | null;
  matchExisted: boolean;
  matchedFaqId: string | null;
  matchedQuestion: string | null;
  severity: string;
  ts: string;
}

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', padding: 20,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 16,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
};
const th: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, color: 'var(--color-text-subtle)',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '8px 10px', borderBottom: '1px solid var(--color-border)',
};
const td: React.CSSProperties = {
  fontSize: 13, color: 'var(--color-text-primary)', padding: '10px',
  borderBottom: '1px solid var(--color-border)', verticalAlign: 'top',
};
const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12 };

const fmtTime = (iso: string) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return iso; }
};

const KnowledgeGapsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [errors, setErrors] = useState<Gap[]>([]);
  const [highCount, setHighCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/knowledge-gaps').catch(() => ({ gaps: [], highPriorityCount: 0 })),
      apiFetch('/knowledge-gaps/errors').catch(() => ({ errors: [] })),
    ]).then(([all, errs]) => {
      setGaps(all?.gaps ?? []);
      setHighCount(all?.highPriorityCount ?? 0);
      setErrors(errs?.errors ?? []);
    }).finally(() => setLoading(false));
  }, [apiFetch]);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading knowledge gaps…</div>;
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Knowledge</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionLabel}>Gaps (30 days)</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)' }}>{gaps.length}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Questions the agent could not fully answer
          </div>
        </div>
        <div style={{ ...card, borderColor: highCount > 0 ? 'var(--color-danger, #c0392b)' : 'var(--color-border)' }}>
          <div style={sectionLabel}>FAQ System Errors</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: highCount > 0 ? 'var(--color-danger, #c0392b)' : 'var(--color-text-primary)' }}>
            {highCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Answer existed but the agent missed it
          </div>
        </div>
      </div>

      {/* High-priority deep-dive feed */}
      <div style={card}>
        <div style={sectionLabel}>FAQ System Errors — answer existed but agent missed it</div>
        {errors.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>None in the last 30 days. 🎉</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Brand</th>
                  <th style={th}>Customer asked</th>
                  <th style={th}>Existing FAQ it matched</th>
                  <th style={th}>Conversation</th>
                  <th style={th}>When</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((g, i) => (
                  <tr key={`${g.conversationId}-${i}`}>
                    <td style={td}>{g.brandName || g.orgId}</td>
                    <td style={td}>
                      {g.question}
                      {g.intent && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 4 }}>{g.intent}</div>
                      )}
                    </td>
                    <td style={td}>
                      {g.matchedQuestion || '—'}
                      {g.matchedFaqId && (
                        <div style={{ ...mono, color: 'var(--color-text-subtle)', marginTop: 4 }}>{g.matchedFaqId}</div>
                      )}
                    </td>
                    <td style={{ ...td, ...mono }}>{g.conversationId || '—'}</td>
                    <td style={td}>{fmtTime(g.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All gaps */}
      <div style={card}>
        <div style={sectionLabel}>All knowledge gaps (30 days)</div>
        {gaps.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No gaps recorded.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Brand</th>
                  <th style={th}>Question</th>
                  <th style={th}>Intent</th>
                  <th style={th}>Severity</th>
                  <th style={th}>Conversation</th>
                  <th style={th}>When</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={`${g.conversationId}-${i}`}>
                    <td style={td}>{g.brandName || g.orgId}</td>
                    <td style={td}>{g.question}</td>
                    <td style={{ ...td, color: 'var(--color-text-muted)' }}>{g.intent || '—'}</td>
                    <td style={td}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        color: g.matchExisted ? 'var(--color-danger, #c0392b)' : 'var(--color-text-muted)',
                        background: g.matchExisted ? 'rgba(192,57,43,0.12)' : 'var(--color-bg-muted, rgba(0,0,0,0.04))',
                      }}>
                        {g.severity}
                      </span>
                    </td>
                    <td style={{ ...td, ...mono }}>{g.conversationId || '—'}</td>
                    <td style={td}>{fmtTime(g.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGapsPage;
