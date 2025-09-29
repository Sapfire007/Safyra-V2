'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  VideoCameraIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  PlayIcon,
  StopIcon,
  CameraIcon,
  Battery100Icon as BatteryIcon,
  WifiIcon,
  ClockIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

interface CameraStatus {
  monitoring: boolean;
  camera_connected: boolean;
  weapon_detected: boolean;
  detection_duration: number;
}

interface WeaponDetection {
  class: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface WeaponAlert {
  timestamp: string;
  alert_type: string;
  duration_seconds: number;
  detections: WeaponDetection[];
  detection_count: number;
  threshold_seconds: number;
}

interface LiveDetection {
  detected: boolean;
  duration: number;
  detections?: WeaponDetection[];
  count?: number;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function DevicesPage() {
  const { user } = useAuth();
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    monitoring: false,
    camera_connected: false,
    weapon_detected: false,
    detection_duration: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<WeaponAlert[]>([]);
  const [liveDetection, setLiveDetection] = useState<LiveDetection | null>(null);
  const [alertsSummary, setAlertsSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState(0);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const videoRef = useRef<HTMLImageElement>(null);
  const monitoringRef = useRef(cameraStatus.monitoring);

  useEffect(() => {
    monitoringRef.current = cameraStatus.monitoring;
  }, [cameraStatus.monitoring]);

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to weapon detection system');
    });

    socketRef.current.on('weapon_detection', (data: LiveDetection) => {
      setLiveDetection(data);
      console.log('Detection update:', data);
      if (data.detected && data.duration > 0) {
        setCameraStatus(prev => ({
          ...prev,
          weapon_detected: true,
          detection_duration: data.duration,
        }));
      } else {
        setCameraStatus(prev => ({
          ...prev,
          weapon_detected: false,
          detection_duration: 0,
        }));
      }
    });

    socketRef.current.on('weapon_alert', (alert: WeaponAlert) => {
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      toast.error(`⚠️ WEAPON DETECTED: ${alert.detection_count} weapon(s) detected for ${alert.duration_seconds}s`);
    });

    socketRef.current.on('status', (status: CameraStatus) => {
      setCameraStatus(status);
    });

    socketRef.current.on('recording_started', (data: any) => {
      toast.success(`📹 Recording started: ${data.filename}`);
      loadRecordings(); // Refresh recordings list
    });

    socketRef.current.on('recording_stopped', (data: any) => {
      toast.success(`📹 Recording saved: ${data.filename}`);
      loadRecordings(); // Refresh recordings list
    });

