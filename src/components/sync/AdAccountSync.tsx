import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Download, Wifi, Edit } from 'lucide-react';
import { useAdAccounts } from '@/components/providers/AdAccountProvider';

export const AdAccountSync = () => {
  const { adAccounts, isLoading, syncAccounts } = useAdAccounts();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
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
              Facebook Ad Accounts
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Sync ad accounts from Facebook Business Manager and configure product keywords.
            </p>
          </div>
          <Button onClick={syncAccounts} disabled={isLoading}>
            {isLoading ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Sync Accounts</>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {adAccounts.length > 0 && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>Client Name</TableHead> */} {/* REMOVED */}
                <TableHead>Ad Account Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product Keywords</TableHead>
                <TableHead>Last Sync</TableHead>
                {/* <TableHead>Actions</TableHead> */} {/* REMOVED */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {adAccounts.map((account) => (
                <TableRow key={account.id}>
                  {/* <TableCell className="font-medium">{account.clientName}</TableCell> */} {/* REMOVED */}
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="font-mono text-sm">{account.id}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {account.keywords && account.keywords.length > 0 ? (
                          account.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No keywords</span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never'}</TableCell>
                  {/* <TableCell> */} {/* REMOVED */}
                  {/* <Button variant="outline" size="sm">Generate Report</Button> */}
                  {/* </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};