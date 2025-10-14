// Battery service to handle battery-related data operations

// Types for battery data
export interface BatteryData {
  id: string;
  deviceId: string;
  deviceName: string;
  batteryLevel: number;
  lastUpdated: Date;
  estimatedTimeRemaining: number; // in hours
  chargingStatus: 'charging' | 'discharging' | 'full';
  healthStatus: 'good' | 'fair' | 'poor';
  lastCharged: string;
  chargeCycles: number;
  temperature: string;
}

// Generate a simple UUID-like string
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Mock database for battery information
const batteryDatabase: BatteryData[] = [
  {
    id: generateId(),
    deviceId: 'safyra-001',
    deviceName: 'Safyra Pendant',
    batteryLevel: 78,
    lastUpdated: new Date(),
    estimatedTimeRemaining: 36,
    chargingStatus: 'discharging',
    healthStatus: 'good',
    lastCharged: '2023-11-15T08:30:00Z',
    chargeCycles: 42,
    temperature: '28°C'
  },
  {
    id: generateId(),
    deviceId: 'safyra-002',
    deviceName: 'Safyra Watch',
    batteryLevel: 65,
    lastUpdated: new Date(),
    estimatedTimeRemaining: 24,
    chargingStatus: 'discharging',
    healthStatus: 'good',
    lastCharged: '2023-11-14T22:15:00Z',
    chargeCycles: 38,
    temperature: '26°C'
  }
];

// Get battery data for a specific device
export const getBatteryData = async (deviceId: string): Promise<BatteryData | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return batteryDatabase.find(device => device.deviceId === deviceId) || null;
};

// Get battery data for all devices
export const getAllBatteryData = async (): Promise<BatteryData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [...batteryDatabase];
};

// Update battery data (for future use)
export const updateBatteryData = async (data: Partial<BatteryData> & { deviceId: string }): Promise<BatteryData | null> => {
  const index = batteryDatabase.findIndex(device => device.deviceId === data.deviceId);

  if (index === -1) return null;

  batteryDatabase[index] = {
    ...batteryDatabase[index],
    ...data,
    lastUpdated: new Date()
  };

  return batteryDatabase[index];
};
