export const PAYMENT_MODE_MAP: Record<string, string> = {
  UPI: 'UPI / Online',
  DEBIT_CARD: 'Debit Card',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
  NET_BANKING: 'Bank Transfer',
  WALLET: 'Wallet',
  EMANDATE: 'E-Mandate',
  OTHERS: 'Others',
};


export const PAYMENT_MODES = [
  { value: 'UPI', label: PAYMENT_MODE_MAP.UPI },
  { value: 'DEBIT_CARD', label: PAYMENT_MODE_MAP.DEBIT_CARD },
  { value: 'CREDIT_CARD', label: PAYMENT_MODE_MAP.CREDIT_CARD },
  { value: 'CASH', label: PAYMENT_MODE_MAP.CASH },
  { value: 'NET_BANKING', label: PAYMENT_MODE_MAP.NET_BANKING },
  { value: 'WALLET', label: PAYMENT_MODE_MAP.WALLET },
  { value: 'EMANDATE', label: PAYMENT_MODE_MAP.EMANDATE },
  { value: 'OTHERS', label: PAYMENT_MODE_MAP.OTHERS }
];

export const SAVING_DIRECTION_MAP: Record<string, string> = {
  true: 'IN (Deposit)',
  false: 'OUT (Withdrawal)',
};

export const SAVING_DIRECTIONS = [
  { value: 'true', label: SAVING_DIRECTION_MAP.true },
  { value: 'false', label: SAVING_DIRECTION_MAP.false }
];

export const REVOLVING_DIRECTION_MAP: Record<string, string> = {
  true: 'Given (Lent)',
  false: 'Received (Borrowed)',
};

export const REVOLVING_DIRECTIONS = [
  { value: 'true', label: REVOLVING_DIRECTION_MAP.true },
  { value: 'false', label: REVOLVING_DIRECTION_MAP.false }
];

export const REVOLVING_STATUS_MAP: Record<string, string> = {
  true: 'Settled',
  false: 'Open',
};


export const REVOLVING_STATUSES = [
  { value: 'true', label: REVOLVING_STATUS_MAP.true },
  { value: 'false', label: REVOLVING_STATUS_MAP.false }
];
