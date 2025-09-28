export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
  devices: Device[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'wearable' | 'mobile' | 'home';
  status: 'active' | 'inactive' | 'low_battery' | 'offline';
  batteryLevel?: number;
  lastSeen: Date;
  serialNumber: string;
}

export interface Incident {
  id: string;
  userId: string;
  type: 'weapon_detected' | 'panic_button' | 'fall_detection' | 'geofence_breach';
  status: 'active' | 'resolved' | 'false_alarm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: Date;
  metadata: {
    deviceId: string;
    ipAddress: string;
    userAgent: string;
  };
  media?: {
    videoUrl: string;
    audioUrl: string;
    screenshots: string[];
  };
  responses: IncidentResponse[];
}

export interface IncidentResponse {
  id: string;
  responderId: string;
  responderType: 'emergency_service' | 'emergency_contact' | 'security';
  status: 'notified' | 'acknowledged' | 'en_route' | 'arrived' | 'resolved';
  timestamp: Date;
  estimatedArrival?: Date;
}

export interface LiveSession {
  id: string;
  incidentId: string;
  isActive: boolean;
  viewers: Viewer[];
  startTime: Date;
  endTime?: Date;
  permissions: {
    canViewVideo: boolean;
    canViewAudio: boolean;
    canViewLocation: boolean;
    canViewMetadata: boolean;
  };
}

export interface Viewer {
  id: string;
  name: string;
  type: 'emergency_contact' | 'emergency_service' | 'admin';
  joinedAt: Date;
  lastSeen: Date;
}
