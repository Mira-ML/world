import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import type { CardDefinition, BrandColors } from '../../pages/Cards/cardsData';
import ShowProductCard from './ShowProductCard';
import AddToCartCard from './AddToCartCard';
import NavigateCard from './NavigateCard';
import AgentReferralCard from './AgentReferralCard';
import InquiryFormCard from './InquiryFormCard';
import BookingCard from './BookingCard';
import StaffIntroductionCard from './StaffIntroductionCard';
import StaffLeftCard from './StaffLeftCard';
import EmailHandoffCard from './EmailHandoffCard';
import WhatsAppHandoffCard from './WhatsAppHandoffCard';

interface Props {
  card: CardDefinition | null;
  brandColors: BrandColors;
}

function renderCard(card: CardDefinition, brandColors: BrandColors) {
  const d = card.mockData;
  switch (card.id) {
    case 'show_product':
      return <ShowProductCard productTitle={d.productTitle as string} productPrice={d.productPrice as string} productImageUrl={d.productImageUrl as string | null} productUrl={d.productUrl as string} brandColors={brandColors} />;
    case 'add_to_cart':
      return <AddToCartCard productTitle={d.productTitle as string} productPrice={d.productPrice as string} brandColors={brandColors} />;
    case 'navigate':
      return <NavigateCard url={d.url as string} label={d.label as string} brandColors={brandColors} />;
    case 'agent_referral':
      return <AgentReferralCard targetAgentName={d.targetAgentName as string} targetDomain={d.targetDomain as string} reason={d.reason as string} brandColors={brandColors} />;
    case 'inquiry_form':
      return <InquiryFormCard fields={d.fields as any[]} brandColors={brandColors} />;
    case 'booking_form':
      return <BookingCard fields={d.fields as any[]} brandColors={brandColors} />;
    case 'staff_introduction':
      return <StaffIntroductionCard staffName={d.staffName as string} message={d.message as string} brandColors={brandColors} />;
    case 'staff_left':
      return <StaffLeftCard staffName={d.staffName as string} message={d.message as string} brandColors={brandColors} />;
    case 'email_handoff':
      return <EmailHandoffCard recipientEmail={d.recipientEmail as string} message={d.message as string} brandColors={brandColors} />;
    case 'whatsapp_handoff':
      return <WhatsAppHandoffCard whatsappNumber={d.whatsappNumber as string} message={d.message as string} brandColors={brandColors} />;
    default:
      return null;
  }
}

const wrapper: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
};
const empty: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '64px 24px', textAlign: 'center',
};
const header: React.CSSProperties = {
  padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
};
const stage: React.CSSProperties = {
  background: '#1a1a2e', padding: '32px 24px', display: 'flex', justifyContent: 'center', minHeight: 200,
};
const footer: React.CSSProperties = {
  padding: '12px 20px', fontSize: 11, color: 'var(--color-text-subtle)',
  borderTop: '1px solid var(--color-border)',
};

const CardPreviewPanel: React.FC<Props> = ({ card, brandColors }) => {
  if (!card) {
    return (
      <div style={wrapper}>
        <div style={empty}>
          <LayoutTemplate size={40} color="var(--color-text-subtle)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>Select a card to preview it.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{card.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{card.triggerHint}</div>
      </div>
      <div style={stage}>
        {renderCard(card, brandColors)}
      </div>
      <div style={footer}>Preview uses mock data. Brand colors are pulled from your widget settings.</div>
    </div>
  );
};

export default CardPreviewPanel;
