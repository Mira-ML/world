import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { BrandColors } from '../../pages/Cards/cardsData';

interface FormField { name: string; label: string; type: string; required: boolean; }
interface Props { fields: FormField[]; brandColors: BrandColors; }

const input: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, color: '#111827', background: '#fafafa', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const BookingCard: React.FC<Props> = ({ fields, brandColors }) => (
  <div style={{
    maxWidth: 320, width: '100%', borderRadius: 12, background: '#fff',
    border: '1px solid rgba(0,0,0,0.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <CalendarDays size={18} color={brandColors.primaryColor} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: brandColors.fontFamily }}>Book a reservation</p>
    </div>
    {fields.map(f => (
      <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>
          {f.label}{f.required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </label>
        <input readOnly type="text" placeholder={f.label} style={{ ...input, fontFamily: brandColors.fontFamily }} />
      </div>
    ))}
    <button style={{
      width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
      fontSize: 14, fontWeight: 600, color: '#fff', background: brandColors.primaryColor,
      fontFamily: brandColors.fontFamily, cursor: 'default',
    }}>
      Reserve
    </button>
  </div>
);

export default BookingCard;
