'use client';

import React, { useState, useEffect } from 'react';
import {
  BellAlertIcon,
  ShieldCheckIcon,
  MapPinIcon,
  Battery100Icon as BatteryIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';

interface QuickStat {
  name: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface RecentIncident {
  id: string;
  type: string;
  timestamp: Date;
  status: 'resolved' | 'active' | 'false_alarm';
  location: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const quickStats: QuickStat[] = [
    { name: 'Active Devices', value: '1', icon: ShieldCheckIcon, color: 'text-green-600' },
    { name: 'Emergency Contacts', value: user?.emergencyContacts?.length?.toString() || '2', icon: UserGroupIcon, color: 'text-blue-600' },
    { name: 'Recent Alerts', value: '0', icon: BellAlertIcon, color: 'text-yellow-600' },
    { name: 'Response Time', value: '< 30s', icon: ClockIcon, color: 'text-purple-600' },
  ];

  const recentIncidents: RecentIncident[] = [
    {
      id: '1',
      type: 'Test Alert',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      status: 'resolved',
      location: 'Home - 123 Main St',
    },
    {
      id: '2',
      type: 'Device Check',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
      status: 'resolved',
      location: 'Work - Downtown Office',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'danger';
      case 'resolved': return 'success';
      case 'false_alarm': return 'warning';
      default: return 'default';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name}!</h1>
            <p className="text-rose-100">
              Your safety devices are active and monitoring. Current time: {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium">All Systems Operational</span>
            </div>
            <Link href="/dashboard/sos">
              <Button variant="secondary" className="bg-white text-rose-600 hover:bg-gray-100">
                <BellAlertIcon className="w-5 h-5 mr-2" />
                Emergency SOS
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-rose-600" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.devices?.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                    <ShieldCheckIcon className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <p className="text-sm text-gray-500">{device.serialNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={device.status === 'active' ? 'success' : 'warning'}>
                    {device.status}
                  </Badge>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <BatteryIcon className="w-4 h-4 mr-1" />
                    {device.batteryLevel}%
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No devices connected</p>
                <Link href="/dashboard/devices">
                  <Button variant="outline" className="mt-2">
                    Add Device
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2 text-rose-600" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.emergencyContacts?.slice(0, 3).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-600">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.relationship}</p>
                    </div>
                  </div>
                  <Badge variant={contact.priority === 0 ? 'danger' : 'default'}>
                    Priority {contact.priority}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-6">
                  <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No emergency contacts added</p>
                  <Link href="/dashboard/contacts">
                    <Button variant="outline">
                      Add Contacts
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            {user?.emergencyContacts && user.emergencyContacts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/dashboard/contacts">
                  <Button variant="ghost" className="w-full">
                    View All Contacts
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-rose-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentIncidents.length > 0 ? (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <BellAlertIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{incident.type}</p>
                      <p className="text-sm text-gray-500">{incident.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(incident.status) as any}>
                      {incident.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatRelativeTime(incident.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No recent activity</p>
              <p className="text-sm text-gray-400">
                When incidents occur, they'll appear here for quick review
              </p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/dashboard/history">
              <Button variant="ghost" className="w-full">
                View Full History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/sos">
              <Button variant="danger" className="w-full h-16 flex flex-col items-center justify-center">
                <BellAlertIcon className="w-6 h-6 mb-1" />
                <span className="text-sm">Emergency SOS</span>
              </Button>
            </Link>
            <Link href="/dashboard/devices">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 mb-1" />
                <span className="text-sm">Check Devices</span>
              </Button>
            </Link>
            <Link href="/dashboard/contacts">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <UserGroupIcon className="w-6 h-6 mb-1" />
                <span className="text-sm">Manage Contacts</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 mb-1" />
                <span className="text-sm">Test Alert</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
