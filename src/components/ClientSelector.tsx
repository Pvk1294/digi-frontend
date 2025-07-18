
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Client {
  id: string;
  name: string;
  adAccountId: string;
}

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: string;
  onClientChange: (clientId: string) => void;
}

export const ClientSelector = ({ clients, selectedClient, onClientChange }: ClientSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="client-select">Select Client</Label>
      <Select value={selectedClient} onValueChange={onClientChange}>
        <SelectTrigger id="client-select">
          <SelectValue placeholder="Choose a client..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
