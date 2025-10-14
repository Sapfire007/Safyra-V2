'use client';

import { useEffect, useState } from 'react';
import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning, Calendar, Clock, Thermometer, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getBatteryData, BatteryData } from '../../lib/batteryService';

const DashboardPage = () => {
  const [batteryDetails, setBatteryDetails] = useState<BatteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes, we'll use a hardcoded device ID
  const deviceId = 'safyra-001';

  // Function to fetch battery details
  const fetchBatteryDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getBatteryData(deviceId);

      if (data) {
        setBatteryDetails(data);
      } else {
        setError('No battery data found for this device.');
      }

    } catch (err) {
      console.error('Error fetching battery data:', err);
      setError('Failed to load battery information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchBatteryDetails();
  }, []);

  // Function to get the appropriate battery icon based on level
  const getBatteryIcon = (level: number) => {
    if (level >= 75) return <BatteryFull className="h-8 w-8 text-green-500" />;
    if (level >= 50) return <BatteryMedium className="h-8 w-8 text-yellow-500" />;
    if (level >= 25) return <BatteryLow className="h-8 w-8 text-orange-500" />;
    return <BatteryWarning className="h-8 w-8 text-red-500" />;
  };

  // Format the timestamp for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safyra-gold mx-auto"></div>
          <p className="mt-4 text-safyra-navy">Loading battery information...</p>
        </div>
      </div>
    );
  }

  if (error && !batteryDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <BatteryWarning className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-safyra-navy mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchBatteryDetails}
            className="mt-4 px-4 py-2 bg-safyra-gold text-white rounded-md hover:bg-safyra-navy transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-safyra-navy">Battery Status</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage your Safyra device
        </p>
      </div>

      {batteryDetails && (
        <div className="space-y-6">
          {/* Main Battery Status Card */}
          <Card className="border-safyra-gold/20 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center gap-3">
                {getBatteryIcon(batteryDetails.batteryLevel)}
                <span>Battery Status - {batteryDetails.deviceName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-40 h-40 mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-safyra-navy">
                      {batteryDetails.batteryLevel}%
                    </span>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-safyra-gold"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - batteryDetails.batteryLevel / 100)}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <p className="text-lg text-gray-600">
                  {batteryDetails.chargingStatus} • {batteryDetails.estimatedTimeRemaining} hours remaining
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-safyra-gold" />
                  <div>
                    <p className="text-sm text-gray-500">Last Charged</p>
                    <p className="font-medium">{formatDate(batteryDetails.lastCharged)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-safyra-gold" />
                  <div>
                    <p className="text-sm text-gray-500">Charge Cycles</p>
                    <p className="font-medium">{batteryDetails.chargeCycles}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-safyra-gold" />
                  <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="font-medium">{batteryDetails.temperature}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-safyra-gold" />
                  <div>
                    <p className="text-sm text-gray-500">Battery Health</p>
                    <p className="font-medium capitalize">{batteryDetails.healthStatus}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery Tips Card */}
          <Card className="border-safyra-gold/20 shadow-md">
            <CardHeader>
              <CardTitle>Battery Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Charge your device when battery falls below 20% for optimal battery health.</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Avoid exposing your device to extreme temperatures to preserve battery life.</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-green-100 p-1 rounded-full mt-0.5">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">For long-term storage, keep the battery charged at around 50%.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
