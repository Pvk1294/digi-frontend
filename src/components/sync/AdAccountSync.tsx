import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Download, Wifi, Edit } from 'lucide-react';
import { useAdAccounts } from '@/components/providers/AdAccountProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AdAccountSync = () => {
  const { 
    adAccounts, 
    isLoading, 
    syncAccounts,
    assignedBusinessAccounts 
  } = useAdAccounts();
  
  const { user } = useAuth();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // ✅ FIX: Simplified logic. Show the dropdown for ANY user if there's more than one account to choose from.
  const showDropdown = assignedBusinessAccounts.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Facebook Ad Accounts
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Sync ad accounts from Facebook and configure product keywords.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {showDropdown && (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select account to sync" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {assignedBusinessAccounts.map(ba => (
                    <SelectItem key={ba.id} value={String(ba.id)}>
                      {ba.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              onClick={() => syncAccounts(selectedAccountId === 'all' ? undefined : selectedAccountId)} 
              disabled={isLoading}
              className="flex-grow"
            >
              {isLoading ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Sync</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {adAccounts.length > 0 && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Account Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product Keywords</TableHead>
                <TableHead>Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="font-mono text-sm">{account.id}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {(account as any).productKeywords && (account as any).productKeywords.length > 0 ? (
                          (account as any).productKeywords.map((keyword: string, index: number) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};
