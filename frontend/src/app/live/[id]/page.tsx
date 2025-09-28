'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  VideoCameraIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  UserIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface IncidentData {
  id: string;
  userId: string;
  userName: string;
  status: 'active' | 'resolved';
  startTime: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  metadata: {
    deviceId: string;
    ipAddress: string;
    userAgent: string;
  };
  viewers: Array<{
    id: string;
    name: string;
    type: 'emergency_contact' | 'emergency_service';
    joinedAt: Date;
  }>;
}

export default function LiveIncidentPage() {
  const params = useParams();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isViewerAuthorized, setIsViewerAuthorized] = useState(false);
  const [viewerInfo, setViewerInfo] = useState<{ name: string; type: string } | null>(null);

  useEffect(() => {
    // Simulate loading incident data
    const mockIncident: IncidentData = {
      id: incidentId,
      userId: 'user123',
      userName: 'Sarah Johnson',
      status: 'active',
      startTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main Street, New York, NY 10001',
      },
      metadata: {
        deviceId: 'SFR-001-ABC123',
        ipAddress: '192.168.1.100',
        userAgent: 'Safyra Mobile App v2.1.0',
      },
      viewers: [
        {
          id: '1',
          name: 'John Johnson (Spouse)',
          type: 'emergency_contact',
          joinedAt: new Date(Date.now() - 1000 * 60 * 3),
        },
        {
          id: '2',
          name: 'NYPD Emergency Response',
          type: 'emergency_service',
          joinedAt: new Date(Date.now() - 1000 * 60 * 2),
        },
      ],
    };

    setIncident(mockIncident);

    // Simulate viewer authorization check
    setTimeout(() => {
      setIsViewerAuthorized(true);
      setViewerInfo({ name: 'Emergency Responder', type: 'Emergency Service' });
    }, 1000);

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [incidentId]);

  const formatDuration = (startTime: Date, currentTime: Date) => {
    const diff = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency session...</p>
        </div>
      </div>
    );
  }

  if (!isViewerAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Access
            </h2>
            <p className="text-gray-600">
              Checking authorization to view this emergency session...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-rose-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Emergency Session</h1>
                <p className="text-sm text-gray-500">ID: {incident.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={incident.status === 'active' ? 'danger' : 'success'} className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  incident.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                {incident.status === 'active' ? 'LIVE' : 'RESOLVED'}
              </Badge>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Duration: {formatDuration(incident.startTime, currentTime)}
                </p>
                <p className="text-xs text-gray-500">
                  Started: {incident.startTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="bg-black rounded-t-lg aspect-video flex items-center justify-center relative">
                  <div className="text-center text-white">
                    <VideoCameraIcon className="w-20 h-20 mx-auto mb-4 opacity-75" />
                    <p className="text-lg font-medium opacity-75">Live Video Stream</p>
                    <p className="text-sm opacity-60">Emergency situation in progress</p>
                  </div>

                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE</span>
                  </div>

                  {/* Duration */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">
                      {formatDuration(incident.startTime, currentTime)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="danger" className="text-xs">
                        <VideoCameraIcon className="w-3 h-3 mr-1" />
                        Video Active
                      </Badge>
                      <Badge variant="danger" className="text-xs">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                        Audio Active
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Viewing as: <span className="font-medium">{viewerInfo?.name}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-rose-600" />
                  Live Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
                  <div className="text-center text-gray-500">
                    <MapPinIcon className="w-16 h-16 mx-auto mb-2" />
                    <p className="font-medium">Interactive Map</p>
                    <p className="text-sm">Real-time location tracking</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{incident.location.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-sm">
                      {incident.location.latitude}, {incident.location.longitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="text-green-600 font-medium">Live</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-amber-600" />
                  Incident Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="text-gray-900">{incident.userName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Start Time</label>
                  <p className="text-gray-900">{incident.startTime.toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={incident.status === 'active' ? 'danger' : 'success'}>
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ComputerDesktopIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Device ID</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {incident.metadata.deviceId}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {incident.metadata.ipAddress}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">User Agent</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {incident.metadata.userAgent}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Session ID</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                    {incident.id}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Viewers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                  Active Viewers ({incident.viewers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incident.viewers.map((viewer) => (
                    <div key={viewer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          viewer.type === 'emergency_service' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {viewer.type === 'emergency_service' ? (
                            <PhoneIcon className={`w-4 h-4 text-blue-600`} />
                          ) : (
                            <UserIcon className={`w-4 h-4 text-green-600`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{viewer.name}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(viewer.joinedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Emergency Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="danger" className="w-full" size="sm">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Call Emergency Services
                </Button>

                <Button variant="outline" className="w-full" size="sm">
                  <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                  Contact User
                </Button>

                <Button variant="outline" className="w-full" size="sm">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  View Incident History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
