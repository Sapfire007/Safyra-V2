// Local storage service for SOS recordings
export interface LocalSOSCall {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  location: string;
  audioBlob: string; // Base64 encoded audio data
  fileName: string;
  duration: number; // in seconds
  sent: boolean; // whether the SOS was sent to contacts
}

const SOS_STORAGE_KEY = 'safyra_sos_recordings';

// Convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert Base64 to Blob
export const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Get current location (mock implementation)
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          });
        },
        () => {
          // Fallback location
          resolve({
            latitude: 0,
            longitude: 0,
            address: 'Location unavailable'
          });
        }
      );
    } else {
      resolve({
        latitude: 0,
        longitude: 0,
        address: 'Location unavailable'
      });
    }
  });
};

// Save SOS recording to local storage
export const saveSOSRecording = async (
  audioBlob: Blob,
  duration: number,
  sent: boolean = false
): Promise<LocalSOSCall> => {
  try {
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const id = `sos_${Date.now()}`;
    const fileName = `SOS_${date.replace(/-/g, '')}_${time.replace(/:/g, '')}.wav`;

    // Get location
    const location = await getCurrentLocation();

    // Convert blob to base64
    const audioData = await blobToBase64(audioBlob);

    const sosCall: LocalSOSCall = {
      id,
      timestamp,
      date,
      time,
      location: location.address,
      audioBlob: audioData,
      fileName,
      duration,
      sent
    };

    // Get existing recordings
    const existingRecordings = getLocalSOSRecordings();

    // Add new recording
    existingRecordings.push(sosCall);

    // Save to localStorage
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(existingRecordings));
    console.log('Saved SOS recording:', sosCall.id, 'Total recordings:', existingRecordings.length);

    return sosCall;
  } catch (error) {
    console.error('Error saving SOS recording:', error);
    throw error;
  }
};

// Get all SOS recordings from local storage
export const getLocalSOSRecordings = (): LocalSOSCall[] => {
  try {
    const recordings = localStorage.getItem(SOS_STORAGE_KEY);
    const parsed = recordings ? JSON.parse(recordings) : [];
    console.log('getLocalSOSRecordings found:', parsed.length, 'recordings');
    return parsed;
  } catch (error) {
    console.error('Error getting SOS recordings:', error);
    return [];
  }
};

// Update SOS recording status (mark as sent)
export const updateSOSRecording = (id: string, updates: Partial<LocalSOSCall>): void => {
  try {
    const recordings = getLocalSOSRecordings();
    const index = recordings.findIndex(r => r.id === id);

    if (index !== -1) {
      recordings[index] = { ...recordings[index], ...updates };
      localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(recordings));
    }
  } catch (error) {
    console.error('Error updating SOS recording:', error);
  }
};

// Delete SOS recording
export const deleteSOSRecording = (id: string): void => {
  try {
    const recordings = getLocalSOSRecordings();
    const filteredRecordings = recordings.filter(r => r.id !== id);
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(filteredRecordings));
  } catch (error) {
    console.error('Error deleting SOS recording:', error);
  }
};

// Get audio URL from stored recording
export const getAudioUrlFromRecording = (recording: LocalSOSCall): string => {
  const blob = base64ToBlob(recording.audioBlob);
  return URL.createObjectURL(blob);
};

// Clear all SOS recordings
export const clearAllSOSRecordings = (): void => {
  try {
    localStorage.removeItem(SOS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing SOS recordings:', error);
  }
};
