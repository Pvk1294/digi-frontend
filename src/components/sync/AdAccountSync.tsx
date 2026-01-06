import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

import { KeywordMetricsDialog } from "./KeywordMetricsDialog";

/* ---------------- Pagination config ---------------- */
const ITEMS_PER_PAGE = 20;

export const AdAccountSync = () => {
  const {
    adAccounts,
    isLoading,
    syncAccounts,
    assignedBusinessAccounts
  } = useAdAccounts();

  const { user } = useAuth();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  /* ---------------- Popup state ---------------- */
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<{
    id: string;
    name: string;
  } | null>(null);

  /* ---------------- Pagination state ---------------- */
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(adAccounts.length / ITEMS_PER_PAGE);

  const paginatedAccounts = adAccounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* Reset page when data changes (sync) */
  useEffect(() => {
    setCurrentPage(1);
  }, [adAccounts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const showDropdown = assignedBusinessAccounts.length > 1;

  useEffect(() => {
    if (assignedBusinessAccounts.length === 1) {
      setSelectedAccountId(String(assignedBusinessAccounts[0].id));
    } else {
      setSelectedAccountId('all');
    }
  }, [assignedBusinessAccounts]);

  return (
    <>
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
              {showDropdown ? (
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
              ) : assignedBusinessAccounts.length === 1 ? (
                <div className="text-sm font-medium px-3 py-2 bg-muted rounded-md">
                  {assignedBusinessAccounts[0].name}
                </div>
              ) : null}

              <Button
                onClick={() =>
                  syncAccounts(
                    selectedAccountId === 'all'
                      ? undefined
                      : selectedAccountId
                  )
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Sync
                  </>
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
                {paginatedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {account.id}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {(account as any).productKeywords?.length > 0 ? (
                            (account as any).productKeywords.map(
                              (keyword: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {keyword}
                                </Badge>
                              )
                            )
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No keywords
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveAccount({
                              id: account.id,
                              name: account.name,
                            });
                            setKeywordDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.lastSync
                        ? new Date(account.lastSync).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* ---------------- Pagination UI ---------------- */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  >
                    Prev
                  </Button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Keyword popup */}
      <KeywordMetricsDialog
        open={keywordDialogOpen}
        onClose={() => setKeywordDialogOpen(false)}
        account={activeAccount}
      />
    </>
  );
};
