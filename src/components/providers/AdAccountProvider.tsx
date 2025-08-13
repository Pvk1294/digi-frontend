import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { AdAccount, ProductMetric } from '@/types/reports';

// --- Interfaces for Report Data ---
interface DailyReport {
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  balance?: number;
  productMetrics: ProductMetric[];
  timezone?: string;
  currency?: string;
}

interface ReportState {
  status: 'pending' | 'loading' | 'completed' | 'failed';
  data?: DailyReport;
}

interface ComprehensiveReportData {
  performance: any[];
  products: any[];
  summary: any;
  clientName: string;
}

// --- Define the type for the PDF payload ---
interface PdfPayload {
    reportData: ComprehensiveReportData;
    clientName: string;
    adAccountId: string;
    reportType: string;
    dateRange: {
        from: string;
        to: string;
    };
}

interface AdAccountContextType {
  adAccounts: AdAccount[];
  isLoading: boolean;
  syncAccounts: () => Promise<void>;
  
  dailyReports: Map<string, ReportState>;
  isInitialReportFetchDone: boolean;
  fetchAndSetDailyReports: (accounts: AdAccount[]) => Promise<void>;
  refreshSingleDailyReport: (accountId: string) => Promise<void>;

  comprehensiveReport: ComprehensiveReportData | null;
  isGeneratingReport: boolean;
  generateComprehensiveReport: (accountId: string, range: string) => Promise<void>;

  isGeneratingPdf: boolean;
  pdfUrl: string | null;
  generatePdfReport: (payload: PdfPayload) => Promise<void>; 
  clearComprehensiveReport: () => void;

  // --- NEW FUNCTION FOR KEYWORDS ---
  updateAccountKeywords: (accountId: string, keywords: string[]) => Promise<void>;
}

const AdAccountContext = createContext<AdAccountContextType | undefined>(undefined);

export const AdAccountProvider = ({ children }: { children: ReactNode }) => {
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyReports, setDailyReports] = useState<Map<string, ReportState>>(new Map());
  const [isInitialReportFetchDone, setIsInitialReportFetchDone] = useState(false);
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const clearAllData = useCallback(() => {
    setAdAccounts([]);
    setDailyReports(new Map());
    setIsInitialReportFetchDone(false);
    setComprehensiveReport(null);
    setPdfUrl(null);
    // Add any other state resets here if needed
    console.log("AdAccountProvider data cleared.");
  }, []);

  const syncAccounts = useCallback(async () => {
    setIsLoading(true);
    toast({ title: "Syncing Ad Accounts", description: "Fetching accounts from Facebook..." });
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Authentication token not found.");
      const response = await fetch('http://localhost:4000/api/facebook/sync-accounts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync from server');
      }
      const { accounts } = await response.json();
      setAdAccounts(accounts);
      toast({ title: "Sync Complete!", description: `Successfully synced ${accounts.length} ad accounts.` });
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({ title: "Sync Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReportForAccount = useCallback(async (accountId: string): Promise<[string, ReportState]> => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:4000/api/facebook/daily-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ accountId }),
        });
        if (!response.ok) { throw new Error('Failed to fetch report from server.'); }
        const reportData: DailyReport = await response.json();
        return [accountId, { status: 'completed', data: reportData }];
    } catch (error) {
        console.error(`Error fetching report for ${accountId}:`, error);
        return [accountId, { status: 'failed' }];
    }
  }, []);
  
  const fetchAndSetDailyReports = useCallback(async (accounts: AdAccount[]) => {
    if (isInitialReportFetchDone || accounts.length === 0) return;
    const loadingReports = new Map<string, ReportState>();
    accounts.forEach(acc => loadingReports.set(acc.id, { status: 'loading' }));
    setDailyReports(loadingReports);
    const results = await Promise.all(accounts.map(acc => fetchReportForAccount(acc.id)));
    const finalReports = new Map<string, ReportState>();
    results.forEach(([id, reportState]) => {
        finalReports.set(id, reportState);
    });
    setDailyReports(finalReports);
    setIsInitialReportFetchDone(true);
  }, [isInitialReportFetchDone, fetchReportForAccount]);

  const refreshSingleDailyReport = useCallback(async (accountId: string) => {
    setDailyReports(prev => new Map(prev).set(accountId, { status: 'loading' }));
    const [id, reportState] = await fetchReportForAccount(accountId);
    setDailyReports(prev => new Map(prev).set(id, reportState));
  }, [fetchReportForAccount]);

  const generateComprehensiveReport = useCallback(async (accountId: string, range: string) => {
    setPdfUrl(null);
    setIsGeneratingReport(true);
    setComprehensiveReport(null);
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:4000/api/facebook/comprehensive-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ accountId, range }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to generate report.");
        }
        const reportData: ComprehensiveReportData = await response.json();
        const client = adAccounts.find(acc => acc.id === accountId);
        setComprehensiveReport({ ...reportData, clientName: client?.name || 'Unknown Client' });
        toast({ title: "Report Generated", description: "Comprehensive report is ready." });
    } catch (error: any) {
        toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsGeneratingReport(false);
    }
  }, [adAccounts]);

  const generatePdfReport = useCallback(async (payload: PdfPayload) => {
    setIsGeneratingPdf(true);
    setPdfUrl(null);

    const { reportData, clientName, adAccountId, reportType, dateRange } = payload;

    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:4000/api/reports/generate-pdf', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                reportData,
                clientName,
                adAccountId,
                reportType,
                dateRange,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "PDF generation failed on the server.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        toast({ title: "PDF Ready", description: "Your PDF report is ready for download." });

    } catch (error: any) {
        toast({ title: "PDF Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsGeneratingPdf(false);
    }
  }, []);

  const clearComprehensiveReport = useCallback(() => {
      setComprehensiveReport(null);
      setPdfUrl(null);
  }, []);

  // --- NEW FUNCTION IMPLEMENTATION ---
  const updateAccountKeywords = useCallback(async (accountId: string, keywords: string[]) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        toast({ title: "Error", description: "Authentication token not found.", variant: "destructive" });
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:4000/api/facebook/accounts/${accountId}/keywords`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ keywords }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to update keywords.');
        }

        // Update the state locally to reflect the change immediately
        setAdAccounts(prevAccounts => 
            prevAccounts.map(account => 
                account.id === accountId 
                    ? { ...account, productKeywords: keywords } 
                    : account
            )
        );
        toast({ title: "Success", description: "Keywords updated." });

    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  }, []);


  const value = useMemo(() => ({
    adAccounts, isLoading, syncAccounts,
    dailyReports, isInitialReportFetchDone, fetchAndSetDailyReports, refreshSingleDailyReport,
    comprehensiveReport, isGeneratingReport, generateComprehensiveReport,
    isGeneratingPdf,
    pdfUrl,
    generatePdfReport,
    clearComprehensiveReport,
    updateAccountKeywords,
    clearAllData,
  }), [
    adAccounts, isLoading, syncAccounts,
    dailyReports, isInitialReportFetchDone, fetchAndSetDailyReports, refreshSingleDailyReport,
    comprehensiveReport, isGeneratingReport, generateComprehensiveReport,
    isGeneratingPdf,
    pdfUrl,
    generatePdfReport, 
    clearComprehensiveReport,
    updateAccountKeywords,
    clearAllData,
  ]);

  return (
    <AdAccountContext.Provider value={value}>
      {children}
    </AdAccountContext.Provider>
  );
};

export const useAdAccounts = () => {
  const context = useContext(AdAccountContext);
  if (context === undefined) {
    throw new Error('useAdAccounts must be used within an AdAccountProvider');
  }
  return context;
};
