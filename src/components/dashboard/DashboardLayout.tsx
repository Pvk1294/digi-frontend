
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, Shield, User, Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Footer } from '@/components/ui/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Logo size="sm" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">CRM Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Ad Performance Reporting & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                {user?.role === 'super_admin' ? (
                  <Shield className="h-4 w-4 text-blue-600" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="font-medium truncate max-w-32">{user?.name || user?.email}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'CRM Manager'}
                </span>
              </div>
              <Button variant="outline" onClick={logout} size="sm" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile user info */}
          <div className="md:hidden pb-3 border-t border-gray-100 pt-3 mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {user?.role === 'super_admin' ? (
                <Shield className="h-4 w-4 text-blue-600" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="font-medium truncate">{user?.name || user?.email}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {user?.role === 'super_admin' ? 'Super Admin' : 'CRM Manager'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8 overflow-x-hidden">
        {children}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
