import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';

interface Prompt {
  promptId: string;
  displayName: string;
  description: string;
  promptBody: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

type TabId = 'client-dashboard' | 'agents' | 'dashboard-assistant';

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)',
};

const PromptsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('client-dashboard');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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
      const updated = await apiFetch('/prompts', { method: 'PUT', body: JSON.stringify({ promptId, promptBody: body }) });
      setPrompts(prev => prev.map(p => p.promptId === promptId ? updated.prompt : p));
      setEditing(e => { const n = { ...e }; delete n[promptId]; return n; });
    } catch (e: any) {
      setSaveError(prev => ({ ...prev, [promptId]: e.message }));
    } finally {
      setSaving(s => ({ ...s, [promptId]: false }));
    }
  };

  const DASHBOARD_ASSISTANT_IDS = ['DASHBOARD_ASSISTANT_001', 'PRODUCT_KNOWLEDGE_001'];
  const tabPrompts = activeTab === 'agents'
    ? prompts.filter(p => p.promptId.startsWith('AGENT_'))
    : activeTab === 'dashboard-assistant'
    ? prompts.filter(p => DASHBOARD_ASSISTANT_IDS.includes(p.promptId))
    : prompts.filter(p => !p.promptId.startsWith('AGENT_') && !DASHBOARD_ASSISTANT_IDS.includes(p.promptId));

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: activeTab === id ? 600 : 400,
    color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-primary)',
    transition: 'color 0.15s',
  });

  if (loading) return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading prompts…</div>;
  if (error) return <div style={{ padding: 24, color: 'var(--color-negative)', fontSize: 14 }}>{error}</div>;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Prompts</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{tabPrompts.length} prompts</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
        <button style={tabStyle('client-dashboard')} onClick={() => setActiveTab('client-dashboard')}>
          Client Dashboard
        </button>
        <button style={tabStyle('agents')} onClick={() => setActiveTab('agents')}>
          Agents
        </button>
        <button style={tabStyle('dashboard-assistant')} onClick={() => setActiveTab('dashboard-assistant')}>
          Dashboard Assistant
        </button>
      </div>

      {activeTab === 'dashboard-assistant' && (
        <div style={{
          padding: '10px 14px', background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)', borderRadius: 8,
          fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6,
        }}>
          Behavior and product knowledge for the Mira dashboard assistant embedded in studio.mira.ml.
          DASHBOARD_ASSISTANT_001 defines tone, tools, and guardrails. PRODUCT_KNOWLEDGE_001 is the
          merchant-facing knowledge base the assistant references when answering questions.
        </div>
      )}

      {activeTab === 'agents' && (
        <div style={{
          padding: '10px 14px', background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)', borderRadius: 8,
          fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6,
        }}>
          These are the system prompt section templates injected into every ConsumerAgent conversation.
          Each section is conditionally added based on the org's data (FAQs, integrations, network connections).
          Tokens like <code style={{ fontFamily: 'var(--font-input)', background: 'var(--color-bg-primary)', padding: '1px 4px', borderRadius: 3 }}>{'{token}'}</code> are
          replaced at runtime. Edits take effect within 5 minutes via cache TTL.
        </div>
      )}

      {tabPrompts.map(prompt => {
        const isExpanded = expanded[prompt.promptId];
        const isDirty = editing[prompt.promptId] !== undefined;
        const currentBody = editing[prompt.promptId] ?? prompt.promptBody;

        return (
          <div key={prompt.promptId} style={card}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => setExpanded(e => ({ ...e, [prompt.promptId]: !e[prompt.promptId] }))}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{prompt.displayName}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-input)' }}>{prompt.promptId}</span>
                  {isDirty && <span style={{ fontSize: 10, background: 'var(--color-accent-muted)', color: 'var(--color-accent)', borderRadius: 4, padding: '2px 6px' }}>unsaved</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{prompt.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>v{prompt.version}</span>
                {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-subtle)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-subtle)' }} />}
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
                <textarea
                  value={currentBody}
                  onChange={ev => setEditing(ed => ({ ...ed, [prompt.promptId]: ev.target.value }))}
                  rows={12}
                  style={{
                    width: '100%', marginTop: 16, background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px',
                    fontSize: 13, color: 'var(--color-text-primary)', outline: 'none',
                    resize: 'vertical', fontFamily: 'var(--font-input)', lineHeight: 1.6, boxSizing: 'border-box',
                  }}
                />
                {saveError[prompt.promptId] && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-negative)' }}>{saveError[prompt.promptId]}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                    Last edited {new Date(prompt.updatedAt).toLocaleDateString()} by {prompt.updatedBy}
                  </span>
                  <button
                    onClick={() => handleSave(prompt.promptId)}
                    disabled={!isDirty || saving[prompt.promptId]}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', background: isDirty ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isDirty ? '#FFFFFF' : 'var(--color-text-subtle)',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      fontFamily: 'var(--font-primary)', cursor: isDirty ? 'pointer' : 'default',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Save size={13} />
                    {saving[prompt.promptId] ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PromptsPage;
