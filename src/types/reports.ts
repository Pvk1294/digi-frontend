export interface AdAccount {
  id: string;
  name: string;
  clientName: string;
  status: 'ready' | 'pending' | 'syncing';
  lastSync: string | null;
  keywords: string[];
  prepaidBalance?: number;
  currency?: string;
}

export interface ProductMetric {
  productName: string;
  spend: number;
  fbLeads: number;
  validatedLeads: number;
  cplFb: number;
  cplValidated: number;
  cpm: number;
  ctr: number;
  comments: string;
}

export interface Report {
  id: string;
  clientName: string;
  adAccountId: string;
  // Use the correct uppercase string literals for status
  status: 'GENERATING' | 'COMPLETED' | 'SENT' | 'FAILED'; 
  reportType: string;
  dateRange: { from: string; to: string };
  generatedAt: string;
  pdfUrl?: string;
  productMetrics?: any;
  currency?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  leads: number;
  productCategory?: string;
}