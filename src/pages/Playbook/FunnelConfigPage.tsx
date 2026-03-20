import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Check } from 'lucide-react';

interface OutcomeOption {
  key: string;
  label: string;
  description: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  { key: 'converted', label: 'converted', description: 'Clear transactional result' },
  { key: 'engaged', label: 'engaged', description: 'Meaningful exchange, attribute learned, referral or cart action' },
  { key: 'browsed', label: 'browsed', description: 'Viewed content, no action' },
  { key: 'bounced', label: 'bounced', description: 'Left quickly' },
  { key: 'frustrated', label: 'frustrated', description: 'Negative experience' },
];

const DEFAULT_CHECKED = ['converted', 'engaged'];

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
};

const FunnelConfigPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [selected, setSelected] = useState<string[]>(DEFAULT_CHECKED);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current value from feature flags
  useEffect(() => {
    let cancelled = false;
    apiFetch('/flags?key=funnel_positive_outcomes')
      .then((data: any) => {
        if (!cancelled && data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed)) setSelected(parsed);
          } catch { /* use defaults */ }
        }
      })
      .catch(() => { /* use defaults */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiFetch]);

  const handleToggle = useCallback((key: string) => {
    setSelected(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      return next;
    });
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch('/flags', {
        method: 'PUT',
        body: JSON.stringify({
          flag_key: 'funnel_positive_outcomes',
          scope_org: 'global',
          value: JSON.stringify(selected),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [apiFetch, selected]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>
        Loading funnel config…
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Funnel</h1>
      </div>

      <div style={card}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            Positive Outcome Definition
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Conversations counted as positive outcomes in the Home funnel.
            Applies globally. Stored in mira-feature-flags as funnel_positive_outcomes.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OUTCOME_OPTIONS.map(opt => {
              const checked = selected.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                    padding: '8px 12px', borderRadius: 8,
                    background: checked ? 'rgba(74, 108, 111, 0.06)' : 'transparent',
                    border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(opt.key)}
                    style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {opt.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'var(--color-accent)',
                color: '#FFFFFF',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-primary)', cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#2D6A4F', fontWeight: 500,
                animation: 'fadeIn 0.2s ease',
              }}>
                <Check size={14} />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default FunnelConfigPage;
