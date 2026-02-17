import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, Settings } from 'lucide-react';
import { AssignmentManager } from './AssignmentManager';
import { AddBusinessAccount } from './AddBusinessAccount';

export const AdminPanel = () => {
  // All state and functions related to the old "Business Manager Tokens" have been removed.

  return (
    <div className="space-y-6">
      {/* The AddBusinessAccount and AssignmentManager are the core components now. */}
      <AddBusinessAccount />
      <AssignmentManager />

    </div>
  );
};
