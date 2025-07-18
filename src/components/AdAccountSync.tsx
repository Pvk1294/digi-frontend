import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Download, Wifi } from 'lucide-react';
import { useAdAccounts } from '@/components/providers/AdAccountProvider'; // Import the hook for global state

export const AdAccountSync = () => {
  // Get data and functions from the global provider.
  // This component no longer needs to manage the list of accounts itself.
  const { adAccounts, isLoading, syncAccounts } = useAdAccounts();

  const handleSync = () => {
    // Call the sync function from our global provider
    syncAccounts();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Facebook Ad Accounts Sync
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                    Sync ad accounts from Facebook to begin report generation.
                </p>
            </div>
            <Button onClick={handleSync} disabled={isLoading}>
                {isLoading ? (
                <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                </>
                ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Sync Ad Accounts
                </>
                )}
            </Button>
        </div>
      </CardHeader>
      
      {adAccounts.length > 0 && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Ad Account ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.id}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>{account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Generate report for ${account.id}`)} // Placeholder action
                      disabled={isLoading}
                    >
                      Generate Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};
