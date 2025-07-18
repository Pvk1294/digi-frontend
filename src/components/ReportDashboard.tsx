
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientsTable } from './ClientsTable';
import { ReportStatusDashboard } from './ReportStatusDashboard';
import { ClientSelector } from './ClientSelector';
import { DateRangePicker } from './DateRangePicker';
import { MetricsCard } from './MetricsCard';
import { PerformanceChart } from './PerformanceChart';
import { InsightsPanel } from './InsightsPanel';
import { FileDown, RefreshCw, Users, Calendar, BarChart3, Table } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  email: string;
  role: string;
}

interface ReportDashboardProps {
  user: User;
  onLogout: () => void;
}

export const ReportDashboard = ({ user, onLogout }: ReportDashboardProps) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Mock data
  const clients = [
    { id: '1', name: 'TechCorp Solutions', adAccountId: 'act_123456' },
    { id: '2', name: 'Digital Marketing Pro', adAccountId: 'act_789012' },
    { id: '3', name: 'E-commerce Plus', adAccountId: 'act_345678' },
  ];

  const mockMetrics = {
    totalSpend: 15420.50,
    fbLeads: 324,
    validatedLeads: 276,
    cpl: 55.87,
    cpm: 12.45,
    cpr: 125.30,
  };

  const mockChartData = [
    { date: '2024-05-01', spend: 1200, leads: 25, cpl: 48, cpm: 11.5 },
    { date: '2024-05-02', spend: 1350, leads: 28, cpl: 48.2, cpm: 12.1 },
    { date: '2024-05-03', spend: 980, leads: 22, cpl: 44.5, cpm: 10.8 },
    { date: '2024-05-04', spend: 1450, leads: 32, cpl: 45.3, cpm: 13.2 },
    { date: '2024-05-05', spend: 1280, leads: 26, cpl: 49.2, cpm: 11.9 },
  ];

  const mockInsights = [
    {
      type: 'warning' as const,
      title: 'Lead Quality Discrepancy',
      description: 'Facebook reports 324 leads, but only 276 have been validated (15% discrepancy).',
      recommendation: 'Review lead qualification criteria and consider adjusting targeting parameters.',
    },
    {
      type: 'positive' as const,
      title: 'CPM Trending Down',
      description: 'Cost per thousand impressions decreased by 8% compared to last period.',
      recommendation: 'Consider scaling budget to take advantage of lower competition.',
    },
    {
      type: 'negative' as const,
      title: 'Rising CPL',
      description: 'Cost per lead increased by 12% in the last week.',
      recommendation: 'Test new creative variations and review audience fatigue metrics.',
    },
  ];

  const generateReport = async () => {
    if (!selectedClient) {
      toast({
        title: "Client Required",
        description: "Please select a client before generating the report.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Generating report for:', { selectedClient, dateRange });
    
    setTimeout(() => {
      setReportData(mockMetrics);
      setIsLoading(false);
      toast({
        title: "Report Generated",
        description: "Successfully fetched performance data for the selected period.",
      });
    }, 2000);
  };

  const handleGenerateReport = (clientId: string) => {
    setSelectedClient(clientId);
    setTimeout(() => generateReport(), 100);
  };

  const handleViewReport = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    toast({
      title: "View Report",
      description: `Opening detailed report for ${client?.name}`,
    });
  };

  const exportToPDF = () => {
    toast({
      title: "PDF Export",
      description: "Report is being prepared for download...",
    });
    console.log('Exporting report to PDF');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ad Performance Dashboard</h1>
              <p className="text-sm text-gray-600">Internal CRM Reporting Tool</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                {user.email}
              </div>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Report Dashboard
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Report Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <ClientsTable 
              onGenerateReport={handleGenerateReport}
              onViewReport={handleViewReport}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <ReportStatusDashboard />
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ClientSelector
                    clients={clients}
                    selectedClient={selectedClient}
                    onClientChange={setSelectedClient}
                  />
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                  <div className="flex items-end">
                    <Button
                      onClick={generateReport}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Report'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reportData && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                  <MetricsCard
                    title="Total Spend"
                    value={`$${mockMetrics.totalSpend.toLocaleString()}`}
                    change={5.2}
                    changeLabel="vs previous period"
                  />
                  <MetricsCard
                    title="Facebook Leads"
                    value={mockMetrics.fbLeads}
                    change={12.8}
                    changeLabel="vs previous period"
                  />
                  <MetricsCard
                    title="Validated Leads"
                    value={mockMetrics.validatedLeads}
                    change={-2.1}
                    changeLabel="vs previous period"
                    description="15% discrepancy from FB"
                  />
                  <MetricsCard
                    title="Cost Per Lead"
                    value={`$${mockMetrics.cpl}`}
                    change={8.3}
                    changeLabel="vs previous period"
                  />
                  <MetricsCard
                    title="CPM"
                    value={`$${mockMetrics.cpm}`}
                    change={-8.1}
                    changeLabel="vs previous period"
                  />
                  <MetricsCard
                    title="Cost Per Result"
                    value={`$${mockMetrics.cpr}`}
                    change={4.7}
                    changeLabel="vs previous period"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <PerformanceChart data={mockChartData} />
                  <InsightsPanel insights={mockInsights} />
                </div>

                {/* Export Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={exportToPDF} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        Download PDF Report
                      </Button>
                      <div className="text-sm text-gray-600 flex items-center">
                        Report includes: Summary metrics, performance trends, insights, and recommendations
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
