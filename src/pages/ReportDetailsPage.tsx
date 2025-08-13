import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Report } from '@/types/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileWarning, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ReportDetailsPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error("Authentication token not found.");
        
        const response = await fetch(`http://localhost:4000/api/reports/${reportId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Report not found or you do not have permission.');
        }
        
        const data = await response.json();
        setReport(data);

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2">Loading Report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8">
        <FileWarning className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
        <p className="text-gray-600 mb-4">The report you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => navigate('/reports')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports List
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/reports')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Reports
        </Button>
        {report.pdfUrl && (
          <Button asChild>
            <a href={report.pdfUrl} download={`report-${report.clientName}.pdf`}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        )}
      </div>

      {/* --- THIS SECTION IS NOW UPDATED --- */}
      <Card className="h-[80vh]">
        <CardHeader>
          <CardTitle className="text-2xl">{report.clientName}</CardTitle>
          <p className="text-sm text-gray-500">
            Report for {new Date(report.dateRange.from).toLocaleDateString()} - {new Date(report.dateRange.to).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="h-full pb-6">
          {report.pdfUrl ? (
            // Embed the PDF using an iframe if the URL exists
            <iframe
              src={report.pdfUrl}
              title={`PDF Report for ${report.clientName}`}
              width="100%"
              height="100%"
              className="border rounded-md"
            />
          ) : (
            // Show a message if the PDF URL is missing
            <div className="flex items-center justify-center h-full text-gray-500">
              PDF for this report is not available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};