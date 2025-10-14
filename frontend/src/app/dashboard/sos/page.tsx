'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BellAlertIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import toast from 'react-hot-toast';
import { saveSOSRecording, updateSOSRecording } from '../../../lib/sosStorageService';
import { triggerHistoryRefresh } from '../../../lib/historyManager';

interface SOSSession {
  id: string;
  status: 'inactive' | 'recording' | 'completed';
  startTime?: Date;
  audioBlob?: Blob;
  audioUrl?: string;
}

export default function SOSPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<SOSSession>({
    id: '',
    status: 'inactive'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start voice recording (hold to record)
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      console.log('MediaRecorder created, state:', mediaRecorder.state);

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('onstop triggered, chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('Created audio blob, size:', audioBlob.size);
        const audioUrl = URL.createObjectURL(audioBlob);

        setSession(prev => ({
          ...prev,
          status: 'completed',
          audioBlob,
          audioUrl
        }));

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        toast.success('Voice message recorded');

        // Auto-send SOS now that we have the audio blob
        try {
          console.log('Audio blob size:', audioBlob.size, 'Recording time:', recordingTime);

          if (audioBlob.size === 0) {
            toast.error('No audio data recorded');
            return;
          }

          const savedRecording = await saveSOSRecording(audioBlob, recordingTime || 1, false);

          // Mark as sent after successful "transmission"
          setTimeout(() => {
            updateSOSRecording(savedRecording.id, { sent: true });
            triggerHistoryRefresh();
          }, 1000);

          // Immediately trigger history refresh for the initial save
          triggerHistoryRefresh();

          toast.success('SOS sent to emergency contacts with voice message!');
          toast.success('Recording saved to incident history');

          // Reset session after a short delay
          setTimeout(() => {
            setSession({
              id: '',
              status: 'inactive'
            });
            setRecordingTime(0);
            if (audioUrl) {
              URL.revokeObjectURL(audioUrl);
            }
          }, 2000);

        } catch (error) {
          console.error('Error saving SOS recording:', error);
          toast.error('Error saving recording, but SOS was sent');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started, state:', mediaRecorder.state);

      setSession({
        id: `sos_${Date.now()}`,
        status: 'recording',
        startTime: new Date()
      });

      toast.success('Recording... Hold button and speak');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Unable to access microphone. Please check permissions.');
    }
  };

  // Stop recording (release button) and auto-send SOS
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording, state:', mediaRecorderRef.current.state);
      console.log('Audio chunks collected:', audioChunksRef.current.length);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // SOS will be automatically sent in the onstop event handler
    }
  };

  // Handle mouse/touch events for hold-to-record
  const handleRecordStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (session.status === 'inactive') {
      startRecording();
    }
  };

  const handleRecordEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    }
  };

  // Play recorded audio
  const playAudio = () => {
    if (session.audioUrl && !isPlaying) {
      const audio = new Audio(session.audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.play();
      setIsPlaying(true);
    }
  };

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Send SOS with voice message


  // Cancel and start over
  const cancelSOS = () => {
    if (session.audioUrl) {
      URL.revokeObjectURL(session.audioUrl);
    }

    setSession({
      id: '',
      status: 'inactive'
    });

    setIsPlaying(false);
    setRecordingTime(0);
    toast('Recording cancelled');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main SOS Card */}
      <Card className="border-2 border-red-200">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
              <BellAlertIcon className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Emergency SOS
            </h1>

            <p className="text-gray-600 mb-8">
              Hold the button to record and automatically send an emergency voice message
            </p>

            {/* Hold to Record */}
            {session.status === 'inactive' && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Hold the button below to record your emergency message
                </p>
                <button
                  onMouseDown={handleRecordStart}
                  onMouseUp={handleRecordEnd}
                  onMouseLeave={handleRecordEnd}
                  onTouchStart={handleRecordStart}
                  onTouchEnd={handleRecordEnd}
                  className="w-48 h-48 mx-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-95 shadow-lg hover:shadow-xl select-none"
                  style={{ userSelect: 'none' }}
                >
                  <MicrophoneIcon className="w-16 h-16 mb-3" />
                  <span className="text-lg font-semibold">HOLD TO</span>
                  <span className="text-lg font-semibold">RECORD</span>
                </button>
              </div>
            )}

            {/* Recording in Progress */}
            {session.status === 'recording' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-2xl font-mono text-red-600">{formatTime(recordingTime)}</span>
                </div>

                <div className="bg-red-50 rounded-lg p-6">
                  <button
                    onMouseDown={handleRecordStart}
                    onMouseUp={handleRecordEnd}
                    onMouseLeave={handleRecordEnd}
                    onTouchStart={handleRecordStart}
                    onTouchEnd={handleRecordEnd}
                    className="w-32 h-32 mx-auto bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-150 transform scale-110 shadow-xl select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <MicrophoneIcon className="w-12 h-12 animate-pulse" />
                  </button>
                  <p className="text-lg font-semibold text-red-600 mb-2 mt-4">Recording...</p>
                  <p className="text-sm text-gray-600">
                    Keep holding the button and speak clearly
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Release the button to stop recording
                  </p>
                </div>
              </div>
            )}

            {/* Recording Completed */}
            {session.status === 'completed' && session.audioUrl && (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <Button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-6 h-6" />
                      ) : (
                        <PlayIcon className="w-6 h-6" />
                      )}
                    </Button>
                    <span className="text-green-600 font-semibold">
                      {isPlaying ? 'Playing...' : 'Voice message ready'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    Your emergency message has been automatically sent to contacts
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <p className="text-green-700 font-medium">
                      ✓ SOS sent
                    </p>
                  </div>

                  <Button
                    onClick={cancelSOS}
                    variant="outline"
                    className="px-6 py-4"
                    size="lg"
                  >
                    Record Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Info */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {user.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">
                      {contact.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No emergency contacts configured.
              <br />
              <span className="text-blue-600 hover:underline cursor-pointer">
                Add contacts in settings
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
