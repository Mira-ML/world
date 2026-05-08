import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  url: string;
  title: string;
  description: string;
  brandColors: BrandColors;
}

const ExternalNavigationCard: React.FC<Props> = ({ url, title, description, brandColors }) => {
  let domainPreview = '';
  try {
    domainPreview = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domainPreview = url;
  }

  const truncDesc = description.length > 140 ? description.slice(0, 137) + '...' : description;

  const card: React.CSSProperties = {
    maxWidth: 280, borderRadius: '1rem', padding: '1rem 1rem 0.85rem', display: 'flex',
    flexDirection: 'column', gap: '0.35rem',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em' }}>
          {domainPreview}
        </span>
      </div>

      {title && (
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginTop: '0.15rem', fontFamily: brandColors.fontFamily }}>
          {title}
        </span>
      )}

      {truncDesc && (
        <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45, color: 'rgba(255,255,255,0.65)', fontFamily: brandColors.fontFamily }}>
          {truncDesc}
        </p>
      )}

      <button
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', marginTop: '0.5rem', padding: '0.5rem 1rem',
          borderRadius: 999, background: '#6B7F72', color: '#ffffff',
          fontSize: '0.75rem', fontWeight: 700, border: 'none',
          cursor: 'default', minHeight: 32, boxSizing: 'border-box',
          fontFamily: 'inherit', lineHeight: 1.2,
        }}
        onClick={e => e.preventDefault()}
      >
        Continue to {domainPreview} &nbsp;↗
      </button>
    </div>
  );
};

export default ExternalNavigationCard;
