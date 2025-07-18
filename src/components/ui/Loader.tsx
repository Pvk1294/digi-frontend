
import React from 'react';
import { Logo } from './Logo';

interface LoaderProps {
  message?: string;
}

export const Loader = ({ message = 'Loading...' }: LoaderProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};
