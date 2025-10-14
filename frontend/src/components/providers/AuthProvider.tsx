'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // TODO: Replace with actual API call
        const userData = localStorage.getItem('safyra_user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        name: 'Aadhya Sharma',
        phone: '+91 9336974023',
        emergencyContacts: [
          {
            id: '1',
            name: 'Chatur Sharma',
            phone: '+91 7400740423',
            email: 'john@example.com',
            relationship: 'Spouse',
            priority: 1,
          },
          {
            id: '2',
            name: 'Emergency Services',
            phone: '100',
            email: 'emergency@city.gov',
            relationship: 'Emergency',
            priority: 0,
          },
        ],
        devices: [
          {
            id: '1',
            name: 'Safyra Wearable',
            type: 'wearable',
            status: 'active',
            batteryLevel: 85,
            lastSeen: new Date(),
            serialNumber: 'SFR-001-ABC123',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem('safyra_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        emergencyContacts: [],
        devices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorage.setItem('safyra_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('safyra_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
