export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export const FALLBACK_BRAND_COLORS: BrandColors = {
  primaryColor: '#6366F1',
  secondaryColor: '#E0E7FF',
  fontFamily: 'Inter, sans-serif',
};

export type FieldSource = 'agent-generated' | 'integration' | 'brand-settings' | 'partner-profile';
export type CardSource = 'Shopify' | 'Network' | 'Skill';

export interface CardFieldDefinition {
  name: string;
  mockValue: string;
  source: FieldSource;
}

export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  triggerHint: string;
  sourceBadge: CardSource;
  fields: CardFieldDefinition[];
  mockData: Record<string, unknown>;
}

export const FIELD_SOURCE_LABELS: Record<FieldSource, string> = {
  'agent-generated': 'Agent-generated',
  'integration': 'Integration',
  'brand-settings': 'Brand Settings',
  'partner-profile': 'Partner Profile',
};

export const FIELD_SOURCE_COLORS: Record<FieldSource, { bg: string; fg: string }> = {
  'agent-generated': { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' },
  'integration': { bg: 'rgba(16,185,129,0.12)', fg: '#059669' },
  'brand-settings': { bg: 'rgba(139,92,246,0.12)', fg: '#8b5cf6' },
  'partner-profile': { bg: 'rgba(245,158,11,0.12)', fg: '#d97706' },
};

export const CARD_SOURCE_COLORS: Record<CardSource, { bg: string; fg: string }> = {
  Shopify: { bg: 'rgba(16,185,129,0.12)', fg: '#059669' },
  Network: { bg: 'rgba(245,158,11,0.12)', fg: '#d97706' },
  Skill: { bg: 'rgba(99,102,241,0.12)', fg: '#6366f1' },
};

export const CARD_DEFINITIONS: CardDefinition[] = [
  {
    id: 'show_product',
    name: 'Shopify: Show Product',
    description: 'Shown when agent recommends a specific product',
    triggerHint: 'Fired by the show_product tool when the agent wants to highlight a product',
    sourceBadge: 'Shopify',
    fields: [
      { name: 'productId', mockValue: '8012345678901', source: 'integration' },
      { name: 'productTitle', mockValue: 'Dark Roast Blend 250g', source: 'integration' },
      { name: 'productPrice', mockValue: '$18.99', source: 'integration' },
      { name: 'productImageUrl', mockValue: '(placeholder)', source: 'integration' },
      { name: 'productUrl', mockValue: '/products/dark-roast-blend', source: 'integration' },
    ],
    mockData: {
      productTitle: 'Dark Roast Blend 250g',
      productPrice: '$18.99',
      productImageUrl: null,
      productUrl: '/products/dark-roast-blend',
    },
  },
  {
    id: 'add_to_cart',
    name: 'Shopify: Add to Cart',
    description: 'Adds a product to the visitor\'s Shopify cart',
    triggerHint: 'Fired by the add_to_cart tool after the visitor confirms they want the product',
    sourceBadge: 'Shopify',
    fields: [
      { name: 'productId', mockValue: '8012345678901', source: 'integration' },
      { name: 'productTitle', mockValue: 'Dark Roast Blend 250g', source: 'agent-generated' },
      { name: 'productPrice', mockValue: '$18.99', source: 'integration' },
      { name: 'variantId', mockValue: '44012345678901', source: 'integration' },
    ],
    mockData: {
      productTitle: 'Dark Roast Blend 250g',
      productPrice: '$18.99',
    },
  },
  {
    id: 'navigate',
    name: 'Shopify: Navigate',
    description: 'Redirects the visitor to a page on the store',
    triggerHint: 'Fired by the navigate tool when the agent suggests a page to visit',
    sourceBadge: 'Shopify',
    fields: [
      { name: 'url', mockValue: '#', source: 'agent-generated' },
      { name: 'label', mockValue: 'View our full menu', source: 'agent-generated' },
    ],
    mockData: {
      url: '#',
      label: 'View our full menu',
    },
  },
  {
    id: 'agent_referral',
    name: 'Agent Referral',
    description: 'Introduces the visitor to a partner agent from the network',
    triggerHint: 'Fired by the agent_referral tool when a network partner is relevant',
    sourceBadge: 'Network',
    fields: [
      { name: 'targetAgentName', mockValue: 'Binta', source: 'partner-profile' },
      { name: 'targetDomain', mockValue: 'binta.com', source: 'partner-profile' },
      { name: 'reason', mockValue: 'Binta specializes in West African cuisine which matches what you\'re looking for', source: 'agent-generated' },
      { name: 'targetLogoUrl', mockValue: '(optional)', source: 'partner-profile' },
    ],
    mockData: {
      targetAgentName: 'Binta',
      targetDomain: 'binta.com',
      reason: 'Binta specializes in West African cuisine which matches what you\'re looking for',
    },
  },
  {
    id: 'inquiry_form',
    name: 'Inquiry Form',
    description: 'Captures visitor contact info and a message',
    triggerHint: 'Fired by the show_inquiry_form skill when the visitor wants to reach out',
    sourceBadge: 'Skill',
    fields: [
      { name: 'Name', mockValue: 'Alex Johnson', source: 'agent-generated' },
      { name: 'Email', mockValue: 'visitor@example.com', source: 'agent-generated' },
      { name: 'Message', mockValue: 'I\'d like to learn about wholesale pricing.', source: 'agent-generated' },
    ],
    mockData: {
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: false },
      ],
    },
  },
  {
    id: 'booking_form',
    name: 'Booking / Lodgify',
    description: 'Collects reservation details for bookings or appointments',
    triggerHint: 'Fired by the show_booking_form skill when the visitor wants to reserve',
    sourceBadge: 'Skill',
    fields: [
      { name: 'Check-in', mockValue: '2026-03-15', source: 'agent-generated' },
      { name: 'Check-out', mockValue: '2026-03-18', source: 'agent-generated' },
      { name: 'Guests', mockValue: '2', source: 'agent-generated' },
    ],
    mockData: {
      fields: [
        { name: 'checkin', label: 'Check-in', type: 'date', required: true },
        { name: 'checkout', label: 'Check-out', type: 'date', required: true },
        { name: 'guests', label: 'Guests', type: 'number', required: true },
      ],
    },
  },
];
