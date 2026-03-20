import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  staffName: string;
  message: string;
  brandColors: BrandColors;
}

const StaffIntroductionCard: React.FC<Props> = ({ staffName, message, brandColors }) => {
  const accentColor = brandColors.primaryColor;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const card: React.CSSProperties = {
    maxWidth: 280, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    borderLeft: `3px solid ${accentColor}`, borderRadius: '0.75rem',
    padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.8, color: accentColor }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <p style={{
        margin: 0, fontSize: '0.8rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.9)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: brandColors.fontFamily,
      }}>
        {message}
      </p>
      <span style={{
        fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.5)',
      }}>
        {timeStr}
      </span>
    </div>
  );
};

export default StaffIntroductionCard;
