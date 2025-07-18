
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Key, Globe, Settings, Plus, Trash2, Edit, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BusinessToken {
  id: string;
  name: string;
  token: string;
  status: 'active' | 'inactive';
  lastUsed: string;
  createdAt: string;
}

interface WhitelistIP {
  id: string;
  ipAddress: string;
  description: string;
  addedAt: string;
  addedBy: string;
}

export const AdminPanel = () => {
  const [businessTokens, setBusinessTokens] = useState<BusinessToken[]>([
    {
      id: '1',
      name: 'Primary Facebook Token',
      token: 'EAABwzLixnjY...truncated',
      status: 'active',
      lastUsed: '2024-06-10 09:30:00',
      createdAt: '2024-06-01 10:00:00'
    }
  ]);

  const [whitelistIPs, setWhitelistIPs] = useState<WhitelistIP[]>([
    {
      id: '1',
      ipAddress: '192.168.1.100',
      description: 'Office Network',
      addedAt: '2024-06-01 10:00:00',
      addedBy: 'admin@digitalinclined.com'
    }
  ]);

  const [newToken, setNewToken] = useState({ name: '', token: '' });
  const [newIP, setNewIP] = useState({ ipAddress: '', description: '' });

  const addBusinessToken = () => {
    if (!newToken.name || !newToken.token) {
      toast({
        title: "Invalid Input",
        description: "Please provide both token name and value",
        variant: "destructive"
      });
      return;
    }

    const token: BusinessToken = {
      id: Date.now().toString(),
      name: newToken.name,
      token: newToken.token,
      status: 'active',
      lastUsed: 'Never',
      createdAt: new Date().toISOString()
    };

    setBusinessTokens(prev => [...prev, token]);
    setNewToken({ name: '', token: '' });
    
    toast({
      title: "Token Added",
      description: "Business token has been added successfully"
    });
  };

  const removeBusinessToken = (id: string) => {
    setBusinessTokens(prev => prev.filter(token => token.id !== id));
    toast({
      title: "Token Removed",
      description: "Business token has been removed"
    });
  };

  const addWhitelistIP = () => {
    if (!newIP.ipAddress) {
      toast({
        title: "Invalid Input",
        description: "Please provide an IP address",
        variant: "destructive"
      });
      return;
    }

    const ip: WhitelistIP = {
      id: Date.now().toString(),
      ipAddress: newIP.ipAddress,
      description: newIP.description || 'No description',
      addedAt: new Date().toISOString(),
      addedBy: 'admin@digitalinclined.com'
    };

    setWhitelistIPs(prev => [...prev, ip]);
    setNewIP({ ipAddress: '', description: '' });
    
    toast({
      title: "IP Added",
      description: "IP address has been added to whitelist"
    });
  };

  const removeWhitelistIP = (id: string) => {
    setWhitelistIPs(prev => prev.filter(ip => ip.id !== id));
    toast({
      title: "IP Removed",
      description: "IP address has been removed from whitelist"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Controls
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage business tokens, IP whitelist, and security settings.
          </p>
        </CardHeader>
      </Card>

      {/* Business Manager Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Business Manager Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Token Name"
              value={newToken.name}
              onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Token Value"
              value={newToken.token}
              onChange={(e) => setNewToken(prev => ({ ...prev, token: e.target.value }))}
              type="password"
            />
            <Button onClick={addBusinessToken} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Token
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {token.token.substring(0, 20)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={token.status === 'active' ? 'default' : 'secondary'}>
                      {token.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{token.lastUsed}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBusinessToken(token.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            IP Whitelist Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="IP Address (e.g., 192.168.1.100)"
              value={newIP.ipAddress}
              onChange={(e) => setNewIP(prev => ({ ...prev, ipAddress: e.target.value }))}
            />
            <Input
              placeholder="Description (optional)"
              value={newIP.description}
              onChange={(e) => setNewIP(prev => ({ ...prev, description: e.target.value }))}
            />
            <Button onClick={addWhitelistIP} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add IP
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Added At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whitelistIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                  <TableCell>{ip.description}</TableCell>
                  <TableCell className="text-sm text-gray-600">{ip.addedBy}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(ip.addedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWhitelistIP(ip.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Auto Daily Reports</h4>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Auto-run daily reports at 00:01 (account timezone)
                </span>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Enabled
              </Badge>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Login Tracking</h4>
              <div className="text-sm text-gray-600">
                <p>• IP address logging: Enabled</p>
                <p>• Geolocation tracking: Enabled</p>
                <p>• Suspicious activity alerts: Enabled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