    // Load initial data
    loadCameraStatus();
    loadRecentAlerts();
    loadAlertsSummary();
    loadRecordings();
    testBackendConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Update video stream when monitoring starts
    if (cameraStatus.monitoring && videoRef.current) {
      const streamUrl = `${BACKEND_URL}/camera/stream?t=${Date.now()}`;
      console.log('Setting video stream URL:', streamUrl);

      videoRef.current.onloadstart = () => {
        console.log('Video stream loading started');
      };

      videoRef.current.onloadeddata = () => {
        console.log('Video stream loaded successfully');
      };

      videoRef.current.onerror = (e) => {
        if (!monitoringRef.current) return; // Ignore errors if monitoring is stopped
        console.error('Video stream error:', e);
        toast.error('Failed to load video stream. Check camera connection.');
      };

      videoRef.current.src = streamUrl;
    } else if (videoRef.current) {
      videoRef.current.src = '';
    }
  }, [cameraStatus.monitoring]);

  // Auto-refresh recordings every 30 seconds when monitoring
  useEffect(() => {
    if (cameraStatus.monitoring) {
      const interval = setInterval(loadRecordings, 30000);
      return () => clearInterval(interval);
    }
  }, [cameraStatus.monitoring]);

  const loadCameraStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/camera/status`);
      const data = await response.json();
      if (data.success) {
        setCameraStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load camera status:', error);
    }
  };

  const loadRecentAlerts = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const response = await fetch(`${BACKEND_URL}/logs/weapon-alerts?date=${today}`);
      const data = await response.json();
      if (data.success) {
        setRecentAlerts(data.alerts.slice(-10).reverse()); // Last 10 alerts, most recent first
      }
    } catch (error) {
      console.error('Failed to load recent alerts:', error);
    }
  };

  const loadAlertsSummary = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/logs/weapon-alerts/summary`);
      const data = await response.json();
      if (data.success) {
        setAlertsSummary(data);
      }
    } catch (error) {
      console.error('Failed to load alerts summary:', error);
    }
  };

  const loadRecordings = async () => {
    try {
      console.log('Loading recordings...');
      const response = await fetch(`${BACKEND_URL}/recordings?t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        setRecordings(data.recordings);
        console.log('Recordings loaded:', data.recordings.length);
      } else {
        console.error('Failed to load recordings:', data.error);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
      toast.error('Failed to load recordings');
    }
  };

  const downloadRecording = (filename: string) => {
    const downloadUrl = `${BACKEND_URL}/recordings/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Recording download started');
  };

  const deleteRecording = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/recordings/delete/${filename}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Recording deleted successfully');
        loadRecordings(); // Refresh list
      } else {
        toast.error('Failed to delete recording');
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setBackendHealth(data);
        console.log('Backend health:', data);
      } else {
        setBackendHealth({ status: 'error', message: `Backend returned status ${response.status}` });
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      setBackendHealth({ status: 'error', message: 'Connection failed' });
    }
  };

  const startMonitoring = async () => {
    setIsLoading(true);
    try {
      console.log(`Starting camera monitoring on camera ${selectedCamera}...`);
      const response = await fetch(`${BACKEND_URL}/camera/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ camera_index: selectedCamera }),
      });

      const data = await response.json();
      console.log('Camera start response:', data);

      if (data.success) {
        setCameraStatus(data.status);
        toast.success('Camera monitoring started successfully');

        const url = `${BACKEND_URL}/camera/stream?t=${Date.now()}&r=${Math.random()}`;
        setStreamUrl(url);
        setStreamError(null);
      } else {
        toast.error(data.error || 'Failed to start monitoring');
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMonitoring = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/camera/stop`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setCameraStatus(data.status);
        setLiveDetection(null);
        toast.success('Camera monitoring stopped');

        setStreamUrl(null);
        setStreamError(null);
        if (videoRef.current) {
          videoRef.current.src = '';
        }
      } else {
        toast.error(data.error || 'Failed to stop monitoring');
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDetectionColor = (weaponClass: string) => {
    switch (weaponClass.toLowerCase()) {
      case 'gun': case 'pistol': return 'text-red-600 bg-red-100';
      case 'knife': return 'text-orange-600 bg-orange-100';
      case 'rifle': return 'text-red-700 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'WEAPON_DETECTED': return ExclamationTriangleIcon;
      case 'THRESHOLD_REACHED': return BellAlertIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/`);
      const result = await response.json();
      if (result.status === 'healthy') {
        toast.success('Backend connection successful!');
        setBackendHealth(result);
        return true;
      } else {
        toast.error('Backend is not healthy');
        return false;
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Cannot connect to backend service');
      return false;
    }
  };

  const refreshVideoStream = () => {
    if (cameraStatus.monitoring && streamUrl) {
      const newUrl = `${BACKEND_URL}/camera/stream?refresh=${Date.now()}&r=${Math.random()}`;
      console.log('Refreshing video stream:', newUrl);
      setStreamUrl(newUrl);
      setStreamError(null);
      toast.success('Video stream refreshed');
    } else {
      toast.error('Camera monitoring must be active to refresh stream');
    }
  };

  const suppressVideoErrors = (e: any) => {
    e.preventDefault(); // Suppress the error event
    console.warn('Video error suppressed:', e);
  };

  // Updated videoRef error handling
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onerror = suppressVideoErrors;
    }
  }, [videoRef]);

  const supportedVideoFormats = ['video/mp4', 'video/webm', 'video/ogg'];

  const renderVideoPlayer = (src: string) => (
    <video
      controls
      className="w-full h-auto"
      src={src}
      onError={(e) => {
        console.error('Video playback error:', e);
        toast.error('Unsupported video format or MIME type.');
      }}
    >
      {supportedVideoFormats.map((type) => (
        <source key={type} src={src} type={type} />
      ))}
      Your browser does not support the video tag.
    </video>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your Safyra devices and live camera feeds with AI weapon detection
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge
            variant={cameraStatus.monitoring ? 'success' : 'default'}
            className="px-3 py-1"
          >
            {cameraStatus.monitoring ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                LIVE MONITORING
              </>
            ) : (
              'OFFLINE'
            )}
          </Badge>
        </div>
      </div>

      {/* Live Camera Feed */}
      <Card className={`border-2 ${cameraStatus.weapon_detected ? 'border-red-500 shadow-red-200 shadow-lg' : cameraStatus.monitoring ? 'border-green-500' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <VideoCameraIcon className="w-5 h-5 mr-2 text-rose-600" />
              Live Camera Feed with Weapon Detection
            </div>
            <div className="flex items-center space-x-2">
              {cameraStatus.weapon_detected && (
                <Badge variant="danger" className="animate-pulse">
                  ⚠️ WEAPON DETECTED - {formatDuration(cameraStatus.detection_duration)}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Camera Source
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(parseInt(e.target.value))}
                    disabled={cameraStatus.monitoring}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-gray-100"
                  >
                    <option value={0}>Camera 0 (Default)</option>
                    <option value={1}>Camera 1</option>
                    <option value={2}>Camera 2</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <div className="flex items-center mt-1">
                    <div className={`w-3 h-3 rounded-full mr-2 ${cameraStatus.camera_connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className={`text-sm ${cameraStatus.camera_connected ? 'text-green-600' : 'text-red-600'}`}>
                      {cameraStatus.camera_connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={testBackendConnection}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Test Connection
                </Button>
                {cameraStatus.monitoring && (
                  <Button
                    onClick={refreshVideoStream}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Refresh Video
                  </Button>
                )}
                {!cameraStatus.monitoring ? (
                  <Button
                    onClick={startMonitoring}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    {isLoading ? 'Starting...' : 'Start Monitoring'}
                  </Button>
                ) : (
                  <Button
                    onClick={stopMonitoring}
                    disabled={isLoading}
                    variant="danger"
                  >
                    <StopIcon className="w-4 h-4 mr-2" />
                    {isLoading ? 'Stopping...' : 'Stop Monitoring'}
                  </Button>
                )}
              </div>
            </div>

            {/* Video Stream */}
            <div className="relative">
              <div className={`bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden ${cameraStatus.weapon_detected ? 'ring-4 ring-red-500 ring-opacity-50' : ''}`}>
                {cameraStatus.monitoring ? (
                  <>
                    {streamUrl ? (
                      <img
                        ref={videoRef}
                        key={streamUrl} // Force re-render on URL change
                        src={`${streamUrl}&cache=${Date.now()}`}
                        alt="Live camera feed"
                        className="w-full h-full object-contain"
                        style={{
                          imageRendering: 'auto',
                          objectFit: 'contain'
                        }}
                        onLoad={() => {
                          console.log('Video stream loaded successfully:', streamUrl);
                          setStreamError(null);
                        }}
                        onError={(e) => {
                          if (!monitoringRef.current) return; // Ignore errors if monitoring is stopped
                          console.error('Video stream error:', e, 'URL:', streamUrl);
                          setStreamError('Failed to load video stream');
                          // Retry with new URL after delay
                          setTimeout(() => {
                            const retryUrl = `${BACKEND_URL}/camera/stream?retry=${Date.now()}&r=${Math.random()}`;
                            setStreamUrl(retryUrl);
                          }, 2000);
                          toast.error('Video stream failed. Retrying...');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {streamError ? (
                          <div className="text-center">
                            <XMarkIcon className="w-12 h-12 mx-auto mb-2 text-red-500" />
                            <p className="text-sm">{streamError}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 border-4 border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm">Loading video stream...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live indicator */}
                    <div className="absolute top-4 left-4 flex items-center bg-red-600 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE AI DETECTION</span>
                    </div>

                    {/* Detection status */}
                    {liveDetection && (
                      <div className="absolute top-4 right-4 space-y-2">
                        {liveDetection.detected ? (
                          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                            ⚠️ {liveDetection.count} WEAPON(S) - {formatDuration(liveDetection.duration)}
                          </div>
                        ) : (
                          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ✓ SECURE - NO THREATS
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detection overlay info */}
                    {liveDetection?.detected && liveDetection.detections && (
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg max-w-xs">
                        <h4 className="text-sm font-bold mb-2">Active Detections:</h4>
                        {liveDetection.detections.slice(0, 3).map((detection, idx) => (
                          <div key={idx} className="text-xs mb-1">
                            <span className="capitalize font-medium">{detection.class}</span>
                            <span className="text-gray-300"> - {(detection.confidence * 100).toFixed(1)}% confidence</span>
                          </div>
                        ))}
                        {liveDetection.detections.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{liveDetection.detections.length - 3} more...
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-white">
                    <CameraIcon className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium opacity-75">Camera Feed Offline</p>
                    <p className="text-sm opacity-50">Click "Start Monitoring" to begin live detection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Stats & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
              Detection Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {alertsSummary?.total_alerts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Alerts (7 days)</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {cameraStatus.monitoring ? '00:00' : '--:--'}
                  </div>
                  <div className="text-sm text-gray-600">Current Session</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Model Accuracy</span>
                  <span className="font-medium">95.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '95.2%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Detection Speed</span>
                  <span className="font-medium">33ms avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellAlertIcon className="w-5 h-5 mr-2 text-amber-600" />
              Recent Weapon Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8">
                <ShieldCheckIcon className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-green-600 font-medium">No recent alerts</p>
                <p className="text-sm text-gray-500">Your space is secure</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentAlerts.map((alert, index) => {
                  const IconComponent = getAlertIcon(alert.alert_type);
                  return (
                    <div
                      key={`${alert.timestamp}-${index}`}
                      className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <IconComponent className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {alert.detection_count} weapon(s) detected
                            </span>
                            <Badge variant="danger" className="text-xs">
                              {formatDuration(alert.duration_seconds)}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {alert.detections.slice(0, 2).map((detection, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${getDetectionColor(detection.class)}`}
                              >
                                {detection.class} ({(detection.confidence * 100).toFixed(0)}%)
                              </span>
                            ))}
                            {alert.detections.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{alert.detections.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health & Troubleshooting
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cog6ToothIcon className="w-5 h-5 mr-2 text-blue-600" />
            System Health & Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Backend Connection</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  backendHealth?.status === 'healthy' ? 'bg-green-400' :
                  backendHealth?.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {backendHealth?.status === 'healthy' ? 'Connected' :
                   backendHealth?.status === 'error' ? 'Failed' : 'Testing...'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {backendHealth?.message || `Flask server at ${BACKEND_URL}`}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">AI Model Status</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  backendHealth?.model_loaded ? 'bg-green-400' :
                  backendHealth?.status === 'healthy' && backendHealth?.model_loaded === false ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {backendHealth?.model_loaded ? 'Loaded' :
                   backendHealth?.status === 'healthy' && backendHealth?.model_loaded === false ? 'Failed' : 'Loading...'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">YOLO weapon detection model</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Camera Hardware</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${cameraStatus.camera_connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {cameraStatus.camera_connected ? 'Ready' : 'Not detected'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Camera index: {selectedCamera}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">🔧 Common Issues & Solutions</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <div>
                  <strong>Backend not running:</strong> Start the Python server with <code className="bg-gray-200 px-1 rounded">python app.py</code> in the backend directory
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <div>
                  <strong>Camera not found:</strong> Check camera connections, try different camera indices (0, 1, 2), or close other camera applications
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <div>
                  <strong>Model loading failed:</strong> Ensure <code className="bg-gray-200 px-1 rounded">best.pt</code> model file exists in the Hardware-utilities/weapon/model/ directory
                </div>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <div>
                  <strong>Permission denied:</strong> Grant camera permissions to your browser and ensure the backend has camera access
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Hardware Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-rose-600" />
            Registered Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.devices && user.devices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-6 h-6 text-rose-600" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <Badge variant={device.status === 'active' ? 'success' : 'warning'}>
                          {device.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{device.serialNumber}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                        <div className="flex items-center">
                          <BatteryIcon className="w-3 h-3 mr-1" />
                          {device.batteryLevel}%
                        </div>
                        <div className="flex items-center">
                          <WifiIcon className="w-3 h-3 mr-1" />
                          Connected
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(device.lastSeen).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Cog6ToothIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No devices registered</h3>
              <p className="text-gray-500 mb-4">
                Connect your Safyra hardware devices to monitor them here
              </p>
              <Button variant="outline">
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recorded Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <VideoCameraIcon className="w-5 h-5 mr-2 text-rose-600" />
              Emergency Recordings ({recordings.length})
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecordings}
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length > 0 ? (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.filename}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <VideoCameraIcon className="w-6 h-6 text-red-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {recording.filename.replace('weapon_alert_', '').replace('.mp4', '')}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {new Date(recording.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <DocumentIcon className="w-4 h-4 mr-1" />
                          {formatFileSize(recording.file_size)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecording(recording.filename)}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadRecording(recording.filename)}
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecording(recording.filename)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings available</h3>
              <p className="text-gray-500 mb-4">
                Emergency recordings will appear here when weapon alerts are triggered and cross the threshold duration
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">How it works:</p>
                <p>
                  When weapon detection is active for more than 5 seconds,
                  the system automatically starts recording video evidence with weapon detection annotations.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Preview Modal */}
      {selectedRecording && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recording Preview</h3>
              <button
                onClick={() => setSelectedRecording(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                <video
                  controls
                  className="w-full h-auto"
                  preload="auto"
                  controlsList="nodownload"
                  onLoadStart={() => console.log('Video loading started')}
                  onLoadedData={() => console.log('Video loaded successfully')}
                  onError={(e) => {
                    console.error('Video error:', e);
                    toast.error('Cannot play this video format. Try downloading to view locally.');
                  }}
                >
                  <source
                    src={`${BACKEND_URL}/recordings/download/${selectedRecording}?play=1`}
                    type="video/mp4; codecs=avc1.42E01E,mp4a.40.2"
                  />
                  {/* Fallback message */}
                  <div className="text-white text-center py-8">
                    <p>Your browser cannot play this video.</p>
                    <p className="text-sm text-gray-300 mt-2">
                      Try downloading the file or use a different browser.
                    </p>
                  </div>
                </video>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>File:</strong> {selectedRecording}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Size:</strong> {formatFileSize(recordings.find(r => r.filename === selectedRecording)?.file_size || 0)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => downloadRecording(selectedRecording)}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedRecording(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
