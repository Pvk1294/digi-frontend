import React, { useState, useEffect } from 'react'; // 1. Import useEffect
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from './AuthProvider';
import { Shield, User } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const LoginForm = () => {
  const { login, verify2fa, isLoading, is2faRequired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [loginType, setLoginType] = useState<'crm' | 'admin'>('crm');

  // 2. Add this useEffect hook
  // This effect syncs the active tab with the authentication state.
  useEffect(() => {
    if (is2faRequired) {
      setLoginType('admin');
    }
  }, [is2faRequired]);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error) {
      // Errors are handled in AuthProvider
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verify2fa(authenticatorCode);
    } catch (error) {
      // Errors are handled in AuthProvider
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Logo size="md" className="mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">CRM Dashboard</CardTitle>
            <CardDescription>Secure Ad Performance Reporting</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'crm' | 'admin')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                CRM Login
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crm">
              <form onSubmit={handleInitialLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="crm-email">Email</Label>
                  <Input id="crm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm-password">Password</Label>
                  <Input id="crm-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              {!is2faRequired ? (
                <form onSubmit={handleInitialLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Authenticating...' : 'Continue to Verification'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="authenticator">Google Authenticator Code</Label>
                    <Input id="authenticator" type="text" value={authenticatorCode} onChange={(e) => setAuthenticatorCode(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
