'use client';

import React, { useState, useEffect } from 'react';
import {
  BellAlertIcon,
  MapPinIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneIcon,
  StopIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import toast from 'react-hot-toast';

interface EmergencySession {
  id: string;
  status: 'inactive' | 'countdown' | 'active' | 'cancelled';
  startTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notifiedContacts: string[];
}

export default function SOSPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<EmergencySession>({
    id: '',
    status: 'inactive',
    notifiedContacts: [],
  });
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // This would typically call a reverse geocoding API
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation('Location unavailable');
        }
      );
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (session.status === 'countdown' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            activateEmergency();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.status, countdown]);

  const startCountdown = () => {
    setSession({
      ...session,
      id: `sos_${Date.now()}`,
      status: 'countdown',
    });
    setCountdown(10); // 10 second countdown
    toast.success('Emergency countdown started');
  };

  const activateEmergency = () => {
    const newSession: EmergencySession = {
      ...session,
      status: 'active',
      startTime: new Date(),
      location: {
        latitude: 0, // Would be actual location
        longitude: 0,
        address: currentLocation,
      },
      notifiedContacts: user?.emergencyContacts?.map(c => c.id) || [],
    };

    setSession(newSession);
    setIsRecording(true);

    // Simulate notifying emergency contacts
    user?.emergencyContacts?.forEach(contact => {
      toast.success(`Emergency alert sent to ${contact.name}`);
    });

    // Would also call emergency services
    toast.success('Emergency services have been notified');
  };

  const cancelEmergency = () => {
    setSession({
      id: '',
      status: 'cancelled',
      notifiedContacts: [],
    });
    setCountdown(0);
    setIsRecording(false);

    // Send cancellation to all notified contacts
    toast('Emergency alert cancelled and contacts notified');

    // Reset to inactive after showing cancelled status briefly
    setTimeout(() => {
      setSession(prev => ({ ...prev, status: 'inactive' }));
    }, 3000);
  };

  const endEmergency = () => {
    setSession({
      id: '',
      status: 'inactive',
      notifiedContacts: [],
    });
    setIsRecording(false);
    toast.success('Emergency session ended');
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'countdown': return 'bg-yellow-500';
      case 'active': return 'bg-red-600';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'countdown': return `Activating in ${countdown}s`;
      case 'active': return 'EMERGENCY ACTIVE';
      case 'cancelled': return 'Emergency Cancelled';
      default: return 'Ready for Emergency';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Emergency Status */}
      <Card className={`border-2 ${session.status === 'active' ? 'border-red-500' : session.status === 'countdown' ? 'border-yellow-500' : 'border-gray-200'}`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getStatusColor()} mb-6`}>
              {session.status === 'active' ? (
                <BellAlertIcon className="w-10 h-10 text-white animate-pulse" />
              ) : session.status === 'countdown' ? (
                <span className="text-2xl font-bold text-white">{countdown}</span>
              ) : (
                <BellAlertIcon className="w-10 h-10 text-gray-600" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getStatusText()}
            </h1>

            {session.status === 'active' && session.startTime && (
              <p className="text-lg text-gray-600 mb-4">
                Started at {session.startTime.toLocaleTimeString()}
              </p>
            )}

            <div className="flex items-center justify-center text-gray-600 mb-6">
              <MapPinIcon className="w-5 h-5 mr-2" />
              <span>{currentLocation}</span>
            </div>

            {session.status === 'inactive' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  Press the emergency button below to activate SOS. You'll have 10 seconds to cancel before emergency services and your contacts are notified.
                </p>
                <Button
                  onClick={startCountdown}
                  variant="danger"
                  size="lg"
                  className="px-12 py-6 text-xl"
                >
                  <BellAlertIcon className="w-8 h-8 mr-3" />
                  ACTIVATE EMERGENCY SOS
                </Button>
              </div>
            )}

            {session.status === 'countdown' && (
              <div className="space-y-4">
                <p className="text-lg text-yellow-600 font-semibold mb-6">
                  Emergency will activate in {countdown} seconds
                </p>
                <Button
                  onClick={cancelEmergency}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4"
                >
                  <StopIcon className="w-6 h-6 mr-2" />
                  CANCEL EMERGENCY
                </Button>
              </div>
            )}

            {session.status === 'active' && (
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <Badge variant="danger" className="text-sm px-3 py-1">
                    <VideoCameraIcon className="w-4 h-4 mr-1" />
                    Recording Video
                  </Badge>
                  <Badge variant="danger" className="text-sm px-3 py-1">
                    <MicrophoneIcon className="w-4 h-4 mr-1" />
                    Recording Audio
                  </Badge>
                  <Badge variant="info" className="text-sm px-3 py-1">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    Sharing Location
                  </Badge>
                </div>

                <p className="text-red-600 font-semibold text-lg">
                  Emergency services and your contacts have been notified
                </p>

                <Button
                  onClick={endEmergency}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <StopIcon className="w-6 h-6 mr-2" />
                  END EMERGENCY
                </Button>
              </div>
            )}

            {session.status === 'cancelled' && (
              <p className="text-gray-600 text-lg">
                Emergency has been cancelled. All contacts have been notified.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Session Details (when active) */}
      {session.status === 'active' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">
                <VideoCameraIcon className="w-5 h-5 mr-2 inline" />
                Live Stream Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <VideoCameraIcon className="w-16 h-16 mx-auto mb-2 opacity-75" />
                  <p className="text-sm opacity-75">Live video feed</p>
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm">LIVE</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Live video is being streamed to your emergency contacts and a secure incident page:
                <br />
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  safyra.app/live/{session.id}
                </code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">
                <UserGroupIcon className="w-5 h-5 mr-2 inline" />
                Notified Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user?.emergencyContacts?.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-green-600">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-sm text-green-600 font-medium">Notified</span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <PhoneIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Emergency Services</p>
                      <p className="text-sm text-gray-500">911</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-sm text-blue-600 font-medium">Dispatched</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-amber-600" />
            Emergency Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">When Emergency is Active:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Stay calm and try to remain in a safe location
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Your location and live video are being shared
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Emergency services have been automatically contacted
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Your emergency contacts can see your live stream
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Important Notes:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Only use SOS for real emergencies
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  False alarms should be cancelled immediately
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Keep your emergency contacts up to date
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  Ensure your device has sufficient battery
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
