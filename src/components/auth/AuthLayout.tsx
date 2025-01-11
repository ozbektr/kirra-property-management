import React from 'react';
import { Building } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex items-center justify-center">
            <Building className="h-12 w-12 text-primary-400" />
            <span className="ml-3 text-3xl font-bold text-white">Kirra</span>
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1973&q=80"
          alt="Modern apartment interior"
        />
        <div className="absolute inset-0 bg-dark-900/30 mix-blend-multiply" />
      </div>
    </div>
  );
};

export default AuthLayout;