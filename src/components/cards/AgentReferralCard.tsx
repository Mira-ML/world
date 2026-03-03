import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  targetAgentName: string;
  targetDomain: string;
  reason: string;
  brandColors: BrandColors;
}

const AgentReferralCard: React.FC<Props> = ({ targetAgentName, targetDomain, reason, brandColors }) => {
  const initial = targetAgentName[0]?.toUpperCase() ?? '?';

  const card: React.CSSProperties = {
    maxWidth: 280, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(8px)',
  };
  const avatar: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0,
  };
  const btn: React.CSSProperties = {
    flex: 1, padding: '8px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
    cursor: 'default', border: 'none',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={avatar}>{initial}</div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: brandColors.fontFamily }}>
            {targetAgentName} <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>&middot;</span>
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>{targetDomain}</span>
          </span>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#f59e0b', marginTop: 2 }}>
            Recommended for you
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.9)', fontFamily: brandColors.fontFamily }}>{reason}</p>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button style={{ ...btn, background: '#fff', color: '#111827' }} onClick={e => e.preventDefault()}>Meet {targetAgentName}</button>
        <button style={{ ...btn, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }} onClick={e => e.preventDefault()}>No thanks</button>
      </div>
    </div>
  );
};

export default AgentReferralCard;
