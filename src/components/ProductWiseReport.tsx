
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileDown, MessageSquare, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductMetrics {
  productName: string;
  spend: number;
  fbLeads: number;
  validatedLeads: number;
  cplFb: number;
  cplValidated: number;
  cpm: number;
  ctr: number;
  comments: string;
}

interface ProductWiseReportProps {
  clientName: string;
  adAccountId: string;
  reportPeriod: string;
  productMetrics: ProductMetrics[];
  onUpdateComments: (productName: string, comments: string) => void;
  onGeneratePDF: () => void;
  onGenerateWhatsAppMessage: () => void;
}

export const ProductWiseReport = ({
  clientName,
  adAccountId,
  reportPeriod,
  productMetrics,
  onUpdateComments,
  onGeneratePDF,
  onGenerateWhatsAppMessage
}: ProductWiseReportProps) => {
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const generateWhatsAppMessage = () => {
    const message = `Hi ${clientName}, here is your Weekly performance report for the period ${reportPeriod}. Please find the attached report for more details.`;
    setWhatsappMessage(message);
    onGenerateWhatsAppMessage();
    toast({
      title: "WhatsApp Message Generated",
      description: "Message snippet is ready for copying.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsappMessage);
    toast({
      title: "Copied to Clipboard",
      description: "WhatsApp message copied successfully.",
    });
  };

  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Client Performance Report</CardTitle>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Client:</strong> {clientName}</p>
            <p><strong>Ad Account ID:</strong> {adAccountId}</p>
            <p><strong>Reporting Period:</strong> {reportPeriod}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Product Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Product Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>FB Leads</TableHead>
                <TableHead>Validated Leads</TableHead>
                <TableHead>CPL (Validated)</TableHead>
                <TableHead>CPM</TableHead>
                <TableHead>CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productMetrics.map((metric) => (
                <TableRow key={metric.productName}>
                  <TableCell className="font-medium">{metric.productName}</TableCell>
                  <TableCell>{formatCurrency(metric.spend)}</TableCell>
                  <TableCell>{metric.fbLeads}</TableCell>
                  <TableCell>{metric.validatedLeads}</TableCell>
                  <TableCell>{formatCurrency(metric.cplValidated)}</TableCell>
                  <TableCell>{formatCurrency(metric.cpm)}</TableCell>
                  <TableCell>{metric.ctr}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CRM Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            CRM Comments & Observations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {productMetrics.map((metric) => (
            <div key={metric.productName} className="space-y-2">
              <Label htmlFor={`comments-${metric.productName}`}>
                Comments for {metric.productName}:
              </Label>
              <Textarea
                id={`comments-${metric.productName}`}
                placeholder={`Add observations about ${metric.productName} performance...`}
                value={metric.comments}
                onChange={(e) => onUpdateComments(metric.productName, e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Report Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={onGeneratePDF} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Generate PDF Report
            </Button>
            <Button onClick={generateWhatsAppMessage} variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Generate WhatsApp Message
            </Button>
          </div>

          {whatsappMessage && (
            <div className="space-y-2">
              <Label>WhatsApp Message Snippet:</Label>
              <div className="relative">
                <Textarea
                  value={whatsappMessage}
                  readOnly
                  className="min-h-[100px] pr-20"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={openWhatsApp}>
                    Send via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
