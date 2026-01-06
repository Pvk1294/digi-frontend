import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { ProductMetric } from '@/types/reports';
import { useAuth } from '../auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';

// --- Interfaces (no changes here) ---
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
interface AdAccount {
  id: string;
  name: string;
  status: string;
  currency: string;
  timezone_name: string;
  business_name: string;
  businessAccountId: number;
  created_time: string;
  last_used_time: string;
  lastSync: string | null;
  keywords?: string[];
}
interface AssignedBusinessAccount {
  id: number;
  name: string;
}

// --- Context Type Definition (no changes here) ---
interface AdAccountContextType {
  adAccounts: AdAccount[];
  isLoading: boolean;
  syncAccounts: (businessAccountId?: string) => Promise<void>;
  assignedBusinessAccounts: AssignedBusinessAccount[];
  fetchAssignedBusinessAccounts: () => Promise<AssignedBusinessAccount[]>;
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
  updateAccountKeywords: (accountId: string, keywords: string[]) => Promise<void>;
  clearAllData: () => void;
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
  const [assignedBusinessAccounts, setAssignedBusinessAccounts] = useState<AssignedBusinessAccount[]>([]);
  const { isAuthenticated, user } = useAuth(); // <-- Get user from AuthContext

  const clearAllData = useCallback(() => {
    setAdAccounts([]);
    setDailyReports(new Map());
    setIsInitialReportFetchDone(false);
    setComprehensiveReport(null);
    setPdfUrl(null);
    setAssignedBusinessAccounts([]);
    console.log("AdAccountProvider data cleared.");
  }, []);

  const fetchAssignedBusinessAccounts = useCallback(async () => {
    try {
      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.get('/users/me/business-accounts');
      const data: AssignedBusinessAccount[] = response.data;

      setAssignedBusinessAccounts(data);
      return data;
    } catch (error: any) {
      console.error('Error in fetchAssignedBusinessAccounts:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Could not fetch business accounts",
        variant: "destructive"
      });
      return [];
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignedBusinessAccounts();
    }
  }, [isAuthenticated, fetchAssignedBusinessAccounts]);

  const syncAccounts = useCallback(async (businessAccountId?: string) => {
    setIsLoading(true);
    try {
      const assignedAccounts = await fetchAssignedBusinessAccounts();
      const accountsToSync = businessAccountId && businessAccountId !== 'all'
        ? [businessAccountId]
        : assignedAccounts?.map(acc => String(acc.id)) || [];

      if (accountsToSync.length === 0) {
        toast({
          title: "No accounts assigned",
          description: "You don't have any accounts assigned to sync.",
          variant: "destructive"
        });
        return;
      }

      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.post('/facebook/sync-accounts', {
        businessAccountIds: accountsToSync
      });
      const responseData = response.data;

      if (!responseData.accounts || responseData.accounts.length === 0) {
        toast({
          title: "No accounts synced",
          description: "No ad accounts were found or you don't have permission to sync any accounts.",
          variant: "destructive"
        });
        return;
      }

      const isAdmin = user?.role === 'super_admin';
      const allowedBusinessAccountIds = assignedAccounts?.map(a => a.id) || [];

      const syncedAccounts = isAdmin
        ? responseData.accounts
        : responseData.accounts.filter((account: AdAccount) =>
          allowedBusinessAccountIds.includes(account.businessAccountId)
        );

      setAdAccounts(syncedAccounts);

      toast({
        title: "Sync Complete!",
        description: `Successfully synced ${syncedAccounts.length} ad accounts.`,
        variant: syncedAccounts.length === 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.response?.data?.message || 'Failed to sync accounts',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchAssignedBusinessAccounts, user]);

  const fetchReportForAccount = useCallback(async (accountId: string): Promise<[string, ReportState]> => {
    try {
      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.post('/facebook/daily-report', { accountId });
      const reportData: DailyReport = response.data;
      return [accountId, { status: 'completed', data: reportData }];
    } catch (error) {
      console.error(`Error fetching report for ${accountId}:`, error);
      return [accountId, { status: 'failed' }];
    }
  }, []);

  const fetchAndSetDailyReports = useCallback(
    async (accounts: AdAccount[]) => {
      if (accounts.length === 0) return;

      // 1️⃣ Detect accounts that are NOT fetched yet
      const accountsToFetch = accounts.filter(acc => {
        const existing = dailyReports.get(acc.id);
        return !existing || existing.status === 'pending';
      });

      if (accountsToFetch.length === 0) return;

      // 2️⃣ Set loading state IMMEDIATELY
      setDailyReports(prev => {
        const updated = new Map(prev);
        accountsToFetch.forEach(acc => {
          updated.set(acc.id, { status: 'loading' });
        });
        return updated;
      });

      // 3️⃣ Fetch reports (parallel but safe)
      const results = await Promise.all(
        accountsToFetch.map(acc => fetchReportForAccount(acc.id))
      );

      // 4️⃣ Merge results
      setDailyReports(prev => {
        const updated = new Map(prev);
        results.forEach(([id, reportState]) => {
          updated.set(id, reportState);
        });
        return updated;
      });
    },
    [dailyReports, fetchReportForAccount]
  );


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
      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.post('/facebook/comprehensive-report', { accountId, range });
      const reportData: ComprehensiveReportData = response.data;
      const client = adAccounts.find(acc => acc.id === accountId);
      setComprehensiveReport({ ...reportData, clientName: client?.name || 'Unknown Client' });
      toast({ title: "Report Generated", description: "Comprehensive report is ready." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.response?.data?.message || "Failed to generate report.", variant: "destructive" });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [adAccounts]);

  const generatePdfReport = useCallback(async (payload: PdfPayload) => {
    setIsGeneratingPdf(true);
    setPdfUrl(null);
    try {
      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.post('/reports/generate-pdf', payload, {
        responseType: 'blob', // Important for handling file downloads
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      toast({ title: "PDF Ready", description: "Your PDF report is ready for download." });
    } catch (error: any) {
      toast({ title: "PDF Failed", description: error.response?.data?.message || "PDF generation failed.", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, []);

  const clearComprehensiveReport = useCallback(() => {
    setComprehensiveReport(null);
    setPdfUrl(null);
  }, []);

  const updateAccountKeywords = useCallback(async (accountId: string, keywords: string[]) => {
    try {
      // --- REFACTORED TO USE API INSTANCE ---
      const response = await api.put(`/facebook/accounts/${accountId}/keywords`, { keywords });
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to update keywords.');
      }
      setAdAccounts(prevAccounts =>
        prevAccounts.map(account =>
          account.id === accountId
            ? { ...account, productKeywords: keywords }
            : account
        )
      );
      toast({ title: "Success", description: "Keywords updated." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.response?.data?.message || error.message, variant: "destructive" });
    }
  }, []);

  const value = useMemo(() => ({
    adAccounts, isLoading, syncAccounts,
    assignedBusinessAccounts, fetchAssignedBusinessAccounts,
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
    assignedBusinessAccounts, fetchAssignedBusinessAccounts,
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
