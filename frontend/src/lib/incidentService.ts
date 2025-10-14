import { getLocalSOSRecordings, LocalSOSCall } from './sosStorageService';
import { triggerHistoryRefresh } from './historyManager';

// Service to fetch incident history from various sources
export interface WeaponDetection {
  class: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface WeaponAlert {
  timestamp: string;
  alert_type: string; // Changed from literal 'WEAPON_DETECTED' to string for compatibility
  duration_seconds: number;
  detections: WeaponDetection[];
  detection_count: number;
  threshold_seconds: number;
  recording_filename?: string;
  recording_started?: boolean;
}

export interface SOSCall {
  timestamp: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  location: string;
  file: string;
}

export interface IncidentHistory {
  id: string;
  type: 'weapon_detected' | 'sos_call';
  status: 'resolved' | 'active' | 'investigating';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location: string;
  description: string;
  details: WeaponAlert | SOSCall;
  recordingFile?: string;
}

// Mock API base URL - in production this would be your backend API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetch weapon detection alerts
export const fetchWeaponAlerts = async (): Promise<WeaponAlert[]> => {
  try {
    // In a real implementation, this would fetch from your backend API
    // For now, we'll simulate fetching the recent logs
    const response = await fetch(`${API_BASE}/api/weapon-alerts`);
    if (!response.ok) {
      console.warn('Weapon alerts API not available, using fallback data');
      throw new Error('API not available');
    }
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Weapon alerts API not available, using mock data:', errorMessage);

    // Fallback to mock data based on the log structure we saw
    return [
      {
        timestamp: '2025-09-29T01:52:48.272508',
        alert_type: 'WEAPON_DETECTED',
        duration_seconds: 5.47,
        detections: [{
          class: 'knife',
          confidence: 0.7696118950843811,
          bbox: { x1: 308.34, y1: 84.52, x2: 493.80, y2: 377.21 }
        }],
        detection_count: 1,
        threshold_seconds: 5.0,
        recording_filename: 'weapon_alert_20250929_015242_188_bff2a2d8.mp4',
        recording_started: true
      },
      {
        timestamp: '2025-09-29T01:41:33.539362',
        alert_type: 'WEAPON_DETECTED',
        duration_seconds: 5.49,
        detections: [{
          class: 'knife',
          confidence: 0.8064008355140686,
          bbox: { x1: 207.16, y1: 132.63, x2: 381.63, y2: 325.00 }
        }],
        detection_count: 1,
        threshold_seconds: 5.0,
        recording_filename: 'weapon_alert_20250929_014127_955_695f6250.mp4',
        recording_started: true
      },
      {
        timestamp: '2025-09-29T01:37:07.269253',
        alert_type: 'WEAPON_DETECTED',
        duration_seconds: 5.4,
        detections: [{
          class: 'knife',
          confidence: 0.823668897151947,
          bbox: { x1: 179.19, y1: 140.10, x2: 411.69, y2: 388.60 }
        }],
        detection_count: 1,
        threshold_seconds: 5.0,
        recording_filename: 'weapon_alert_20250929_013702_099_c1dd336b.mp4',
        recording_started: true
      }
    ];
  }
};

// Fetch device alerts from backend
export const fetchDeviceAlerts = async (): Promise<WeaponAlert[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const response = await fetch(`http://localhost:5000/logs/weapon-alerts?date=${today}`);
    if (!response.ok) {
      console.warn('Device alerts API not available');
      return [];
    }
    const data = await response.json();
    if (data.success) {
      return data.alerts || [];
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Device alerts API not available:', errorMessage);
    return [];
  }
};

// Fetch SOS calls
export const fetchSOSCalls = async (): Promise<SOSCall[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/sos-calls`);
    if (!response.ok) {
      console.warn('SOS calls API not available, using fallback data');
      throw new Error('API not available');
    }
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('SOS calls API not available, using mock data:', errorMessage);

    // Fallback to mock data based on the distress call structure we saw
    return [
      {
        timestamp: '2025-09-28 02:16:31',
        date: '2025-09-28',
        time: '02:16:31',
        latitude: 11.9338,
        longitude: 79.8298,
        location: 'Puducherry, IN',
        file: 'SOS_20250928_021631.mp3'
      }
    ];
  }
};

// Convert data to unified incident format
const convertWeaponAlertToIncident = (alert: WeaponAlert): IncidentHistory => {
  const maxConfidence = Math.max(...alert.detections.map(d => d.confidence));
  let severity: 'low' | 'medium' | 'high' | 'critical';

  if (maxConfidence > 0.8) severity = 'critical';
  else if (maxConfidence > 0.6) severity = 'high';
  else if (maxConfidence > 0.4) severity = 'medium';
  else severity = 'low';

  return {
    id: `weapon_${alert.timestamp}`,
    type: 'weapon_detected',
    status: alert.recording_started ? 'resolved' : 'investigating',
    severity,
    timestamp: new Date(alert.timestamp),
    location: 'Camera Monitor Location', // This would come from camera location data
    description: `${alert.detections[0].class.charAt(0).toUpperCase() + alert.detections[0].class.slice(1)} detected with ${(maxConfidence * 100).toFixed(1)}% confidence`,
    details: alert,
    recordingFile: alert.recording_filename
  };
};

const convertSOSCallToIncident = (sos: SOSCall): IncidentHistory => ({
  id: `sos_${sos.timestamp}`,
  type: 'sos_call',
  status: 'resolved', // Assuming SOS calls are handled and resolved
  severity: 'critical', // SOS calls are always critical
  timestamp: new Date(sos.timestamp),
  location: sos.location,
  description: 'Emergency SOS voice message received',
  details: sos,
  recordingFile: sos.file.split('\\').pop() // Extract filename from path
});

const convertLocalSOSToIncident = (localSOS: LocalSOSCall): IncidentHistory => ({
  id: localSOS.id,
  type: 'sos_call',
  status: localSOS.sent ? 'resolved' : 'active', // Active if not yet sent
  severity: 'critical', // All SOS calls are critical
  timestamp: new Date(localSOS.timestamp),
  location: localSOS.location,
  description: localSOS.sent
    ? `Emergency SOS message sent `
    : `Emergency SOS recorded - Pending send`,
  details: {
    timestamp: localSOS.timestamp,
    date: localSOS.date,
    time: localSOS.time,
    latitude: 0, // Will be added when geolocation is properly implemented
    longitude: 0,
    location: localSOS.location,
    file: localSOS.fileName
  },
  recordingFile: localSOS.fileName
});

const convertDeviceAlertToIncident = (alert: WeaponAlert): IncidentHistory => {
  const maxConfidence = Math.max(...alert.detections.map(d => d.confidence));
  let severity: 'low' | 'medium' | 'high' | 'critical';

  if (maxConfidence > 0.8) severity = 'critical';
  else if (maxConfidence > 0.6) severity = 'high';
  else if (maxConfidence > 0.4) severity = 'medium';
  else severity = 'low';

  return {
    id: `device_weapon_${alert.timestamp}`,
    type: 'weapon_detected',
    status: 'resolved', // Device alerts are automatically resolved
    severity,
    timestamp: new Date(alert.timestamp),
    location: 'Live Camera Feed', // Device monitoring location
    description: `Device detected ${alert.detections[0].class} with ${(maxConfidence * 100).toFixed(1)}% confidence for ${alert.duration_seconds.toFixed(1)}s`,
    details: alert,
    recordingFile: undefined // Device alerts don't have direct recording access in history
  };
};

// Fetch all incident history
export const fetchIncidentHistory = async (): Promise<IncidentHistory[]> => {
  // Always get local SOS recordings first
  const localSOSRecordings = getLocalSOSRecordings();
  console.log('Found local SOS recordings:', localSOSRecordings.length);
  const localSOSIncidents = localSOSRecordings.map(convertLocalSOSToIncident);

  try {
    // Fetch remote data without Promise.all to handle individual failures
    const weaponAlertsPromise = fetchWeaponAlerts().catch(err => {
      console.warn('Failed to fetch weapon alerts:', err.message);
      return [];
    });

    const sosCallsPromise = fetchSOSCalls().catch(err => {
      console.warn('Failed to fetch SOS calls:', err.message);
      return [];
    });

    const deviceAlertsPromise = fetchDeviceAlerts().catch(err => {
      console.warn('Failed to fetch device alerts:', err.message);
      return [];
    });

    const [weaponAlerts, sosCalls, deviceAlerts] = await Promise.all([
      weaponAlertsPromise,
      sosCallsPromise,
      deviceAlertsPromise
    ]);

    const weaponIncidents = weaponAlerts.map(convertWeaponAlertToIncident);
    const sosIncidents = sosCalls.map(convertSOSCallToIncident);
    const deviceIncidents = deviceAlerts.map(convertDeviceAlertToIncident);

    console.log('Device alerts found:', deviceAlerts.length);

    // Combine and sort by timestamp (newest first)
    const allIncidents = [...weaponIncidents, ...sosIncidents, ...localSOSIncidents, ...deviceIncidents];
    return allIncidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error fetching incident history:', error);

    // Return at least local SOS recordings if everything else fails
    return localSOSIncidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
};// Add device alert to incident history (for real-time updates)
export const addDeviceAlertToHistory = (alert: WeaponAlert) => {
  console.log('Adding device alert to history:', alert);
  // Trigger history refresh so the new alert appears in incident history
  setTimeout(() => {
    triggerHistoryRefresh();
  }, 500); // Small delay to ensure backend has processed the alert
};

// Get incident statistics
export const getIncidentStats = (incidents: IncidentHistory[]) => {
  const total = incidents.length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;
  const active = incidents.filter(i => i.status === 'active').length;
  const investigating = incidents.filter(i => i.status === 'investigating').length;

  const weaponDetections = incidents.filter(i => i.type === 'weapon_detected').length;
  const sosCalls = incidents.filter(i => i.type === 'sos_call').length;

  // Calculate average response time (mock calculation)
  const avgResponseTime = 45; // This would be calculated from actual response data

  return {
    total,
    resolved,
    active,
    investigating,
    weaponDetections,
    sosCalls,
    avgResponseTime
  };
};
