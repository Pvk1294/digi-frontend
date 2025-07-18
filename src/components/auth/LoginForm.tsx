import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthProvider';
import { Shield, User, Info } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const LoginForm = () => {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    otp: '',
    authenticatorCode: '',
  });
  const [step, setStep] = useState<'credentials' | 'verification'>('credentials');
  const [loginType, setLoginType] = useState<'crm' | 'admin'>('crm');

  const fillDemoCredentials = (type: 'crm' | 'admin') => {
    if (type === 'crm') {
      setCredentials(prev => ({
        ...prev,
        email: 'crm@company.com',
        password: 'demo123'
      }));
    } else {
      setCredentials(prev => ({
        ...prev,
        email: 'admin@company.com',
        password: 'admin123',
        otp: '123456',
        authenticatorCode: '789012'
      }));
    }
  };

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === 'admin') {
      setStep('verification');
    } else {
      try {
        await login({ email: credentials.email, password: credentials.password });
      } catch (error) {
        // Error handled in AuthProvider
      }
    }
  };

  const handleAdminVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(credentials);
    } catch (error) {
      // Error handled in AuthProvider
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
          <Tabs value={loginType} onValueChange={(value) => setLoginType(value as 'crm' | 'admin')}>
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
              

              <form onSubmit={handleInitialLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@company.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              

              {step === 'credentials' ? (
                <form onSubmit={handleInitialLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@company.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter admin password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Continue to Verification
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAdminVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Email/SMS OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={credentials.otp}
                      onChange={(e) => setCredentials(prev => ({ ...prev, otp: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authenticator">Google Authenticator Code</Label>
                    <Input
                      id="authenticator"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={credentials.authenticatorCode}
                      onChange={(e) => setCredentials(prev => ({ ...prev, authenticatorCode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep('credentials')} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify & Login'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
