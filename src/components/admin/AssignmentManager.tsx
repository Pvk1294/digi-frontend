import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Users, Building, Link, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api/admin';

// Interfaces for our data types
interface BusinessAccount {
  id: number;
  name: string;
}

interface UserAssignmentStatus {
  id: string;
  email: string;
  role: string;
  isAssigned: boolean;
}

export const AssignmentManager = () => {
  // State for the list of all business accounts
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignmentStatus[]>([]);

  const fetchBusinessAccounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/business-accounts`);
      if (!response.ok) throw new Error('Failed to fetch business accounts');
      const data = await response.json();
      setBusinessAccounts(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not fetch business accounts.", variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    fetchBusinessAccounts();
  }, [fetchBusinessAccounts]);
  useEffect(() => {
    if (selectedAccountId === null) {
      setUserAssignments([]); 
      return;
    }
    const fetchAssignmentsForAccount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/business-accounts/${selectedAccountId}/assignments`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        setUserAssignments(data);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: `Could not fetch assignments for account ID ${selectedAccountId}.`, variant: 'destructive' });
      }
    };
    fetchAssignmentsForAccount();
  }, [selectedAccountId]); // This effect re-runs when selectedAccountId changes

  // Handler for when a user's checkbox is clicked
  const handleCheckboxChange = (userId: string) => {
    setUserAssignments(currentAssignments =>
      currentAssignments.map(user =>
        user.id === userId ? { ...user, isAssigned: !user.isAssigned } : user
      )
    );
  };
  
  // Handler for the "Save Changes" button
  const handleSaveChanges = async () => {
    if (selectedAccountId === null) return;

    // Get a list of IDs for only the users whose boxes are checked
    const assignedUserIds = userAssignments
      .filter(user => user.isAssigned)
      .map(user => user.id);
      
    try {
      const response = await fetch(`${API_BASE_URL}/business-accounts/${selectedAccountId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: assignedUserIds })
      });
      if (!response.ok) throw new Error('Failed to save assignments');
      toast({ title: "Success!", description: "Assignments have been updated." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not save assignments.", variant: 'destructive' });
    }
  };

  // Handler for deleting a business account
  const handleDeleteBusinessAccount = async (accountId: number, accountName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${accountName}"? This will also remove all its user assignments.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/business-accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete account');
      
      toast({ title: "Success!", description: `"${accountName}" has been deleted.` });
      
      // If the deleted account was the one selected, clear the selection
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
      
      // Refresh the list of business accounts
      await fetchBusinessAccounts();

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not delete the business account.", variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Assign Business Accounts to Users
        </CardTitle>
        <p className="text-sm text-gray-600">Select a business account to manage which users (CRMs) have access to it.</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: List of Business Accounts */}
        <div className="md:col-span-1 border-r pr-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Building className="h-4 w-4" /> Business Accounts</h3>
          <ul className="space-y-2">
            {businessAccounts.map(account => (
              <li key={account.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`flex-grow text-left p-2 rounded-md text-sm ${selectedAccountId === account.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}
                >
                  {account.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteBusinessAccount(account.id, account.name)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: List of Users with Checkboxes */}
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Assign Users (CRMs)</h3>
          {selectedAccountId === null ? (
            <p className="text-sm text-gray-500">Please select a business account from the left.</p>
          ) : (
            <div className="space-y-3">
              {userAssignments.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={user.isAssigned}
                    onCheckedChange={() => handleCheckboxChange(user.id)}
                  />
                  <label htmlFor={`user-${user.id}`} className="flex-grow text-sm cursor-pointer">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                  </label>
                </div>
              ))}
              <Button onClick={handleSaveChanges} className="mt-4">Save Changes</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
