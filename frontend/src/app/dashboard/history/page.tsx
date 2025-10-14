'use client';

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MicrophoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { fetchIncidentHistory, getIncidentStats, IncidentHistory } from '../../../lib/incidentService';
import { historyUpdateManager } from '../../../lib/historyManager';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [incidents, setIncidents] = useState<IncidentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Function to load incidents
  const loadIncidents = async () => {
    try {
      setLoading(true);
      console.log('Loading incidents...');
      const data = await fetchIncidentHistory();
      console.log('Loaded incidents:', data.length);
      setIncidents(data);
      setStats(getIncidentStats(data));
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Failed to load incident history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch incidents on component mount and listen for updates
  useEffect(() => {
    loadIncidents();

    // Subscribe to history updates
    const unsubscribe = historyUpdateManager.subscribe(() => {
      console.log('History update triggered, reloading incidents...');
      loadIncidents();
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon_detected': return ExclamationTriangleIcon;
      case 'sos_call': return MicrophoneIcon;
      default: return ClockIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weapon_detected': return 'text-red-600 bg-red-100';
      case 'sos_call': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'active': return 'danger';
      case 'investigating': return 'warning';
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

  const filteredIncidents = incidents.filter((incident: IncidentHistory) => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.type.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });



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
                  <dd className="text-lg font-semibold text-gray-900">{stats?.total || 0}</dd>
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
                    {stats?.resolved || 0}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Weapon Alerts</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.weaponDetections || 0}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">SOS Calls</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats?.sosCalls || 0}
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Button
                onClick={loadIncidents}
                variant="outline"
                className="w-full"
              >
                Refresh
              </Button>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="all">All Statuses</option>
                <option value="resolved">Resolved</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
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
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safyra-gold mx-auto mb-4"></div>
                <p className="text-gray-500">Loading incident history...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
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
              filteredIncidents.map((incident: IncidentHistory) => {
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
                              {incident.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </h3>
                            <Badge variant={getStatusVariant(incident.status) as any}>
                              {incident.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getSeverityVariant(incident.severity) as any}>
                              {incident.severity}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mb-3">{incident.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center text-gray-500">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {incident.timestamp.toLocaleString()}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {incident.location}
                            </div>
                            {incident.recordingFile && (
                              <div className="flex items-center text-gray-500">
                                {incident.type === 'weapon_detected' ? (
                                  <VideoCameraIcon className="w-4 h-4 mr-1" />
                                ) : (
                                  <MicrophoneIcon className="w-4 h-4 mr-1" />
                                )}
                                Recording Available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4 space-x-2">
                        <Link href={`/dashboard/history/${incident.id}`}>
                          <Button variant="outline" size="sm">
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
