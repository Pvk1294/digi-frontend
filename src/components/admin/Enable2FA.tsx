import React, { useState } from 'react';
import api from '@/lib/api'; // Your configured axios instance
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export const Enable2FA = () => {
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string; manualSetupKey: string } | null>(null);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1: Call the backend to get the secret key and QR code
  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/admin/2fa/generate');
      setSetupData(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not generate 2FA secret.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send the first token from the app back to the server to confirm and enable
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/admin/2fa/verify', { token });
      toast({ title: 'Success!', description: '2FA has been enabled on your account.' });
      setIsSuccess(true);
      setSetupData(null); // Clear the setup data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed.';
      toast({ title: 'Verification Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-semibold">✅ 2FA is now active on your account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Two-Factor Authentication (2FA)</CardTitle>
        <CardDescription>Enhance your account security.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!setupData ? (
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Enable 2FA'}
          </Button>
        ) : (
          <div>
            <p className="mb-4">1. Scan the QR code with your Google Authenticator app.</p>
            <div className="flex justify-center p-4 bg-white rounded-md">
              <img src={setupData.qrCodeUrl} alt="2FA QR Code" />
            </div>
            <p className="mt-4 text-sm text-center">Or enter this key manually:</p>
            <p className="text-center font-mono bg-slate-100 p-2 rounded-md my-2">{setupData.manualSetupKey}</p>
            
            <form onSubmit={handleVerify} className="space-y-4 mt-6 border-t pt-6">
              <p>2. Enter the 6-digit code from the app to verify and complete setup.</p>
              <Input
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify & Activate'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};