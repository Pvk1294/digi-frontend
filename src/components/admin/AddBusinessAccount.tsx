import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Building, Plus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AddBusinessAccount = () => {
  const [formData, setFormData] = useState({
    name: '',
    appId: '',
    appSecret: '',
    accessToken: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.appId || !formData.appSecret || !formData.accessToken) {
      return toast({
        title: "Missing Fields",
        description: "Please fill out all fields to add a new business account.",
        variant: "destructive",
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/business-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add business account');
      }

      toast({
        title: "Success!",
        description: `Business account "${formData.name}" has been added.`,
      });
      
      // Clear the form
      setFormData({ name: '', appId: '', appSecret: '', accessToken: '' });
      // You might want to refresh the list in the AssignmentManager here
      // For now, a page refresh will show the new account in the list.

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not add the business account. Please check the console.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Add New Business Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="name"
            placeholder="Friendly Name (e.g., Client ABC's Account)"
            value={formData.name}
            onChange={handleInputChange}
          />
          <Input
            name="appId"
            placeholder="Facebook App ID"
            value={formData.appId}
            onChange={handleInputChange}
          />
          <Input
            name="appSecret"
            placeholder="Facebook App Secret"
            type="password"
            value={formData.appSecret}
            onChange={handleInputChange}
          />
          <Input
            name="accessToken"
            placeholder="Facebook Access Token"
            type="password"
            value={formData.accessToken}
            onChange={handleInputChange}
          />
        </div>
        <Button onClick={handleSubmit} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Save Business Account
        </Button>
      </CardContent>
    </Card>
  );
};