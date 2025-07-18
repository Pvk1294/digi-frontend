
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdAccountSync } from './sync/AdAccountSync';
import { DailyReports } from './reports/DailyReports';
import { ReportGenerator } from './reports/ReportGenerator';
import { ReportsView } from './reports/ReportsView';
import { ReportDeliveryTracker } from './ReportDeliveryTracker';
import { AdminPanel } from './admin/AdminPanel';
import { useAuth } from './auth/AuthProvider';
import { Database, Calendar, BarChart3, MessageSquare, Shield, Clock } from 'lucide-react';

export const MainDashboard = () => {
  const { user } = useAuth();

  // Mock delivery reports data
  const mockDeliveryReports = [
    {
      id: '1',
      clientName: 'TechCorp Solutions',
      adAccountId: 'act_123456',
      status: 'sent' as const,
      reportSentDate: '2024-06-08',
      commentsAdded: true,
      reportType: 'weekly' as const
    },
    {
      id: '2',
      clientName: 'Digital Marketing Pro',
      adAccountId: 'act_789012',
      status: 'pending' as const,
      reportSentDate: null,
      commentsAdded: false,
      reportType: 'monthly' as const
    },
    {
      id: '3',
      clientName: 'E-commerce Plus',
      adAccountId: 'act_345678',
      status: 'processing' as const,
      reportSentDate: null,
      commentsAdded: true,
      reportType: 'weekly' as const
    }
  ];

  const handleUpdateStatus = (reportId: string, status: 'sent' | 'pending') => {
    console.log(`Updating report ${reportId} to status: ${status}`);
    // This would update the status in the database
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs defaultValue="sync" className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full min-w-fit ${user?.role === 'super_admin' ? 'grid-cols-6' : 'grid-cols-5'} gap-1`}>
            <TabsTrigger value="sync" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Database className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Sync Accounts</span>
              <span className="sm:hidden">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Daily Reports</span>
              <span className="sm:hidden">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Generate Reports</span>
              <span className="sm:hidden">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Delivery</span>
              <span className="sm:hidden">Send</span>
            </TabsTrigger>
            {user?.role === 'super_admin' && (
              <TabsTrigger value="admin" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="sync" className="mt-4 md:mt-6">
          <AdAccountSync />
        </TabsContent>

        <TabsContent value="daily" className="mt-4 md:mt-6">
          <DailyReports />
        </TabsContent>

        <TabsContent value="generate" className="mt-4 md:mt-6">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="reports" className="mt-4 md:mt-6">
          <ReportsView />
        </TabsContent>

        <TabsContent value="delivery" className="mt-4 md:mt-6">
          <ReportDeliveryTracker 
            reports={mockDeliveryReports}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        {user?.role === 'super_admin' && (
          <TabsContent value="admin" className="mt-4 md:mt-6">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
