'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/providers/AuthProvider';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Logo = ({ className }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <ShieldCheckIcon className="h-8 w-8 text-safyra-gold" />
    <span className="ml-2 text-2xl font-bold text-safyra-gold">Safyra</span>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      // This would typically check your auth state
      // For now, we'll just handle it in the auth provider
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      router.push('/');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-safyra-navy flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Spline Background */}
      <div className="absolute inset-0 z-0">
        <iframe
          src='https://my.spline.design/flowingribbon-tWPCrztuM8PIDU4SaZrBPW3b/'
          frameBorder='0'
          width='100%'
          height='100%'
          title="Flowing Ribbon Background"
        />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <Logo className="h-20 w-auto" />
        </div>

        <Card className="border-safyra-gold/20 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-safyra-navy">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-safyra-navy">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-safyra-navy/30 focus:border-safyra-gold"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-safyra-navy">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-safyra-navy/30 focus:border-safyra-gold"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 text-white hover:bg-rose-600/90 transition-transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/auth/register" className="text-sm text-safyra-navy hover:text-safyra-gold">
                Don't have an account? Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
