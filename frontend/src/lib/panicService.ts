// Service for panic mode functionality
export interface PanicSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  tapInterval: number; // seconds
  lastTapTime?: Date;
  missedTaps: number;
  totalTaps: number;
  emergencyTriggered: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface EmergencyAlert {
  id: string;
  sessionId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  alertType: 'missed_tap' | 'manual_trigger';
  contactsNotified: string[];
  servicesNotified: string[];
}

// Mock API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Start a new panic session
export const startPanicSession = async (userId: string, tapInterval: number = 30): Promise<PanicSession> => {
  // Always use local storage for now since API endpoints don't exist
  try {
    // Get current location (with fallback)
    const location = await getCurrentLocation().catch(() => ({
      latitude: 0,
      longitude: 0,
      address: 'Location unavailable'
    }));

    const session: PanicSession = {
      id: `panic_${Date.now()}`,
      userId,
      startTime: new Date(),
      isActive: true,
      tapInterval,
      lastTapTime: new Date(),
      missedTaps: 0,
      totalTaps: 1,
      emergencyTriggered: false,
      location
    };

    storeSessionLocally(session);
    console.log('Panic session started locally:', session.id);
    return session;
  } catch (error) {
    console.error('Failed to start panic session:', error);
    throw error;
  }
};// Register a safety tap
export const registerSafetyTap = async (sessionId: string): Promise<PanicSession> => {
  // Use local storage directly
  const session = getStoredSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.lastTapTime = new Date();
  session.totalTaps += 1;
  session.missedTaps = 0; // Reset missed taps
  storeSessionLocally(session);

  console.log('Safety tap registered locally:', session.totalTaps);
  return session;
};// Report a missed tap (emergency)
export const reportMissedTap = async (sessionId: string): Promise<EmergencyAlert> => {
  // Handle locally
  const session = getStoredSession(sessionId);
  if (session) {
    session.missedTaps += 1;
    session.emergencyTriggered = true;
    storeSessionLocally(session);
  }

  // Get location with fallback
  const location = await getCurrentLocation().catch(() => ({
    latitude: 0,
    longitude: 0,
    address: 'Location unavailable'
  }));

  // Create emergency alert
  const alert: EmergencyAlert = {
    id: `alert_${Date.now()}`,
    sessionId,
    timestamp: new Date(),
    location,
    alertType: 'missed_tap',
    contactsNotified: [], // Would be populated by actual notification system
    servicesNotified: []
  };

  // In a real implementation, this would trigger:
  // 1. SMS/call notifications to emergency contacts
  // 2. Push notifications to connected devices
  // 3. Optional 911/emergency service alerts
  // 4. Audio/video recording start
  // 5. Location tracking activation
  // 6. Live streaming to trusted contacts

  console.log('🚨 EMERGENCY ALERT TRIGGERED locally:', alert);

  // Simulate emergency actions (in real app these would be actual API calls)
  simulateEmergencyActions(alert);

  return alert;
};// End panic session safely
export const endPanicSession = async (sessionId: string): Promise<PanicSession> => {
  // Handle locally
  const session = getStoredSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.isActive = false;
  session.endTime = new Date();
  storeSessionLocally(session);

  console.log('Panic session ended locally:', sessionId);
  return session;
};// Send safety confirmation message
export const sendSafetyConfirmation = async (sessionId: string, message?: string): Promise<boolean> => {
  // Handle locally for now
  const defaultMessage = "I'm safe now. The emergency situation has been resolved.";
  const finalMessage = message || defaultMessage;

  // In a real implementation, this would:
  // 1. Send SMS to emergency contacts
  // 2. Send push notifications
  // 3. Update emergency services if they were notified

  console.log('Safety confirmation sent locally:', finalMessage);

  // Clean up local storage
  removeStoredSession(sessionId);

  return true;
};// Get current panic session
export const getCurrentPanicSession = async (userId: string): Promise<PanicSession | null> => {
  // Check local storage for active sessions
  const sessions = getAllStoredSessions();
  const activeSession = sessions.find(s => s.userId === userId && s.isActive);

  return activeSession || null;
};// Get panic session history
export const getPanicSessionHistory = async (userId: string): Promise<PanicSession[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/panic/history/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to get session history');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get session history via API, using local data:', error);

    // Return local sessions
    const sessions = getAllStoredSessions();
    return sessions.filter(s => s.userId === userId);
  }
};

// Utility functions for local storage
const PANIC_SESSIONS_KEY = 'safyra_panic_sessions';

const storeSessionLocally = (session: PanicSession): void => {
  try {
    const sessions = getAllStoredSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(PANIC_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to store session locally:', error);
  }
};

const getStoredSession = (sessionId: string): PanicSession | null => {
  try {
    const sessions = getAllStoredSessions();
    return sessions.find(s => s.id === sessionId) || null;
  } catch (error) {
    console.error('Failed to get stored session:', error);
    return null;
  }
};

const getAllStoredSessions = (): PanicSession[] => {
  try {
    const stored = localStorage.getItem(PANIC_SESSIONS_KEY);
    if (!stored) return [];

    const sessions = JSON.parse(stored) as PanicSession[];
    // Convert date strings back to Date objects
    return sessions.map(s => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
      lastTapTime: s.lastTapTime ? new Date(s.lastTapTime) : undefined
    }));
  } catch (error) {
    console.error('Failed to get stored sessions:', error);
    return [];
  }
};

const removeStoredSession = (sessionId: string): void => {
  try {
    const sessions = getAllStoredSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(PANIC_SESSIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove stored session:', error);
  }
};

// Get current location
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve({ latitude: 0, longitude: 0, address: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding to get address (in real implementation)
          // For now, we'll use a placeholder
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          resolve({ latitude, longitude, address });
        } catch (error) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Address lookup failed'
          });
        }
      },
      (error) => {
        console.warn('Geolocation permission denied or error:', error.message);
        // Don't reject, just resolve with default location
        resolve({ latitude: 0, longitude: 0, address: 'Location permission denied' });
      },
      {
        enableHighAccuracy: false, // Less strict for demo
        timeout: 5000, // Shorter timeout
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Simulate emergency actions (in real implementation these would be actual API calls)
const simulateEmergencyActions = (alert: EmergencyAlert) => {
  console.log('🚨 EMERGENCY ACTIONS INITIATED:');
  console.log('📱 Sending SMS to emergency contacts...');
  console.log('📞 Initiating emergency calls...');
  console.log('📍 Sharing live location...');
  console.log('🎥 Starting audio/video recording...');
  console.log('🔔 Sending push notifications...');
  console.log('🆘 Alert details:', {
    id: alert.id,
    time: alert.timestamp.toLocaleString(),
    location: alert.location.address,
    type: alert.alertType
  });

  // In a real implementation, this would:
  // 1. Call emergency contact API
  // 2. Send SMS via Twilio/AWS SNS
  // 3. Make automated calls
  // 4. Start location sharing
  // 5. Begin recording media
  // 6. Send notifications to paired devices
};
