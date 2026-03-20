import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  staffName: string;
  message: string;
  brandColors: BrandColors;
}

const StaffLeftCard: React.FC<Props> = ({ staffName, message, brandColors }) => {
  const accentColor = brandColors.primaryColor;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const card: React.CSSProperties = {
    maxWidth: 280, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    borderLeft: `3px solid rgba(255,255,255,0.2)`, borderRadius: '0.75rem',
    padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6, color: 'rgba(255,255,255,0.5)' }}>
        {/* Single person with arrow/exit indicator */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>
      <p style={{
        margin: 0, fontSize: '0.8rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.7)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: brandColors.fontFamily,
      }}>
        {message}
      </p>
      <span style={{
        fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.4)',
      }}>
        {timeStr}
      </span>
    </div>
  );
};

export default StaffLeftCard;
