
import React from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MainDashboard } from '@/components/MainDashboard';
import { Loader } from '@/components/ui/Loader';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <DashboardLayout>
      <MainDashboard />
    </DashboardLayout>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
