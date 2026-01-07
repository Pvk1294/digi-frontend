import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Report } from '@/types/reports';
import api from '@/lib/api';

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
};

export const ReportsView = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- FETCH REPORTS ---------------- */
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/reports');
        setReports(res.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.response?.data?.message || 'Failed to fetch reports',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  /* ---------------- RESET PAGE ON FILTER CHANGE ---------------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredReports = reports.filter((report) => {
    const clientName = report.clientName?.toLowerCase() || '';
    const adAccountId = report.adAccountId?.toLowerCase() || '';

    const matchesSearch =
      clientName.includes(searchTerm.toLowerCase()) ||
      adAccountId.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;

    const matchesType =
      typeFilter === 'all' || report.reportType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ---------------- HELPERS ---------------- */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
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

  const getTotalSpend = (report: Report) =>
    report.productMetrics?.reduce(
      (sum: number, m: any) => sum + (m.spend || 0),
      0
    ) || 0;

  const getTotalLeads = (report: Report) =>
    report.productMetrics?.reduce(
      (sum: number, m: any) => sum + (m.leads || 0),
      0
    ) || 0;

  const formatDateRange = (range: any) => {
    if (!range?.from || !range?.to) return 'N/A';
    return `${new Date(range.from).toLocaleDateString()} - ${new Date(
      range.to
    ).toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generated Reports
          </CardTitle>

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by client or account ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Filter className="h-4 w-4 text-gray-500 mt-2" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="GENERATING">Generating</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
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
          {paginatedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Reports Found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or search.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.clientName}</div>
                        <div className="text-xs text-gray-500">
                          {report.adAccountId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.reportType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {formatDateRange(report.dateRange)}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          getTotalSpend(report),
                          report.currency
                        )}
                      </TableCell>
                      <TableCell>{getTotalLeads(report)}</TableCell>
                      <TableCell>
                        {report.pdfUrl && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(report.pdfUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((p) => Math.max(p - 1, 1))
                      }
                    >
                      Prev
                    </Button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={
                          currentPage === i + 1 ? 'default' : 'outline'
                        }
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
