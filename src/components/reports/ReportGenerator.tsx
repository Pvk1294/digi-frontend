import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Download,
  RefreshCw,
  FileDown,
  MessageSquare,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdAccounts } from '@/components/providers/AdAccountProvider';

const chartConfig = {
  spend: { label: 'Spend', color: '#3b82f6' },
  leads: { label: 'Leads', color: '#10b981' },
  cpl: { label: 'CPL', color: '#f59e0b' },
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SPEND_COLORS = {
  total: '#60A5FA',   // soft blue
  testing: '#F59E0B', // amber
  scaling: '#10B981', // green
};

const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

export const ReportGenerator = () => {
  const {
    adAccounts,
    comprehensiveReport,
    isGeneratingReport,
    generateComprehensiveReport,
    isGeneratingPdf,
    pdfUrl,
    generatePdfReport,
  } = useAdAccounts();

  // Notes
  const [agencyNotes, setAgencyNotes] = useState('');

  // Controls
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedRange, setSelectedRange] = useState('7days');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const handleGenerateClick = () => {
    if (!selectedClient) {
      toast({
        title: 'Client Not Selected',
        description: 'Please select a client to generate a report.',
        variant: 'destructive',
      });
      return;
    }
    generateComprehensiveReport(selectedClient, selectedRange);
  };

  const handleGeneratePdfClick = () => {
    if (!comprehensiveReport) {
      toast({
        title: 'No Report Data',
        description: 'Please generate a report first before creating a PDF.',
        variant: 'destructive',
      });
      return;
    }

    const clientAccount = adAccounts.find((acc) => acc.id === selectedClient);
    const clientName = clientAccount ? clientAccount.name : 'Comprehensive Report';

    let dateRange = { from: new Date(), to: new Date() };
    if (selectedRange === 'custom' && customDateFrom && customDateTo) {
      dateRange = { from: customDateFrom, to: customDateTo };
    } else {
      const days = parseInt(selectedRange.replace('days', ''), 10);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      dateRange = { from: fromDate, to: new Date() };
    }

    const payload = {
      reportData: {
        ...comprehensiveReport,
        notes: agencyNotes,
      },
      clientName,
      adAccountId: selectedClient,
      reportType: selectedRange.includes('days') ? selectedRange : 'custom',
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
    };

    generatePdfReport(payload);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Report Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate comprehensive reports with charts, graphs, and detailed analytics.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {adAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {selectedRange === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, 'PPP') : 'From Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, 'PPP') : 'To Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </>
            )}

            <Button onClick={handleGenerateClick} disabled={isGeneratingReport} className="sm:col-span-2 lg:col-span-1">
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary tiles */}
      {comprehensiveReport && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(comprehensiveReport.summary.totalSpend, comprehensiveReport.summary.currency)}
                </div>
                <p className="text-xs text-gray-600">Total Spend</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">{comprehensiveReport.summary.totalLeads}</div>
                <p className="text-xs text-gray-600">Total Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(comprehensiveReport.summary.avgCpl, comprehensiveReport.summary.currency)}
                </div>
                <p className="text-xs text-gray-600">Avg CPL</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(comprehensiveReport.summary.avgCpm, comprehensiveReport.summary.currency)}
                </div>
                <p className="text-xs text-gray-600">Avg CPM</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {(comprehensiveReport.summary.totalImpressions / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-gray-600">Impressions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {(comprehensiveReport.summary.totalClicks / 1000).toFixed(1)}K
                </div>
                <p className="text-xs text-gray-600">Clicks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {comprehensiveReport.summary.totalLandingPageViews?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-gray-600">Landing Page Views</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Spend Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[220px] sm:min-h-[300px]">
                  <AreaChart data={comprehensiveReport.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => formatCurrency(v, comprehensiveReport.summary.currency)} />

                    <ChartTooltip
                      content={({ payload, label }) => {
                        if (!payload || payload.length === 0) return null;

                        const getValue = (key: string): number => {
                          const raw = payload.find(p => p.dataKey === key)?.value;
                          return typeof raw === 'number' ? raw : Number(raw) || 0;
                        };

                        const total = getValue('spend');
                        const testing = getValue('testingSpend');
                        const scaling = getValue('scalingSpend');

                        return (
                          <div className="rounded-md border bg-white p-3 text-sm shadow">
                            <div className="font-medium mb-1">{label}</div>

                            <div className="text-blue-600">
                              Total: {formatCurrency(total, comprehensiveReport.summary.currency)}
                            </div>

                            <div className="text-amber-600">
                              Testing: {formatCurrency(testing, comprehensiveReport.summary.currency)}
                            </div>

                            <div className="text-green-600">
                              Scaling: {formatCurrency(scaling, comprehensiveReport.summary.currency)}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* Total spend (background reference) */}
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke={SPEND_COLORS.total}
                      fill={SPEND_COLORS.total}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />

                    {/* Testing spend */}
                    <Line
                      type="monotone"
                      dataKey="testingSpend"
                      stroke={SPEND_COLORS.testing}
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                    />

                    {/* Scaling spend */}
                    <Line
                      type="monotone"
                      dataKey="scalingSpend"
                      stroke={SPEND_COLORS.scaling}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </AreaChart>

                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Leads Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[220px] sm:min-h-[300px]">
                  <BarChart data={comprehensiveReport.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="leads" fill={chartConfig.leads.color} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Per Lead Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[220px] sm:min-h-[300px]">
                  <LineChart data={comprehensiveReport.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => formatCurrency(v, comprehensiveReport.summary.currency)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="cpl"
                      stroke={chartConfig.cpl.color}
                      strokeWidth={3}
                      dot={{ fill: chartConfig.cpl.color }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4" />
                  Product Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[220px] sm:min-h-[300px]">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      dataKey="value"
                      data={comprehensiveReport.products}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {comprehensiveReport.products.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>

                <div className="mt-4 space-y-2">
                  {comprehensiveReport.products.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm break-words">
                        {product.name}: {formatCurrency(product.spend, comprehensiveReport.summary.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Agency Notes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your observations. This will be included in the PDF.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., The new ad creatives resulted in a 15% improvement in CPL..."
                value={agencyNotes}
                onChange={(e) => setAgencyNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle>Export Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Once the report is ready, you can download it as a professional-grade PDF.
              </p>
            </CardHeader>
            <CardContent>
              {isGeneratingPdf ? (
                <Button disabled>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </Button>
              ) : pdfUrl ? (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a href={pdfUrl} download={`report-${selectedClient}.pdf`} rel="noopener noreferrer">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              ) : (
                <Button onClick={handleGeneratePdfClick}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF with Charts
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
