
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, FileText, Send, Filter, Search, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  adAccountId: string;
  contactEmail?: string;
  lastReportSent?: string;
  reportStatus: 'pending' | 'sent' | 'overdue';
  weeklyReportDue: boolean;
  consentGiven: boolean;
  consentTimestamp?: string;
  consentBy?: string;
}

interface ClientsTableProps {
  onGenerateReport: (clientId: string) => void;
  onViewReport: (clientId: string) => void;
}

export const ClientsTable = ({ onGenerateReport, onViewReport }: ClientsTableProps) => {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'TechCorp Solutions',
      adAccountId: 'act_123456',
      contactEmail: 'contact@techcorp.com',
      lastReportSent: '2024-05-28',
      reportStatus: 'sent',
      weeklyReportDue: true,
      consentGiven: true,
      consentTimestamp: '2024-05-28T10:00:00Z',
      consentBy: 'user@company.com'
    },
    {
      id: '2',
      name: 'Digital Marketing Pro',
      adAccountId: 'act_789012',
      contactEmail: 'hello@digipro.com',
      lastReportSent: '2024-05-20',
      reportStatus: 'overdue',
      weeklyReportDue: true,
      consentGiven: false
    },
    {
      id: '3',
      name: 'E-commerce Plus',
      adAccountId: 'act_345678',
      contactEmail: 'team@ecomplus.com',
      reportStatus: 'pending',
      weeklyReportDue: false,
      consentGiven: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.reportStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConsentCapture = (client: Client) => {
    setSelectedClient(client);
    setIsConsentModalOpen(true);
  };

  const confirmConsent = () => {
    if (selectedClient) {
      const updatedClients = clients.map(client =>
        client.id === selectedClient.id
          ? {
              ...client,
              consentGiven: true,
              consentTimestamp: new Date().toISOString(),
              consentBy: 'user@company.com' // This would come from auth context
            }
          : client
      );
      setClients(updatedClients);
      setIsConsentModalOpen(false);
      toast({
        title: "Consent Captured",
        description: `Consent recorded for ${selectedClient.name}`,
      });
    }
  };

  const handleSendReport = (client: Client) => {
    if (!client.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please capture client consent before sending the report.",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending report
    const updatedClients = clients.map(c =>
      c.id === client.id
        ? {
            ...c,
            reportStatus: 'sent' as const,
            lastReportSent: new Date().toISOString().split('T')[0]
          }
        : c
    );
    setClients(updatedClients);
    
    toast({
      title: "Report Sent",
      description: `Report successfully sent to ${client.name}`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Client Report Management
        </CardTitle>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Last Report</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Weekly Due</TableHead>
              <TableHead>Consent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {client.contactEmail || 'N/A'}
                </TableCell>
                <TableCell>
                  {client.lastReportSent ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {client.lastReportSent}
                    </div>
                  ) : (
                    'Never'
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(client.reportStatus)}</TableCell>
                <TableCell>
                  {client.weeklyReportDue ? (
                    <Badge variant="outline" className="bg-blue-50">Yes</Badge>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={client.consentGiven}
                      disabled={client.consentGiven}
                    />
                    {client.consentGiven ? (
                      <span className="text-xs text-green-600">Given</span>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs"
                        onClick={() => handleConsentCapture(client)}
                      >
                        Capture
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReport(client.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGenerateReport(client.id)}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendReport(client)}
                      disabled={!client.consentGiven}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Consent Capture Modal */}
        <Dialog open={isConsentModalOpen} onOpenChange={setIsConsentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Capture Client Consent</DialogTitle>
              <DialogDescription>
                Confirm that {selectedClient?.name} has given consent to receive and review their ad performance report.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Ensure you have obtained explicit consent from the client 
                  before sending their performance report. This consent will be recorded with a timestamp.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consent-confirm" />
                <label htmlFor="consent-confirm" className="text-sm">
                  I confirm that {selectedClient?.name} has given consent to receive their report
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsConsentModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmConsent}>
                  Record Consent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
