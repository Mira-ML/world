import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CardPreviewPanel from '../../components/cards/CardPreviewPanel';
import {
  CARD_DEFINITIONS,
  FALLBACK_BRAND_COLORS,
  FIELD_SOURCE_LABELS,
  FIELD_SOURCE_COLORS,
  CARD_SOURCE_COLORS,
  type BrandColors,
  type CardDefinition,
} from './cardsData';

/* ── Helpers ─────────────────────────────────────────────────────── */

const FONT_OPTIONS = [
  'Inter, sans-serif',
  'Arial, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
];

function lightenHex(hex: string): string {
  const c = hex.replace('#', '');
  const mix = (v: number) => Math.round(v + (255 - v) * 0.8).toString(16).padStart(2, '0');
  return `#${mix(parseInt(c.substring(0, 2), 16))}${mix(parseInt(c.substring(2, 4), 16))}${mix(parseInt(c.substring(4, 6), 16))}`;
}

/* ── Shared style objects ────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', overflow: 'hidden', cursor: 'pointer',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const cardExpanded: React.CSSProperties = {
  ...card, borderColor: 'var(--color-accent)', boxShadow: '0 0 0 1px var(--color-accent)',
};
const rowMain: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
};
const badge: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
};
const fieldBadge: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, whiteSpace: 'nowrap',
};
const swatchCircle: React.CSSProperties = {
  width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--color-border)',
  position: 'relative', overflow: 'hidden', cursor: 'pointer',
};
const swatchInput: React.CSSProperties = {
  position: 'absolute', inset: -4, width: 32, height: 32, opacity: 0, cursor: 'pointer', border: 'none', padding: 0,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', padding: '8px 8px 6px',
  borderBottom: '1px solid var(--color-border)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', fontSize: 13,
};

/* ── Component ───────────────────────────────────────────────────── */

const CardsPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<BrandColors>({ ...FALLBACK_BRAND_COLORS });

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));
  const selected: CardDefinition | null = CARD_DEFINITIONS.find(c => c.id === expandedId) ?? null;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Cards</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Preview every card type the agent can show visitors in the chat widget.
        </p>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left: table panel */}
        <div style={{ flex: '1 1 55%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Swatches */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
            background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <div style={{ ...swatchCircle, background: brandColors.primaryColor }}>
                <input type="color" style={swatchInput} value={brandColors.primaryColor}
                  onChange={e => setBrandColors(p => ({ ...p, primaryColor: e.target.value, secondaryColor: lightenHex(e.target.value) }))} />
              </div>
              Primary
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <div style={{ ...swatchCircle, background: brandColors.secondaryColor }}>
                <input type="color" style={swatchInput} value={brandColors.secondaryColor}
                  onChange={e => setBrandColors(p => ({ ...p, secondaryColor: e.target.value }))} />
              </div>
              Secondary
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <select
                value={brandColors.fontFamily}
                onChange={e => setBrandColors(p => ({ ...p, fontFamily: e.target.value }))}
                style={{
                  fontSize: 12, padding: '4px 8px', border: '1px solid var(--color-border)',
                  borderRadius: 6, background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', outline: 'none',
                }}
              >
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
              </select>
              Font
            </div>
          </div>

          {/* Card rows */}
          {CARD_DEFINITIONS.map(c => {
            const isExpanded = expandedId === c.id;
            const sc = CARD_SOURCE_COLORS[c.sourceBadge];
            const isComingSoon = c.comingSoon === true;
            return (
              <div key={c.id} style={{ ...(isExpanded ? cardExpanded : card), ...(isComingSoon ? { opacity: 0.5, cursor: 'default' } : {}) }} onClick={() => !isComingSoon && toggle(c.id)}>
                <div style={rowMain}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</span>
                  <span style={{ ...badge, background: sc.bg, color: sc.fg }}>{c.sourceBadge}</span>
                  {isComingSoon && (
                    <span style={{ ...badge, background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-subtle)', fontSize: 9 }}>Coming Soon</span>
                  )}
                  {!isComingSoon && (isExpanded
                    ? <ChevronUp size={16} color="var(--color-text-subtle)" />
                    : <ChevronDown size={16} color="var(--color-text-subtle)" />)}
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Field</th>
                          <th style={thStyle}>Mock Value</th>
                          <th style={thStyle}>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.fields.map((f, i) => {
                          const fc = FIELD_SOURCE_COLORS[f.source];
                          return (
                            <tr key={f.name}>
                              <td style={{ ...tdStyle, ...(i === c.fields.length - 1 ? { borderBottom: 'none' } : {}) }}>{f.name}</td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', ...(i === c.fields.length - 1 ? { borderBottom: 'none' } : {}) }}>{f.mockValue}</td>
                              <td style={{ ...tdStyle, ...(i === c.fields.length - 1 ? { borderBottom: 'none' } : {}) }}>
                                <span style={{ ...fieldBadge, background: fc.bg, color: fc.fg }}>{FIELD_SOURCE_LABELS[f.source]}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: preview panel */}
        <div style={{ flex: '0 0 380px', position: 'sticky', top: 24 }}>
          <CardPreviewPanel card={selected} brandColors={brandColors} />
        </div>
      </div>
    </div>
  );
};

export default CardsPage;
