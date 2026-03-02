import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Save, ChevronDown, ChevronUp, History } from 'lucide-react';

interface Prompt {
  promptId: string;
  displayName: string;
  description: string;
  promptBody: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  previousVersions?: string[];
}

const PromptsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch('/prompts')
      .then(d => setPrompts(d.prompts ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const handleSave = async (promptId: string) => {
    const body = editing[promptId];
    if (body === undefined) return;
    setSaving(s => ({ ...s, [promptId]: true }));
    setSaveError(e => ({ ...e, [promptId]: '' }));
    try {
      const updated = await apiFetch('/prompts', {
        method: 'PUT',
        body: JSON.stringify({ promptId, promptBody: body }),
      });
      setPrompts(prev => prev.map(p => p.promptId === promptId ? updated.prompt : p));
      setEditing(e => { const n = { ...e }; delete n[promptId]; return n; });
    } catch (e: any) {
      setSaveError(prev => ({ ...prev, [promptId]: e.message }));
    } finally {
      setSaving(s => ({ ...s, [promptId]: false }));
    }
  };

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading prompts…</div>;
  if (error) return <div className="p-6 text-red-400 text-sm">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold text-white">Prompts</h1>
        <div className="text-xs text-gray-500">
          {prompts.length} prompts · Edit and save without redeploying
        </div>
      </div>

      {prompts.map(prompt => {
        const isEditing = editing[prompt.promptId] !== undefined;
        const isExpanded = expanded[prompt.promptId] !== false; // default open
        const currentBody = isEditing ? editing[prompt.promptId] : prompt.promptBody;

        return (
          <div key={prompt.promptId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(e => ({ ...e, [prompt.promptId]: !isExpanded }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 bg-white/10 px-2 py-0.5 rounded">
                  {prompt.promptId}
                </span>
                <span className="text-sm text-white font-medium">{prompt.displayName}</span>
                <span className="text-xs text-gray-600">v{prompt.version}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                {isEditing && <span className="text-xs text-yellow-400">unsaved</span>}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-4 space-y-3">
                {prompt.description && (
                  <div className="text-xs text-gray-500">{prompt.description}</div>
                )}

                <textarea
                  value={currentBody}
                  onChange={e => setEditing(prev => ({ ...prev, [prompt.promptId]: e.target.value }))}
                  rows={8}
                  className="w-full bg-gray-950 border border-white/10 rounded-lg text-sm text-gray-200 p-3 font-mono resize-y focus:outline-none focus:border-white/30"
                  spellCheck={false}
                />

                {saveError[prompt.promptId] && (
                  <div className="text-xs text-red-400">{saveError[prompt.promptId]}</div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    Last saved by {prompt.updatedBy || 'unknown'} · {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString() : '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt.previousVersions && prompt.previousVersions.length > 0 && (
                      <button
                        onClick={() => setShowHistory(h => ({ ...h, [prompt.promptId]: !h[prompt.promptId] }))}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <History size={12} />
                        History ({prompt.previousVersions.length})
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => setEditing(e => { const n = { ...e }; delete n[prompt.promptId]; return n; })}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => handleSave(prompt.promptId)}
                          disabled={saving[prompt.promptId]}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-950 text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          <Save size={12} />
                          {saving[prompt.promptId] ? 'Saving…' : 'Save'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showHistory[prompt.promptId] && prompt.previousVersions && (
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Version History</div>
                    {prompt.previousVersions.map((pv, i) => (
                      <div key={i} className="bg-gray-950 rounded-lg p-3 text-xs text-gray-500 font-mono whitespace-pre-wrap">
                        {pv.substring(0, 200)}{pv.length > 200 ? '…' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PromptsPage;
