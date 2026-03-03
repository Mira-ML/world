import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  productTitle: string;
  productPrice: string;
  brandColors: BrandColors;
}

const AddToCartCard: React.FC<Props> = ({ productTitle, productPrice, brandColors }) => {
  const card: React.CSSProperties = {
    borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    maxWidth: 280, padding: 16, gap: 12,
    background: 'rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  };
  const badge: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
  const circle: React.CSSProperties = {
    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: brandColors.primaryColor,
  };
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
  const thumb: React.CSSProperties = {
    width: 48, height: 48, borderRadius: 8, background: '#374151',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
  const btn: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 999, border: 'none',
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#fff', background: brandColors.primaryColor, cursor: 'default',
  };

  return (
    <div style={card}>
      <div style={badge}>
        <div style={circle}><Check size={14} color="#fff" /></div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>Added to Cart</span>
      </div>
      <div style={row}>
        <div style={thumb}><ShoppingCart size={18} color="#9CA3AF" /></div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: brandColors.fontFamily, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productTitle}</p>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{productPrice}</span>
        </div>
      </div>
      <button style={btn} onClick={e => e.preventDefault()}>View Cart</button>
    </div>
  );
};

export default AddToCartCard;
