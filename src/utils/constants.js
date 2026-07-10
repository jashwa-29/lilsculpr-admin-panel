export const MAX_CAPACITY = 8;
export const FEES_MONTHLY = { offline: 2500, online: 2200 };
export const KIT_FEE = 2000;
export const LS_KEY = 'lilsculpr_v1';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ═══ NEW: Payment method options ═══
export const PAYMENT_METHODS = [
  { value: 'Cash', label: '💰 Cash' },
  { value: 'UPI', label: '📱 UPI' },
  { value: 'Bank Transfer', label: '🏦 Bank Transfer' },
  { value: 'Other', label: '📝 Other' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'completed', label: '✅ Paid', color: 'green' },
  { value: 'pending', label: '⏳ Pending', color: 'yellow' },
];