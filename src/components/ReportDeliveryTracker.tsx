import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Filter, Calendar, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth/AuthProvider'; 

// Define the shape of the report data for this component
interface DeliveryReport {
  id: string;
  clientName: string;
  adAccountId: string;
  status: 'COMPLETED' | 'SENT' | 'GENERATING';
  sentAt: string | null;
  reportType: string;
  crmComments: any;
}

export const ReportDeliveryTracker = () => {
  const { token } = useAuth(); // Get token for API calls
  const [reports, setReports] = useState<DeliveryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Function to fetch the delivery status reports from the backend
  const fetchDeliveryReports = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/reports', { // Fetching all reports
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch reports.');
      const data = await response.json();
      setReports(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch data when the component loads
  useEffect(() => {
    fetchDeliveryReports();
  }, [fetchDeliveryReports]);

  // Function to handle clicking "Mark as Sent"
  const handleMarkAsSent = async (reportId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reports/${reportId}/mark-sent`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to update status.');
      toast({ title: "Success", description: "Report marked as sent." });
      fetchDeliveryReports(); // Refresh the list to show the new status
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'COMPLETED': return <Badge variant="secondary">Pending</Badge>;
      case 'GENERATING': return <Badge variant="outline">Processing</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  });

  const sentCount = reports.filter(r => r.status === 'SENT').length;
  const pendingCount = reports.filter(r => r.status === 'COMPLETED').length;
  const processingCount = reports.filter(r => r.status === 'GENERATING').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Delivery Status
        </CardTitle>
        
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

        <div className="flex items-center gap-2 mt-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status..." />
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
        {isLoading ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Ad Account ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Report Sent Date</TableHead>
                  <TableHead>Comments Added</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.clientName}</TableCell>
                    <TableCell>{report.adAccountId}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {report.sentAt ? new Date(report.sentAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={!!(report.crmComments as any)?.notes} disabled />
                        {!!(report.crmComments as any)?.notes ? 'Yes' : 'No'}
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
                          variant="outline"
                          size="sm"
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
        )}
      </CardContent>
    </Card>
  );
};