import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { X, Plus } from 'lucide-react';

interface Flag { flagKey: string; scopeOrg: string; value: string | boolean; updatedAt: string; }
interface Note { orgId: string; createdAt: string; noteBody: string; createdBy: string; }
interface ClientDetail { orgId: string; orgName: string; industry?: string; status?: string; notes: Note[]; flags: Flag[]; }
interface Props { orgId: string; onClose: () => void; }

const ClientDetailPanel: React.FC<Props> = ({ orgId, onClose }) => {
  const { apiFetch } = useWorldData();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/clients/${orgId}`).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/notes/${orgId}`, { method: 'POST', body: JSON.stringify({ noteBody: newNote.trim() }) });
      setNewNote('');
      load();
    } catch (e) {} finally { setSaving(false); }
  };

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
