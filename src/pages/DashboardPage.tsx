// src/pages/DashboardPage.tsx
import React from 'react';
import { AdAccountSync } from '@/components/sync/AdAccountSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyReports } from '@/components/reports/DailyReports'; // We will use this later

export const DashboardPage = () => {
  return (
    // This component will hold the main tabs for your dashboard
    <Tabs defaultValue="sync-accounts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sync-accounts">Sync Accounts</TabsTrigger>
        <TabsTrigger value="daily-reports">Daily Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="sync-accounts" className="mt-4">
        {/* The AdAccountSync component goes inside the first tab */}
        <AdAccountSync />
      </TabsContent>
      <TabsContent value="daily-reports" className="mt-4">
        {/* We will add the DailyReports component here in the future */}
        <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Daily Reports</h3>
            <p className="text-sm text-gray-500">This section will be implemented next.</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardPage;
