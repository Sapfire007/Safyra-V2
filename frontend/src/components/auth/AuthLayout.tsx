import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-12 w-12 text-white" />
              <span className="ml-3 text-4xl font-bold">Safyra</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Your Safety, Our Priority
            </h2>
            <p className="text-xl text-rose-100 leading-relaxed">
              Advanced personal safety technology designed to protect and empower women everywhere.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              <span className="text-rose-100">Real-time weapon detection</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              <span className="text-rose-100">Live video streaming to contacts</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              <span className="text-rose-100">Automated emergency response</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16" />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-rose-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Safyra</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
