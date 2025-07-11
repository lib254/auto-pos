export interface RegisterSession {
  id: string;
  openingBalance: number;
  expectedBalance: number;
  closingBalance?: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  paymentTotals: {
    cash: number;
    card: number;
    mobile: number;
    exchange: number;
  };
  notes?: string;
  difference?: number;
  transactions: string[];
}

export interface RegisterState {
  currentSession: RegisterSession | null;
  previousSessions: RegisterSession[];
  
}