import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { ProductMetric } from '@/types/reports';
import { useAuth } from '../auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';

// --- Interfaces ---
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

// --- Context Type Definition ---
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
  const { isAuthenticated } = useAuth();

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
      console.log('Fetching assigned business accounts...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch('http://localhost:4000/api/users/me/business-accounts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch assigned accounts:', errorText);
        throw new Error('Failed to fetch assigned accounts.');
      }
      
      const data: AssignedBusinessAccount[] = await response.json();
      console.log('Fetched business accounts:', data);
      setAssignedBusinessAccounts(data);
      return data; // Return the data for potential chaining

    } catch (error: any) {
      console.error('Error in fetchAssignedBusinessAccounts:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Could not fetch business accounts", 
        variant: "destructive" 
      });
      return []; // Return empty array on error
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignedBusinessAccounts();
    }
  }, [isAuthenticated, fetchAssignedBusinessAccounts]);

  const syncAccounts = useCallback(async (businessAccountId?: string) => {
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      // First, ensure we have the latest assigned accounts
      const assignedAccounts = await fetchAssignedBusinessAccounts();
      
      // If no specific account is selected, sync all assigned accounts
      const accountsToSync = businessAccountId && businessAccountId !== 'all'
        ? [businessAccountId]
        : assignedAccounts?.map(acc => String(acc.id)) || [];
      
      console.log('Accounts to sync:', accountsToSync);
      
      if (accountsToSync.length === 0) {
        toast({ 
          title: "No accounts assigned", 
          description: "You don't have any accounts assigned to sync.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('http://localhost:4000/api/facebook/sync-accounts', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          businessAccountIds: accountsToSync 
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to sync accounts');
      }
      
      // If no accounts were synced, show a message
      if (!responseData.accounts || responseData.accounts.length === 0) {
        toast({
          title: "No accounts synced",
          description: "No ad accounts were found or you don't have permission to sync any accounts.",
          variant: "destructive"
        });
        return;
      }
      
      // For CRM managers, filter accounts to only show those they have access to
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.role === 'super_admin';
      
      // Get the list of business account IDs the user has access to
      const allowedBusinessAccountIds = assignedAccounts?.map(a => a.id) || [];
      
      // Filter accounts based on user role and access
      const syncedAccounts = isAdmin 
        ? responseData.accounts 
        : responseData.accounts.filter((account: AdAccount) => 
            allowedBusinessAccountIds.includes(account.businessAccountId)
          );
      
      console.log('Synced accounts:', {
        totalAccounts: responseData.accounts.length,
        filteredAccounts: syncedAccounts.length,
        allowedBusinessAccountIds,
        accounts: syncedAccounts
      });
      
      // Update the state with the filtered accounts
      setAdAccounts(syncedAccounts);
      
      // Show success message with the count of synced accounts
      toast({ 
        title: "Sync Complete!", 
        description: `Successfully synced ${syncedAccounts.length} ad accounts.`,
        variant: syncedAccounts.length === 0 ? "destructive" : "default"
      });
      
      // If no accounts were synced and the user has assigned business accounts, show a warning
      if (syncedAccounts.length === 0 && allowedBusinessAccountIds.length > 0) {
        toast({
          title: "No Ad Accounts Found",
          description: "No ad accounts were found in the connected business accounts.",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({ 
        title: "Sync Failed", 
        description: error.message || 'Failed to sync accounts',
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  }, [assignedBusinessAccounts]);

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
