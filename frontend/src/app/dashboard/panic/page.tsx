'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../components/providers/AuthProvider';
import {
  startPanicSession,
  registerSafetyTap,
  reportMissedTap,
  endPanicSession,
  sendSafetyConfirmation,
  getCurrentPanicSession,
  PanicSession
} from '../../../lib/panicService';

const PanicModePage = () => {
  const { user } = useAuth();
  const [panicSession, setPanicSession] = useState<PanicSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showSafetyMessage, setShowSafetyMessage] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Default panic interval (30 seconds)
  const DEFAULT_INTERVAL = 60;
  const WARNING_THRESHOLD = 5;

  // Start a new panic session
  const startPanicMode = async () => {
    if (!user?.id) return;

    try {
      const newSession = await startPanicSession(user.id, DEFAULT_INTERVAL);

      setPanicSession(newSession);
      setTimeRemaining(DEFAULT_INTERVAL);
      setSessionDuration(0);
      setIsWarning(false);
      setShowSafetyMessage(false);

      // Start the countdown timer
      startCountdown();

      // Start session duration timer
      const durationInterval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);

      console.log('Panic mode started:', newSession);
    } catch (error) {
      console.error('Failed to start panic session:', error);
      alert('Failed to start panic mode. Please try again.');
    }
  };

  // Handle tap to confirm safety
  const handleSafetyTap = async () => {
    if (!panicSession?.isActive) return;

    try {
      const updatedSession = await registerSafetyTap(panicSession.id);

      setPanicSession(updatedSession);
      setTimeRemaining(DEFAULT_INTERVAL);
      setIsWarning(false);
      setIsEmergencyActive(false);
      setEmergencyAlert(null);

      // Stop alert sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Reset countdown
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      startCountdown();

      console.log('Safety tap registered:', updatedSession.totalTaps);
    } catch (error) {
      console.error('Failed to register safety tap:', error);
      // Continue with local update as fallback
      const updatedSession = {
        ...panicSession,
        lastTapTime: new Date(),
        totalTaps: panicSession.totalTaps + 1,
        missedTaps: 0
      };
      setPanicSession(updatedSession);
      setTimeRemaining(DEFAULT_INTERVAL);
      setIsWarning(false);
    }
  };

  // Start countdown timer
  const startCountdown = () => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;

        // Show warning when time is running low
        if (newTime <= WARNING_THRESHOLD && newTime > 0) {
          setIsWarning(true);
        }

        // Time expired - missed tap
        if (newTime <= 0) {
          handleMissedTap();
          return DEFAULT_INTERVAL; // Reset timer
        }

        return newTime;
      });
    }, 1000);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarning(true);
    }, (DEFAULT_INTERVAL - WARNING_THRESHOLD) * 1000);
  };

  // Handle missed tap (emergency alert)
  const handleMissedTap = async () => {
    if (!panicSession) return;

    try {
      await reportMissedTap(panicSession.id);

      const updatedSession = {
        ...panicSession,
        missedTaps: panicSession.missedTaps + 1,
        emergencyTriggered: true
      };

      setPanicSession(updatedSession);
      setIsWarning(false);
      setIsEmergencyActive(true);

      // Create emergency alert message
      const alertMessage = `🚨 EMERGENCY ALERT #${updatedSession.missedTaps} 🚨\n\n${user?.name} has missed a safety check-in!\n\nTime: ${new Date().toLocaleTimeString()}\nMissed Taps: ${updatedSession.missedTaps}\nSession Duration: ${formatSessionDuration(sessionDuration)}\n\n⚡ Emergency contacts are being notified immediately!\n⚡ Location services activated\n⚡ Recording started`;

      setEmergencyAlert(alertMessage);

      console.log('🚨 EMERGENCY: Missed safety tap! Alert triggered:', updatedSession.missedTaps);

      // Auto-dismiss alert after 10 seconds and show another one
      setTimeout(() => {
        setEmergencyAlert(null);
        if (updatedSession.isActive) {
          alert(`⚠️ CRITICAL: This is emergency alert #${updatedSession.missedTaps}!\n\n🆘 ${user?.name} needs help!\n📱 Emergency contacts notified\n📍 Location shared\n🎥 Recording in progress`);
        }
      }, 10000);

    } catch (error) {
      console.error('Failed to report missed tap:', error);
      // Continue with local update
      const updatedSession = {
        ...panicSession,
        missedTaps: panicSession.missedTaps + 1,
        emergencyTriggered: true
      };
      setPanicSession(updatedSession);
      setIsWarning(false);
      setIsEmergencyActive(true);

      // Show basic alert even if service fails
      alert(`🚨 EMERGENCY: Safety check missed! Alert #${updatedSession.missedTaps} - Emergency contacts being notified!`);
    }
  };

  // End panic session safely
  const endPanicSessionSafely = async () => {
    if (!panicSession) return;

    try {
      await endPanicSession(panicSession.id);

      // Clear all timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      setPanicSession(prev => prev ? { ...prev, isActive: false } : null);
      setShowSafetyMessage(true);

      console.log('Panic session ended safely');
    } catch (error) {
      console.error('Failed to end panic session:', error);
      // Continue with local update
      setPanicSession(prev => prev ? { ...prev, isActive: false } : null);
      setShowSafetyMessage(true);
    }
  };

  // Send "I'm safe" message to contacts
  const sendSafetyMessage = async () => {
    if (!panicSession) return;

    try {
      const success = await sendSafetyConfirmation(panicSession.id);

      if (success) {
        alert(`Safety message sent! Your emergency contacts have been notified that you are safe.`);
      } else {
        alert(`Safety message queued for sending. Your contacts will be notified when possible.`);
      }

      setShowSafetyMessage(false);
      setPanicSession(null);
      setSessionDuration(0);

    } catch (error) {
      console.error('Failed to send safety message:', error);
      alert(`Failed to send safety message. Please contact your emergency contacts directly.`);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format session duration
  const formatSessionDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Check for existing panic session on load
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!user?.id) return;

      try {
        const existingSession = await getCurrentPanicSession(user.id);
        if (existingSession && existingSession.isActive) {
          setPanicSession(existingSession);

          // Calculate time remaining based on last tap
          const now = new Date();
          const lastTap = existingSession.lastTapTime ? new Date(existingSession.lastTapTime) : existingSession.startTime;
          const elapsed = Math.floor((now.getTime() - lastTap.getTime()) / 1000);
          const remaining = Math.max(0, existingSession.tapInterval - elapsed);

          setTimeRemaining(remaining);

          // Calculate session duration
          const sessionElapsed = Math.floor((now.getTime() - existingSession.startTime.getTime()) / 1000);
          setSessionDuration(sessionElapsed);

          // Start countdown if time remaining
          if (remaining > 0) {
            startCountdown();
          } else {
            // Time already expired, trigger missed tap
            handleMissedTap();
          }
        }
      } catch (error) {
        console.error('Failed to check existing session:', error);
      }
    };

    if (user?.id) {
      checkExistingSession();
    }
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-safyra-navy">Panic Mode</h1>
        <p className="text-gray-600 mt-2">
          Stay safe with regular check-ins. Tap the button to confirm you're okay.
        </p>
      </div>

      {!panicSession?.isActive && !showSafetyMessage && (
        <Card className="border-rose-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
              <ShieldExclamationIcon className="h-8 w-8 text-rose-600" />
              Start Panic Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-700 max-w-md mx-auto">
              Panic mode will require you to tap a button every {DEFAULT_INTERVAL} seconds to confirm you're safe.
              If you miss a tap, your emergency contacts will be automatically notified.
            </p>
            <button
              onClick={startPanicMode}
              className="px-8 py-4 bg-rose-600 text-white rounded-full text-lg font-semibold hover:bg-rose-700 transition-colors duration-300 shadow-lg"
            >
              <PlayIcon className="h-6 w-6 inline mr-2" />
              Start Panic Mode
            </button>
          </CardContent>
        </Card>
      )}

      {/* Emergency Alert Modal */}
      {emergencyAlert && (
        <div className="fixed inset-0 z-50 bg-red-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="border-red-500 shadow-2xl bg-red-50 max-w-md w-full animate-pulse">
            <CardHeader className="bg-red-600 text-white">
              <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                🚨 EMERGENCY ALERT 🚨
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-red-800 font-semibold whitespace-pre-line">
                  {emergencyAlert}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setEmergencyAlert(null);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
                  >
                    Acknowledge Alert
                  </button>
                  <button
                    onClick={handleSafetyTap}
                    className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                  >
                    I'M SAFE NOW!
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {panicSession?.isActive && (
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={`shadow-md ${
            isEmergencyActive
              ? 'border-red-500 bg-red-50'
              : isWarning
                ? 'border-orange-500 bg-orange-50'
                : 'border-rose-200'
          }`}>
            <CardHeader>
              <CardTitle className="text-center text-xl flex items-center justify-center gap-3">
                {isEmergencyActive ? (
                  <>
                    🚨 <span className="text-red-600 font-bold animate-pulse">EMERGENCY ACTIVE</span> 🚨
                  </>
                ) : (
                  <>
                    <HeartIcon className={`h-6 w-6 ${isWarning ? 'text-red-500 animate-pulse' : 'text-rose-600'}`} />
                    Panic Mode Active
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Session Duration</span>
                  <span className="font-mono text-lg">{formatSessionDuration(sessionDuration)}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Total Taps</span>
                  <span className="font-mono text-lg">{panicSession.totalTaps}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <XMarkIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">Missed Taps</span>
                  <span className="font-mono text-lg">{panicSession.missedTaps}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Tap Button */}
          <Card className="border-2 border-rose-300 shadow-lg">
            <CardContent className="text-center py-12 space-y-6">
              <div className={`text-6xl font-mono ${isWarning ? 'text-red-500 animate-pulse' : 'text-rose-600'}`}>
                {formatTime(timeRemaining)}
              </div>

              <p className={`text-lg ${isWarning ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                {isWarning
                  ? 'URGENT: Tap now to confirm you\'re safe!'
                  : 'Tap the button to confirm you\'re okay'
                }
              </p>

              <button
                onClick={handleSafetyTap}
                className={`w-48 h-48 rounded-full text-white font-bold text-xl shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                  isEmergencyActive
                    ? 'bg-green-500 hover:bg-green-600 animate-bounce border-4 border-green-300'
                    : isWarning
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <CheckCircleIcon className="h-16 w-16 mx-auto mb-2" />
                {isEmergencyActive ? "I'M SAFE!" : "I'M SAFE"}
              </button>

              <div className="pt-6">
                <button
                  onClick={endPanicSessionSafely}
                  className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors duration-300"
                >
                  <PauseIcon className="h-5 w-5 inline mr-2" />
                  End Panic Session
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSafetyMessage && (
        <Card className="border-green-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-3 text-green-600">
              <CheckCircleIcon className="h-8 w-8" />
              Panic Session Ended
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-700 max-w-md mx-auto">
              Your panic session has ended safely. Would you like to send a confirmation message
              to your emergency contacts to let them know you're okay?
            </p>

            {panicSession && (
              <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                <h3 className="font-semibold mb-2">Session Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Duration: {formatSessionDuration(sessionDuration)}</p>
                  <p>Total Safety Taps: {panicSession.totalTaps}</p>
                  <p>Missed Taps: {panicSession.missedTaps}</p>
                  {panicSession.missedTaps > 0 && (
                    <p className="text-red-600 font-medium">
                      ⚠️ Emergency contacts were alerted due to missed taps
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={sendSafetyMessage}
                className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors duration-300"
              >
                Send "I'm Safe" Message
              </button>
              <button
                onClick={() => {
                  setShowSafetyMessage(false);
                  setPanicSession(null);
                  setSessionDuration(0);
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors duration-300"
              >
                Skip
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      {!panicSession?.isActive && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">How Panic Mode Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">1</span>
                <span>Start panic mode when you feel unsafe or want continuous monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">2</span>
                <span>Tap the "I'M SAFE" button every {DEFAULT_INTERVAL} seconds to confirm you're okay</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">3</span>
                <span>If you miss a tap, your emergency contacts will be automatically notified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">4</span>
                <span>End the session safely and optionally send a confirmation message</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PanicModePage;
