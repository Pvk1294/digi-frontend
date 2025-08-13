import React, { useState, useEffect } from 'react'; // Import useEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Shield, Key, Globe, Settings, Plus, Trash2, Edit, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AssignmentManager } from './AssignmentManager';
import { AddBusinessAccount } from './AddBusinessAccount';

// Define the API base URL
const API_BASE_URL = 'http://localhost:4000/api';

// --- Interfaces (no change here) ---
interface BusinessToken {
  id: number; // The database ID is a number
  tokenName: string;
  adAccount: { name: string };
  status: string;
  lastUsed: string;
}

interface AdAccount {
  id: string;
  name: string;
}

// ... other interfaces

export const AdminPanel = () => {
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [newToken, setNewToken] = useState({ name: '', value: '' });
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>('');
  
  // Function to fetch all business tokens from the API
  const fetchBusinessTokens = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tokens`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      toast({ title: "Error", description: "Could not fetch tokens.", variant: "destructive" });
    }
  };

  // Function to fetch all Ad Accounts for the dropdown
  const fetchAdAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ad-accounts`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setAdAccounts(data);
    } catch (error) {
      console.error("Failed to fetch ad accounts:", error);
    }
  };


  // --- UPDATED Handler to add a token via API ---
  const handleAddToken = async () => {
    if (!newToken.name || !newToken.value || !selectedAdAccountId) {
      return toast({ title: "Invalid Input", description: "Please fill all fields and select an ad account.", variant: "destructive" });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: newToken.name,
          tokenValue: newToken.value,
          adAccountId: selectedAdAccountId
        }),
      });

      if (!response.ok) throw new Error('Failed to add token');

      setNewToken({ name: '', value: '' });
      setSelectedAdAccountId('');
      await fetchBusinessTokens(); // Refresh the list from the server
      toast({ title: "Token Added", description: "Business token has been added successfully." });

    } catch (error) {
      console.error("Error adding token:", error);
      toast({ title: "Error", description: "Could not add token.", variant: "destructive" });
    }
  };

  // --- UPDATED Handler to remove a token via API ---
  const handleRemoveToken = async (id: number) => {
    if (!confirm('Are you sure you want to remove this token?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tokens/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove token');
      
      await fetchBusinessTokens(); // Refresh the list from the server
      toast({ title: "Token Removed", description: "Business token has been removed." });

    } catch (error) {
      console.error("Error removing token:", error);
      toast({ title: "Error", description: "Could not remove token.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card> {/* ... Admin Controls Card ... */} </Card>
      
      {/* Business Manager Tokens Card */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Business Manager Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UPDATED Form with Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select onValueChange={setSelectedAdAccountId} value={selectedAdAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to Ad Account" />
              </SelectTrigger>
              <SelectContent>
                {adAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Token Name"
              value={newToken.name}
              onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Token Value"
              value={newToken.value}
              onChange={(e) => setNewToken(prev => ({ ...prev, value: e.target.value }))}
              type="password"
            />
            <Button onClick={handleAddToken} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Token
            </Button>
          </div>
          
          {/* UPDATED Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Assigned To</TableHead> {/* New Column */}
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </CardContent>
      </Card>

      <AddBusinessAccount />

      <AssignmentManager />

      <Card> {/* ... IP Whitelist Card ... */} </Card>
      <Card> {/* ... Security Settings Card ... */} </Card>
    </div>
  );
};