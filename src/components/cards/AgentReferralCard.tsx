import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  targetAgentName: string;
  targetDomain: string;
  reason: string;
  brandColors: BrandColors;
}

const AgentReferralCard: React.FC<Props> = ({ targetAgentName, targetDomain, reason, brandColors }) => {
  const card: React.CSSProperties = {
    maxWidth: 280, borderRadius: '1rem', padding: '1.25rem 1rem 1rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.5rem', textAlign: 'center',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
  };
  const btn: React.CSSProperties = {
    flex: 1, padding: '0.5rem 1rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
    cursor: 'default', border: 'none', minHeight: 32, boxSizing: 'border-box',
    fontFamily: 'inherit', lineHeight: 1.2,
  };

  return (
    <div style={card}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#6B7F72' }}>
        RECOMMENDED FOR YOU
      </span>

      {/* Moai statue — matches live widget SVG exactly */}
      <svg style={{ width: '3.5rem', height: 'auto', margin: '0.25rem 0' }} viewBox="410 58 220 195" xmlns="http://www.w3.org/2000/svg">
        <path d="M428 148 Q428 72 520 68 Q612 72 612 148 Q612 195 588 208 Q520 218 452 208 Q428 195 428 148Z" fill="#d4c4a0" stroke="#1a1a1a" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M440 118 Q440 75 520 72 Q600 75 600 118" fill="#ddd3b5" stroke="none"/>
        <ellipse cx="520" cy="71" rx="52" ry="14" fill="#6B7F72" stroke="#4a5e54" strokeWidth="2"/>
        <ellipse cx="520" cy="63" rx="40" ry="10" fill="#6B7F72" stroke="#4a5e54" strokeWidth="1.8"/>
        <path d="M478 112 Q490 106 502 110" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M538 110 Q550 106 562 112" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M480 124 Q493 115 506 124" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M534 124 Q547 115 560 124" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M510 134 L507 152 Q520 157 533 152 L530 134" fill="#c4b48e" stroke="#1a1a1a" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M504 154 Q511 158 520 157 Q529 158 536 154" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M492 178 Q520 192 548 178" fill="none" stroke="#4a7a5a" strokeWidth="3" strokeLinecap="round"/>
        <path d="M428 138 Q414 144 416 160 Q418 174 430 176" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M612 138 Q626 144 624 160 Q622 174 610 176" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, fontFamily: brandColors.fontFamily }}>
          {targetAgentName}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>
          {targetDomain}
        </span>
      </div>

      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', fontFamily: brandColors.fontFamily }}>
        {reason}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', paddingTop: '0.75rem' }}>
        <button style={{ ...btn, background: '#6B7F72', color: '#ffffff' }} onClick={e => e.preventDefault()}>
          Meet {targetAgentName}
        </button>
        <button style={{ ...btn, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }} onClick={e => e.preventDefault()}>
          No thanks
        </button>
      </div>
    </div>
  );
};

export default AgentReferralCard;
