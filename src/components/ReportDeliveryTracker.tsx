import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth/AuthProvider';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface DeliveryReport {
  id: string;
  clientName: string;
  adAccountId: string;
  status: 'COMPLETED' | 'SENT' | 'GENERATING';
  sentAt: string | null;
  reportType: string;
  crmComments: any;
}

const ITEMS_PER_PAGE = 10;

export const ReportDeliveryTracker = () => {
  const { token } = useAuth();

  const [reports, setReports] = useState<DeliveryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- FETCH REPORTS ---------------- */
  const fetchDeliveryReports = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch reports.');
      const data = await response.json();
      setReports(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDeliveryReports();
  }, [fetchDeliveryReports]);

  /* ---------------- RESET PAGE ON FILTER ---------------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  /* ---------------- FILTERING ---------------- */
  const filteredReports = reports.filter((report) => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  });

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ---------------- COUNTS ---------------- */
  const sentCount = reports.filter((r) => r.status === 'SENT').length;
  const pendingCount = reports.filter((r) => r.status === 'COMPLETED').length;
  const processingCount = reports.filter((r) => r.status === 'GENERATING').length;

  /* ---------------- ACTIONS ---------------- */
  const handleMarkAsSent = async (reportId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reports/${reportId}/mark-sent`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to update status.');
      toast({ title: 'Success', description: 'Report marked as sent.' });
      fetchDeliveryReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'GENERATING':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Delivery Status
        </CardTitle>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <div className="text-sm text-green-700">Sent</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
            <div className="text-sm text-blue-700">Processing</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="COMPLETED">Pending</SelectItem>
              <SelectItem value="GENERATING">Processing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : paginatedReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No reports found.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Ad Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.clientName}
                    </TableCell>
                    <TableCell>{report.adAccountId}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {report.sentAt
                        ? new Date(report.sentAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!!report.crmComments?.notes}
                          disabled
                        />
                        {report.crmComments?.notes ? 'Yes' : 'No'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {report.reportType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsSent(report.id)}
                        >
                          Mark as Sent
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
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
