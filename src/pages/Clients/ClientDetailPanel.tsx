import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { X, Plus } from 'lucide-react';

interface Flag {
  flagKey: string;
  scopeOrg: string;
  value: string | boolean;
  updatedAt: string;
}

interface Note {
  orgId: string;
  createdAt: string;
  noteBody: string;
  createdBy: string;
}

interface ClientDetail {
  orgId: string;
  orgName: string;
  industry?: string;
  status?: string;
  notes: Note[];
  flags: Flag[];
}

interface Props {
  orgId: string;
  onClose: () => void;
}

const ClientDetailPanel: React.FC<Props> = ({ orgId, onClose }) => {
  const { apiFetch } = useWorldData();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/clients/${orgId}`)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/notes/${orgId}`, {
        method: 'POST',
        body: JSON.stringify({ noteBody: newNote.trim() }),
      });
      setNewNote('');
      load();
    } catch (e) {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-white/10 flex flex-col z-50 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <div className="text-sm font-medium text-white">{detail?.orgName ?? orgId}</div>
          <div className="text-xs text-gray-500">{orgId}</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading…</div>
      ) : !detail ? (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm">Failed to load</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Info */}
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Info</div>
            <div className="space-y-1 text-sm text-gray-300">
              {detail.industry && <div>Industry: <span className="text-white">{detail.industry}</span></div>}
              {detail.status && <div>Status: <span className="text-white">{detail.status}</span></div>}
            </div>
          </div>

          {/* Feature flags */}
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Feature Flags</div>
            {detail.flags.length === 0 ? (
              <div className="text-xs text-gray-600">No per-org flags set</div>
            ) : (
              <div className="space-y-1">
                {detail.flags.map(f => (
                  <div key={f.flagKey} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{f.flagKey}</span>
                    <span className={`px-2 py-0.5 rounded text-white ${String(f.value) === 'true' ? 'bg-green-800' : 'bg-gray-700'}`}>
                      {String(f.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Notes</div>
            <div className="space-y-2 mb-3">
              {detail.notes.length === 0 ? (
                <div className="text-xs text-gray-600">No notes yet</div>
              ) : (
                detail.notes.map((note, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-200 whitespace-pre-wrap">{note.noteBody}</div>
                    <div className="text-xs text-gray-600 mt-1">{note.createdBy} · {new Date(note.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 p-2 resize-none focus:outline-none focus:border-white/30"
              />
              <button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailPanel;
