import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Copy, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdAccount } from '@/types/reports';
import { format, subDays, startOfDay } from 'date-fns';
import { useAdAccounts } from '@/components/providers/AdAccountProvider';

// Interface to define the shape of the daily report data
interface DailyReport {
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  balance?: number;
  timezone?: string;
  currency?: string;  
}

// --- ADDED: Currency Formatting Helper ---
// This function uses the browser's built-in internationalization API
// to format numbers into any currency correctly.
const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        // This fallback will be used if an invalid currency code (e.g., 'null') is passed.
        console.error(`Invalid currency code provided: ${currencyCode}`, error);
        return `$${amount.toFixed(2)}`;
    }
};

export const DailyReports = () => {
  const { 
    adAccounts, 
    dailyReports, 
    isInitialReportFetchDone, 
    fetchAndSetDailyReports,
    refreshSingleDailyReport 
  } = useAdAccounts();

  // General title for the reports section
  const reportDateTitle = `Reports for ${format(subDays(new Date(), 1), 'MMM dd, yyyy')}`;

  // Trigger the initial data fetch for all accounts
  useEffect(() => {
    if (!isInitialReportFetchDone && adAccounts.length > 0) {
      fetchAndSetDailyReports(adAccounts);
    }
  }, [adAccounts, isInitialReportFetchDone, fetchAndSetDailyReports]);
  
  // Format the report summary for the clipboard, now including the timezone AND formatted currency
  const generateAndCopyMessage = (account: AdAccount, report: DailyReport) => {
    const reportDate = format(subDays(new Date(), 1), 'MMM dd, yyyy');
    const timezoneInfo = report.timezone ? ` (${report.timezone.replace(/_/g, " ")})` : '';

    let message = `Hi ${account.clientName || account.name},\nHere is your daily summary for ${reportDate}${timezoneInfo}:\n\n`;
    // CHANGED: Use the formatter for all currency values
    message += `💰 Total Spend: ${formatCurrency(report.totalSpend, report.currency)}\n`;
    message += `✅ Total Leads: ${report.totalLeads}\n`;
    message += `🎯 Avg. CPL: ${formatCurrency(report.avgCpl, report.currency)}\n`;

    if (report.balance !== undefined) {
      message += `\nBalance Left: ${formatCurrency(report.balance, report.currency)}`;
    }
    
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied to Clipboard!",
      description: "Report summary message has been copied.",
    });
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'loading': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper function to get status border color
  const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'border-l-green-400';
        case 'loading': return 'border-l-blue-400';
        case 'failed': return 'border-l-red-400';
        default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Reports Summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">{reportDateTitle}</p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {adAccounts.map((account) => {
          const reportState = dailyReports.get(account.id) || { status: 'pending' };

          return (
            <Card key={account.id} className={`border-l-4 ${getStatusColor(reportState.status)}`}>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{account.clientName || account.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono truncate">{account.id}</p>
                    
                    {/* Display the timezone on the card itself */}
                    {reportState.status === 'completed' && reportState.data?.timezone && (
                      <p className="text-xs text-muted-foreground pt-1">
                        TZ: {reportState.data.timezone.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1.5 capitalize py-1 px-2">
                    {getStatusIcon(reportState.status)}
                    {reportState.status}
                  </Badge>
                </div>

                <div className="flex-grow my-4 space-y-2">
                  {reportState.status === 'completed' && reportState.data && (
                    <div className="space-y-1.5 text-sm">
                      {/* CHANGED: Use the formatter for all displayed currency values */}
                      <div className="flex justify-between">
                        <span>Spend:</span> 
                        <span className="font-medium">{formatCurrency(reportState.data.totalSpend, reportState.data.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leads:</span> 
                        <span className="font-medium">{reportState.data.totalLeads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg CPL:</span> 
                        <span className="font-medium">{formatCurrency(reportState.data.avgCpl, reportState.data.currency)}</span>
                      </div>
                      {reportState.data.balance !== undefined && (
                        <div className="pt-2 border-t mt-2 flex justify-between">
                          <span>Balance:</span> 
                          <span className="font-medium text-green-600">{formatCurrency(reportState.data.balance, reportState.data.currency)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {reportState.status === 'loading' && ( <div className="flex items-center justify-center h-full text-muted-foreground"><RefreshCw className="h-8 w-8 animate-spin" /></div> )}
                  {reportState.status === 'failed' && ( <div className="flex items-center flex-col justify-center h-full text-red-500"><AlertCircle className="h-8 w-8 mb-2" /><span className="text-sm">Failed to load</span></div> )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateAndCopyMessage(account, reportState.data!)}
                      disabled={reportState.status !== 'completed'}
                      className="flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Message
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => refreshSingleDailyReport(account.id)}
                      disabled={reportState.status === 'loading'}
                      className="flex-1"
                      variant="outline"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${reportState.status === 'loading' ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};