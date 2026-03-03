import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface Props {
  url: string;
  label: string;
  brandColors: BrandColors;
}

const NavigateCard: React.FC<Props> = ({ url, label, brandColors }) => (
  <a
    href={url}
    onClick={e => e.preventDefault()}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      borderRadius: 999, padding: '10px 20px',
      fontSize: 14, fontWeight: 600, color: '#fff',
      background: brandColors.primaryColor, fontFamily: brandColors.fontFamily,
      textDecoration: 'none', cursor: 'default', maxWidth: 280,
    }}
  >
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    <ArrowRight size={16} style={{ flexShrink: 0 }} />
  </a>
);

export default NavigateCard;
