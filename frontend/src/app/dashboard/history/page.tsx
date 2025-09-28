'use client';

import React, { useState } from 'react';
import {
  ClockIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  EyeIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';

interface HistoryIncident {
  id: string;
  type: 'weapon_detected' | 'panic_button' | 'fall_detection' | 'test_alert';
  status: 'resolved' | 'false_alarm' | 'active';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location: string;
  responseTime: number; // in seconds
  responders: number;
  description: string;
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const mockIncidents: HistoryIncident[] = [
    {
      id: 'inc_1',
      type: 'test_alert',
      status: 'resolved',
      severity: 'low',
      timestamp: new Date(2024, 11, 25, 14, 30),
      location: 'Home - 123 Main St',
      responseTime: 15,
      responders: 2,
      description: 'Monthly system test - all systems operational',
    },
    {
      id: 'inc_2',
      type: 'panic_button',
      status: 'false_alarm',
      severity: 'high',
      timestamp: new Date(2024, 11, 20, 22, 15),
      location: 'Downtown Office',
      responseTime: 45,
      responders: 4,
      description: 'Accidental activation - cancelled within 30 seconds',
    },
    {
      id: 'inc_3',
      type: 'weapon_detected',
      status: 'resolved',
      severity: 'critical',
      timestamp: new Date(2024, 11, 15, 18, 45),
      location: 'University Campus',
      responseTime: 120,
      responders: 8,
      description: 'Weapon detected on campus - security responded immediately',
    },
    {
      id: 'inc_4',
      type: 'fall_detection',
      status: 'resolved',
      severity: 'medium',
      timestamp: new Date(2024, 11, 10, 9, 20),
      location: 'Gym - Fitness Center',
      responseTime: 90,
      responders: 3,
      description: 'Fall detected during workout - minor injury, medical assistance provided',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon_detected': return ExclamationTriangleIcon;
      case 'panic_button': return BellAlertIcon;
      case 'fall_detection': return ExclamationTriangleIcon;
      case 'test_alert': return CheckCircleIcon;
      default: return ClockIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weapon_detected': return 'text-red-600 bg-red-100';
      case 'panic_button': return 'text-yellow-600 bg-yellow-100';
      case 'fall_detection': return 'text-orange-600 bg-orange-100';
      case 'test_alert': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'false_alarm': return 'warning';
      case 'active': return 'danger';
      default: return 'default';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const filteredIncidents = mockIncidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.type.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and review all your safety incidents and alerts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Incidents</dt>
                  <dd className="text-lg font-semibold text-gray-900">{mockIncidents.length}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {mockIncidents.filter(i => i.status === 'resolved').length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">False Alarms</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {mockIncidents.filter(i => i.status === 'false_alarm').length}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Response</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatDuration(Math.round(mockIncidents.reduce((acc, i) => acc + i.responseTime, 0) / mockIncidents.length))}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="all">All Statuses</option>
                <option value="resolved">Resolved</option>
                <option value="false_alarm">False Alarm</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents ({filteredIncidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || severityFilter !== 'all'
                    ? 'Try adjusting your filters to see more results'
                    : 'No incidents have been recorded yet'
                  }
                </p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const IconComponent = getTypeIcon(incident.type);
                return (
                  <div
                    key={incident.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${getTypeColor(incident.type)}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {incident.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <Badge variant={getStatusVariant(incident.status) as any}>
                              {incident.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getSeverityVariant(incident.severity) as any}>
                              {incident.severity}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mb-3">{incident.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-500">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {incident.timestamp.toLocaleString()}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {incident.location}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Response: {formatDuration(incident.responseTime)}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <EyeIcon className="w-4 h-4 mr-1" />
                              {incident.responders} responders
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        <Link href={`/live/${incident.id}`}>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
