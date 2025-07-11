// types/settings.ts

export interface BusinessInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
  }
  
  export interface SystemSettings {
    currency: 'USD' | 'EUR' | 'GBP' | 'KES';
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    lowStockAlert: number;
    emailAlerts: boolean;
  }
  
  export interface ReceiptSettings {
    header: string;
    footer: string;
    showLogo: boolean;
  }
  
  export interface Settings {
    businessInfo: BusinessInfo;
    systemSettings: SystemSettings;
    receiptSettings: ReceiptSettings;
  }
  