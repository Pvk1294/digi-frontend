
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

interface ReportStats {
  totalClients: number;
  reportsSentThisWeek: number;
  pendingReports: number;
  overdueReports: number;
  consentCaptured: number;
}

export const ReportStatusDashboard = () => {
  const stats: ReportStats = {
    totalClients: 12,
    reportsSentThisWeek: 8,
    pendingReports: 3,
    overdueReports: 1,
    consentCaptured: 10
  };

  const completionRate = (stats.reportsSentThisWeek / stats.totalClients) * 100;
  const consentRate = (stats.consentCaptured / stats.totalClients) * 100;

  const upcomingReports = [
    { client: 'TechCorp Solutions', dueDate: '2024-06-07', priority: 'high' },
    { client: 'Digital Marketing Pro', dueDate: '2024-06-08', priority: 'medium' },
    { client: 'E-commerce Plus', dueDate: '2024-06-10', priority: 'low' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-sm text-gray-600">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.reportsSentThisWeek}</p>
                <p className="text-sm text-gray-600">Reports Sent This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReports}</p>
                <p className="text-sm text-gray-600">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.overdueReports}</p>
                <p className="text-sm text-gray-600">Overdue Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Report Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-gray-600">
                {stats.reportsSentThisWeek} of {stats.totalClients} reports completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consent Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consent Rate</span>
                <span>{Math.round(consentRate)}%</span>
              </div>
              <Progress value={consentRate} className="h-2" />
              <p className="text-xs text-gray-600">
                {stats.consentCaptured} of {stats.totalClients} clients consented
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Report Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{report.client}</p>
                  <p className="text-sm text-gray-600">Due: {report.dueDate}</p>
                </div>
                <Badge 
                  variant={report.priority === 'high' ? 'destructive' : 
                          report.priority === 'medium' ? 'secondary' : 'outline'}
                >
                  {report.priority} priority
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
