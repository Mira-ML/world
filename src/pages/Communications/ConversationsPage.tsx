import React, { useState, useEffect, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface ConversationRow {
  conversationId: string;
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string | null;
  displayName: string | null;
  messageCount: number;
  startedAt: string;
  closedAt: string | null;
}

interface ConversationMessage {
  messageId: number;
  role: string;
  content: string;
  timestamp: string | null;
}

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
  padding: 24,
};

const ConversationsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<ConversationMessage[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Filters
  const [filterOrg, setFilterOrg] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/communications/conversations');
      setConversations(data.conversations || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const loadTranscript = async (conversationId: string) => {
    if (expandedId === conversationId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(conversationId);
    setTranscriptLoading(true);
    try {
      const data = await apiFetch(`/communications/conversations/${conversationId}/history`);
      setTranscript(data.messages || []);
    } catch {
      setTranscript([]);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const filtered = conversations.filter(c => {
    if (filterOrg && !(c.orgName || '').toLowerCase().includes(filterOrg.toLowerCase()) && !c.orgId.toLowerCase().includes(filterOrg.toLowerCase())) return false;
    if (filterEmail && !(c.userEmail || '').toLowerCase().includes(filterEmail.toLowerCase())) return false;
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      if (new Date(c.startedAt) < from) return false;
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setDate(to.getDate() + 1);
      if (new Date(c.startedAt) >= to) return false;
    }
    return true;
  });

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text" placeholder="Filter by org..."
            value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 13, width: 160,
            }}
          />
        </div>
        <input
          type="text" placeholder="Filter by email..."
          value={filterEmail} onChange={e => setFilterEmail(e.target.value)}
          style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 13, width: 180,
          }}
        />
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          From:
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 12 }} />
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          To:
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 12 }} />
        </label>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, padding: 48 }}>
          No admin agent conversations found.
        </div>
      ) : (
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Client Org', 'User', 'Email', 'Messages', 'Started', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isExpanded = expandedId === c.conversationId;
                return (
                  <React.Fragment key={c.conversationId}>
                    <tr
                      onClick={() => loadTranscript(c.conversationId)}
                      style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{c.orgName || c.orgId}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{c.displayName || c.userId}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>{c.userEmail || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>{c.messageCount}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(c.startedAt)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                          background: c.closedAt ? 'var(--color-border)' : 'var(--color-positive)',
                          color: c.closedAt ? 'var(--color-text-muted)' : '#fff',
                        }}>
                          {c.closedAt ? 'Ended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td colSpan={7} style={{ padding: '12px 24px 20px', background: 'var(--color-bg-primary)' }}>
                          {transcriptLoading ? (
                            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading transcript...</div>
                          ) : transcript.length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No messages.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                              {transcript.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <span style={{
                                    fontSize: 11, fontWeight: 600, minWidth: 60, textAlign: 'right',
                                    color: m.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                  }}>
                                    {m.role === 'assistant' ? 'Mira' : 'Customer'}
                                  </span>
                                  <span style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>{m.content}</span>
                                  {m.timestamp && (
                                    <span style={{ fontSize: 10, color: 'var(--color-text-subtle)', whiteSpace: 'nowrap' }}>
                                      {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default ConversationsPage;
