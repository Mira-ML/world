import React, { useState, useEffect, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Save, Mail, Bell, AlertTriangle, BarChart3, UserPlus, DollarSign } from 'lucide-react';

interface NotificationPrefs {
  dailyDigestEnabled: boolean;
  triggerNewOrgSignup: boolean;
  triggerCostThreshold: boolean;
  costThresholdAmount: number;
  triggerErrorRateSpike: boolean;
  notificationEmail: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dailyDigestEnabled: false,
  triggerNewOrgSignup: false,
  triggerCostThreshold: false,
  costThresholdAmount: 100,
  triggerErrorRateSpike: false,
  notificationEmail: '',
};

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
  padding: 24,
};

const NotificationsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/communications/notification-prefs');
      setPrefs({ ...DEFAULT_PREFS, ...data });
    } catch {
      // First load — no prefs yet, use defaults
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const update = (patch: Partial<NotificationPrefs>) => {
    setPrefs(p => ({ ...p, ...patch }));
    setDirty(true);
    setSaveMsg('');
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/communications/notification-prefs', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
      setDirty(false);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      {/* Email channel */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Mail size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Email Channel</h3>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
            background: 'var(--color-positive)', color: '#fff',
          }}>Active</span>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          Notification email
          <input
            type="email"
            value={prefs.notificationEmail}
            onChange={e => update({ notificationEmail: e.target.value })}
            placeholder="ops@mira.ml"
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)', fontFamily: 'var(--font-input)', fontSize: 13,
            }}
          />
        </label>
      </div>

      {/* Daily Digest */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <BarChart3 size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Daily Digest</h3>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Summary email each morning: new orgs, conversation volume, estimated costs, and active alerts.
        </p>
        <Toggle
          label="Enable daily digest"
          checked={prefs.dailyDigestEnabled}
          onChange={v => update({ dailyDigestEnabled: v })}
        />
      </div>

      {/* Event Triggers */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Bell size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Event Triggers</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus size={15} style={{ color: 'var(--color-text-muted)' }} />
            <Toggle
              label="New org signup"
              checked={prefs.triggerNewOrgSignup}
              onChange={v => update({ triggerNewOrgSignup: v })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={15} style={{ color: 'var(--color-text-muted)' }} />
              <Toggle
                label="Cost threshold exceeded"
                checked={prefs.triggerCostThreshold}
                onChange={v => update({ triggerCostThreshold: v })}
              />
            </div>
            {prefs.triggerCostThreshold && (
              <div style={{ marginLeft: 25, marginTop: 8 }}>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Threshold: $
                  <input
                    type="number"
                    min={1}
                    value={prefs.costThresholdAmount}
                    onChange={e => update({ costThresholdAmount: Number(e.target.value) || 0 })}
                    style={{
                      width: 80, padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
                      fontFamily: 'var(--font-input)', fontSize: 13,
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={15} style={{ color: 'var(--color-text-muted)' }} />
            <Toggle
              label="Agent error rate spike"
              checked={prefs.triggerErrorRateSpike}
              onChange={v => update({ triggerErrorRateSpike: v })}
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={!dirty || saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: dirty ? 'pointer' : 'default',
            background: dirty ? 'var(--color-accent)' : 'var(--color-border)',
            color: '#fff', fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 13,
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saveMsg && (
          <span style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? 'var(--color-negative)' : 'var(--color-positive)' }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Toggle sub-component ───────────────────────────────────────── */
const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
        background: checked ? 'var(--color-accent)' : 'var(--color-border)',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 18 : 2, transition: 'left 0.2s',
      }} />
    </div>
    {label}
  </label>
);

export default NotificationsPage;
