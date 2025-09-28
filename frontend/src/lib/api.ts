// API utilities for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Weapon detection API functions
export const weaponDetectionApi = {
  // Camera monitoring
  startMonitoring: (cameraIndex: number = 0) =>
    apiClient.post('/camera/start', { camera_index: cameraIndex }),

  stopMonitoring: () =>
    apiClient.post('/camera/stop'),

  getCameraStatus: () =>
    apiClient.get('/camera/status'),

  getVideoStream: () =>
    `${API_BASE_URL}/camera/stream`,

  // Alerts and logs
  getWeaponAlerts: (date?: string) => {
    const queryParam = date ? `?date=${date}` : '';
    return apiClient.get(`/logs/weapon-alerts${queryParam}`);
  },

  getAlertsSummary: () =>
    apiClient.get('/logs/weapon-alerts/summary'),

  // Health check
  healthCheck: () =>
    apiClient.get('/'),
};

// Device management API functions (for future backend expansion)
export const deviceApi = {
  getDevices: () =>
    // This would connect to your device management backend
    Promise.resolve({
      success: true,
      data: {
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
      },
    }),

  getDeviceStatus: (deviceId: string) =>
    Promise.resolve({
      success: true,
      data: {
        id: deviceId,
        status: 'active',
        batteryLevel: 85,
        lastSeen: new Date(),
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    }),
};

// Emergency API functions (for SOS and incident management)
export const emergencyApi = {
  createIncident: (incidentData: any) =>
    Promise.resolve({
      success: true,
      data: {
        id: `inc_${Date.now()}`,
        ...incidentData,
        status: 'active',
        timestamp: new Date().toISOString(),
      },
    }),

  getIncident: (incidentId: string) =>
    Promise.resolve({
      success: true,
      data: {
        id: incidentId,
        status: 'active',
        timestamp: new Date().toISOString(),
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main Street, New York, NY',
        },
        user: {
          id: '1',
          name: 'Sarah Johnson',
        },
      },
    }),

  resolveIncident: (incidentId: string) =>
    Promise.resolve({
      success: true,
      data: { id: incidentId, status: 'resolved' },
    }),
};

// Utility functions
export const formatApiError = (error: string): string => {
  // Customize error messages for better user experience
  if (error.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (error.includes('404')) {
    return 'The requested resource was not found.';
  }
  if (error.includes('500')) {
    return 'Server error occurred. Please try again later.';
  }
  return error;
};

export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const response = await weaponDetectionApi.healthCheck();
    return response.success;
  } catch {
    return false;
  }
};
