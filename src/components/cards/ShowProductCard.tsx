import React from 'react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  productTitle: string;
  productPrice: string;
  productImageUrl: string | null;
  productUrl: string;
  brandColors: BrandColors;
}

const ShowProductCard: React.FC<Props> = ({ productTitle, productPrice, productUrl, productImageUrl, brandColors }) => {
  const card: React.CSSProperties = {
    borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    maxWidth: 280, background: 'rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  };
  const image: React.CSSProperties = {
    width: '100%', aspectRatio: '4/3', background: '#374151',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const body: React.CSSProperties = { padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 };
  const titleRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 };
  const actions: React.CSSProperties = { display: 'flex', gap: 8 };
  const btn: React.CSSProperties = {
    flex: 1, textAlign: 'center', padding: '8px 10px', borderRadius: 999,
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
    textDecoration: 'none', cursor: 'default', border: 'none',
  };

  return (
    <div style={card}>
      <div style={image}>
        {productImageUrl ? (
          <img src={productImageUrl} alt={productTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No image</span>
        )}
      </div>
      <div style={body}>
        <div style={titleRow}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: brandColors.fontFamily, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {productTitle}
          </p>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{productPrice}</span>
        </div>
        <div style={actions}>
          <a href={productUrl} onClick={e => e.preventDefault()} style={{ ...btn, background: brandColors.primaryColor, color: '#fff' }}>View Product</a>
          <button style={{ ...btn, background: 'transparent', color: brandColors.primaryColor, border: `1.5px solid ${brandColors.primaryColor}` }} onClick={e => e.preventDefault()}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowProductCard;
