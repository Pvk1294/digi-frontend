import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Search, Filter, Download, Eye, Calendar, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Report } from '@/types/reports';
import api from '@/lib/api'; // <-- 1. IMPORT THE API INSTANCE

// Dynamic currency formatting function (no changes here)
const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    console.error(`Invalid currency code provided: ${currencyCode}`);
    return `$${amount.toLocaleString()}`; // Fallback
  }
};

export const ReportsView = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        // --- 2. REFACTORED TO USE THE API INSTANCE ---
        const response = await api.get('/reports');
        setReports(response.data);
      } catch (error: any) {
        console.error("Failed to fetch reports:", error);
        toast({ title: "Error", description: error.response?.data?.message || "Failed to fetch reports.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  // --- NO CHANGES TO THE REST OF THE COMPONENT LOGIC ---

  const filteredReports = reports.filter(report => {
    const clientName = report.clientName || '';
    const adAccountId = report.adAccountId || '';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          adAccountId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'GENERATING':
        return <Badge variant="secondary">Generating</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleDownload = (report: Report) => {
    if (report.pdfUrl) {
      toast({ title: "Download Started", description: `Downloading ${report.clientName} report...` });
      window.open(report.pdfUrl, '_blank');
    } else {
      toast({ title: "Download Failed", description: "PDF not available for this report.", variant: "destructive" });
    }
  };

  const handleViewReport = (report: Report) => {
    navigate(`/reports/${report.id}`);
  };

  const formatDateRange = (dateRange: { from: string; to: string }) => {
    if (!dateRange?.from || !dateRange?.to) return 'N/A';
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    if (fromDate.toDateString() === toDate.toDateString()) return fromDate.toLocaleDateString();
    return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
  };

  const getTotalSpend = (report: Report) => {
    const metrics = report.productMetrics as any[];
    if (!metrics?.length) return 0;
    return metrics.reduce((sum, metric) => sum + (metric.spend || 0), 0);
  };

  const getTotalLeads = (report: Report) => {
    const metrics = report.productMetrics as any[];
    if (!metrics?.length) return 0;
    return metrics.reduce((sum, metric) => sum + (metric.leads || 0), 0);
  };

  const completedReports = reports.filter(r => r.status === 'COMPLETED').length;
  const generatingReports = reports.filter(r => r.status === 'GENERATING').length;
  const failedReports = reports.filter(r => r.status === 'FAILED').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2">Loading Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <Button variant="outline" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
            Generated Reports
          </CardTitle>
          
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4">
            <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg"><div className="text-lg md:text-2xl font-bold text-green-600">{completedReports}</div><div className="text-xs md:text-sm text-green-700">Completed</div></div>
            <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg"><div className="text-lg md:text-2xl font-bold text-blue-600">{generatingReports}</div><div className="text-xs md:text-sm text-blue-700">Generating</div></div>
            <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg"><div className="text-lg md:text-2xl font-bold text-red-600">{failedReports}</div><div className="text-xs md:text-sm text-red-700">Failed</div></div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Input placeholder="Search reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-sm" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="GENERATING">Generating</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-medium">{report.clientName}</div>
                      <div className="text-sm text-gray-500">{report.adAccountId}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{report.reportType}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateRange(report.dateRange)}</div></TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {report.status === 'COMPLETED' || report.status === 'SENT' ? 
                        formatCurrency(getTotalSpend(report), report.currency) 
                        : '—'}
                    </TableCell>
                    <TableCell>{report.status === 'COMPLETED' || report.status === 'SENT' ? getTotalLeads(report).toString() : '—'}</TableCell>
                    <TableCell><div className="text-sm">{new Date(report.generatedAt).toLocaleDateString()}<div className="text-xs text-gray-500">{new Date(report.generatedAt).toLocaleTimeString()}</div></div></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(report)} disabled={!report.pdfUrl || (report.status !== 'COMPLETED' && report.status !== 'SENT')}><Download className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Reports Found</h3>
              <p className="text-sm text-gray-600">{searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Generated reports will appear here.'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
