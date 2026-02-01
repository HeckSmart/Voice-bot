'use client';

import { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mic, MicOff, Volume2, MoreVertical } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function VoiceChat() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] =
    useState<string>('en-IN-NeerjaNeural');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingAudioRef = useRef(false);
  const selectedVoiceRef = useRef<string>('en-IN-NeerjaNeural');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPauseRecordingRef = useRef(false);

  // English and Hindi only – female voices first (default: Hinglish with female voice)
  const voices = [
    { value: 'en-IN-NeerjaNeural', label: 'Neerja (Female) 🇮🇳 Hinglish', lang: 'en' },
    { value: 'hi-IN-SwaraNeural', label: 'Swara (Female) 🇮🇳 Hindi', lang: 'hi' },
    { value: 'en-US-AriaNeural', label: 'Aria (Female) 🇺🇸 English', lang: 'en' },
    { value: 'en-IN-PrabhatNeural', label: 'Prabhat (Male) 🇮🇳', lang: 'en' },
    { value: 'hi-IN-MadhurNeural', label: 'Madhur (Male) 🇮🇳', lang: 'hi' },
  ];

  // Close voice menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setVoiceMenuOpen(false);
      }
    };
    if (voiceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [voiceMenuOpen]);

  const cleanup = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const initializeWebSocket = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'response') {
          setIsProcessing(false);
          addMessage(data.text, false);

          // Queue audio for playback (must be non-empty base64 string)
          const hasAudio =
            typeof data.audio === 'string' && data.audio.length > 0;
          if (hasAudio) {
            audioQueueRef.current.push(data.audio);
            if (!isProcessingAudioRef.current) {
              processAudioQueue();
            }
          } else {
            // No audio in response – request TTS so user hears the reply
            requestTTS(data.text);
          }
        } else if (data.type === 'audio') {
          setIsProcessing(false);
          audioQueueRef.current.push(data.audio);
          if (!isProcessingAudioRef.current) {
            processAudioQueue();
          }
        } else if (data.type === 'no_response') {
          setIsProcessing(false);
        } else if (data.type === 'error') {
          setIsProcessing(false);
          const msg =
            typeof data.message === 'string' && data.message.length > 0
              ? data.message
              : 'Something went wrong. Try again.';
          addMessage(msg, false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setIsProcessing(false);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const requestTTS = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const currentVoice = selectedVoiceRef.current;
      wsRef.current.send(
        JSON.stringify({
          type: 'tts',
          text: text,
          voice: currentVoice,
        })
      );
    }
  };

  const processAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isProcessingAudioRef.current = false;
      setIsPlaying(false);
      shouldPauseRecordingRef.current = false;

      // Resume recording after playback
      if (
        !isMuted &&
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'inactive'
      ) {
        setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'inactive' &&
            !isMuted
          ) {
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            monitorAudioLevel();
          }
        }, 100);
      }
      return;
    }

    isProcessingAudioRef.current = true;
    setIsPlaying(true);
    shouldPauseRecordingRef.current = true;

    // Stop recording while AI is speaking
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    const audioData = audioQueueRef.current.shift()!;

    try {
      // ElevenLabs/Edge return MP3 – use audio/mpeg (standard MIME for MP3)
      const audioBlob = base64ToBlob(audioData, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processAudioQueue();
      };

      audio.onerror = (e) => {
        console.error('Audio element error:', e);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processAudioQueue();
      };

      await audio.play().catch((e) => {
        console.error('Audio play() failed (e.g. autoplay policy):', e);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processAudioQueue();
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      currentAudioRef.current = null;
      processAudioQueue();
    }
  };

  const base64ToBlob = (base64: string, type: string): Blob => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  const initializeRoom = async () => {
    try {
      const response = await fetch('/api/token');
      const { token } = await response.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
    } catch (error) {
      console.error('Failed to connect to room:', error);
    }
  };

  const startContinuousListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Higher sample rate for better quality
          channelCount: 1, // Mono is better for speech recognition
        },
      });

      streamRef.current = stream;

      // Set up audio analysis for silence detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Don't send audio if we're pausing for AI playback
        if (shouldPauseRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });

          // Minimum size to avoid sending tiny noise; 50KB allows short phrases
          if (audioBlob.size > 50000) {
            const audioData = await blobToBase64(audioBlob);
            sendAudioToBackend(audioData);
          } else {
            console.log('Audio too short, skipping:', audioBlob.size, 'bytes');
          }

          audioChunksRef.current = [];
        }

        // Restart recording immediately for continuous listening
        // But only if not playing AI audio
        if (
          !isMuted &&
          !shouldPauseRecordingRef.current &&
          mediaRecorderRef.current
        ) {
          setTimeout(() => {
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== 'recording' &&
              !isMuted &&
              !shouldPauseRecordingRef.current
            ) {
              mediaRecorderRef.current.start();
              monitorAudioLevel();
            }
          }, 100); // Small delay before restarting
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsListening(true);
      monitorAudioLevel();
    } catch (error) {
      console.error('Error starting continuous listening:', error);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current || isMuted) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let isSpeaking = false;
    let speakingStartTime = 0;
    const SPEECH_THRESHOLD = 50; // Increased from 30 to reduce false positives
    const MIN_SPEAKING_DURATION = 500; // Must speak for at least 500ms
    const SILENCE_DURATION = 3000; // Wait 3 seconds of silence before stopping

    const checkAudio = () => {
      if (!analyserRef.current || isMuted) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      // If sound detected above threshold
      if (average > SPEECH_THRESHOLD) {
        if (!isSpeaking) {
          // Just started speaking
          speakingStartTime = Date.now();
        }
        isSpeaking = true;

        // Clear any existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Set new silence timeout
        silenceTimeoutRef.current = setTimeout(() => {
          const speakingDuration = Date.now() - speakingStartTime;

          // Only stop if we spoke for minimum duration
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording' &&
            isSpeaking &&
            speakingDuration >= MIN_SPEAKING_DURATION
          ) {
            mediaRecorderRef.current.stop();
            isSpeaking = false;
            speakingStartTime = 0;
          } else if (speakingDuration < MIN_SPEAKING_DURATION) {
            // Too short, ignore this audio
            isSpeaking = false;
            speakingStartTime = 0;
          }
        }, SILENCE_DURATION);
      }

      // Continue monitoring
      if (!isMuted) {
        requestAnimationFrame(checkAudio);
      }
    };

    checkAudio();
  };

  const sendAudioToBackend = (audioData: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsProcessing(true);
      const currentVoice = selectedVoiceRef.current;
      console.log('Sending audio with voice:', currentVoice);
      wsRef.current.send(
        JSON.stringify({
          type: 'audio',
          audio: audioData,
          voice: currentVoice,
        })
      );
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const addMessage = (text: string, isUser: boolean) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (newMutedState) {
      // Stop listening
      setIsListening(false);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    } else {
      // Resume listening
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'recording'
      ) {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsListening(true);
        monitorAudioLevel();
      }
    }

    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(
        !newMutedState
      );
    }
  };

  useEffect(() => {
    initializeRoom();
    initializeWebSocket();
    // Defer so setState from startContinuousListening runs outside effect body
    const tid = setTimeout(() => startContinuousListening(), 0);

    return () => {
      clearTimeout(tid);
      cleanup();
    };
    // Intentionally run once on mount; these functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1313] text-white relative overflow-hidden p-4">
      {/* Background – grid + yellow glow + bottom gradient (Login reference) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
        }}
      />
      <div
        className="absolute -top-40 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255,223,0,0.15) 0%, rgba(255,223,0,0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(14,19,19,0) 0%, rgba(14,19,19,1) 100%)',
        }}
      />

      {/* BatterySmart – top-left of whole page */}
      <p className="absolute left-6 top-6 z-10 text-2xl font-bold text-yellow-500 pointer-events-none">
        BatterySmart
      </p>

      {/* Mobile-sized container (e.g. 390px width, phone aspect) */}
      <div className="w-full max-w-[390px] min-h-[90vh] max-h-[95vh] flex flex-col mx-auto px-2 sm:px-4">
        <Card
          className="relative w-full flex-1 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:border-yellow-500/20 animate-[slideUp_0.5s_ease-out]"
          style={{
            background: 'rgba(14, 19, 19, 0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(62, 67, 67, 0.5)',
          }}
        >
          {/* Mobile header: title + triple-dot (voice in menu) */}
          <div className="shrink-0 border-b border-[#3E4343]/50 px-4 pl-8 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h1 className="text-base font-semibold text-white truncate">
                  Driver Support Bot
                </h1>
              </div>
              <div className="relative shrink-0" ref={voiceMenuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-[#6C7070] hover:text-yellow-500 hover:bg-white/5"
                  onClick={() => setVoiceMenuOpen((o) => !o)}
                  aria-label="Options"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                {voiceMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-2 rounded-xl border border-[#3E4343] bg-[#0E1313] shadow-xl animate-[fadeIn_0.2s_ease-in]"
                    style={{ background: 'rgba(14, 19, 19, 0.98)' }}
                  >
                    <div className="px-3 pb-2 text-xs font-medium text-[#6C7070] uppercase tracking-wider">
                      Voice
                    </div>
                    <Select
                      value={selectedVoice}
                      onValueChange={(newVoice) => {
                        setSelectedVoice(newVoice);
                        selectedVoiceRef.current = newVoice;
                        setMessages([]);
                        audioQueueRef.current = [];
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                          wsRef.current.send(JSON.stringify({ type: 'reset' }));
                        }
                        setVoiceMenuOpen(false);
                      }}
                    >
                      <SelectTrigger className="mx-2 w-[calc(100%-1rem)] h-10 rounded-lg border-[#6C7070] bg-[#0E1313]/80 text-white text-sm focus:border-yellow-500/50 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0E1313] border-[#3E4343] text-white rounded-xl">
                        {voices.map((voice) => (
                          <SelectItem
                            key={voice.value}
                            value={voice.value}
                            className="text-white hover:bg-[#3E4343] hover:text-yellow-500 focus:bg-[#3E4343] focus:text-yellow-500 cursor-pointer rounded-lg text-sm"
                          >
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            {/* Status row: connection + speaking */}
            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionState === ConnectionState.Connected
                        ? 'bg-yellow-500 shadow-[0_0_6px_rgba(255,223,0,0.5)]'
                        : 'bg-red-500'
                    }`}
                  />
                  {isListening && (
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-500/70 animate-ping" />
                  )}
                </div>
                <span className="text-xs text-[#6C7070] truncate">
                  {connectionState === ConnectionState.Connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {(isPlaying || isProcessing) && (
                <div className="flex items-center space-x-1 text-yellow-500/90 text-xs">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse shrink-0" />
                  <span>{isProcessing ? 'Processing...' : 'Speaking...'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 animate-[fadeIn_0.8s_ease-in]">
                <div className="relative w-24 h-24 mx-auto">
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,223,0,0.2) 0%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute inset-4 rounded-full animate-pulse delay-75"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,223,0,0.15) 0%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute inset-8 rounded-full animate-pulse delay-150"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,223,0,0.1) 0%, transparent 70%)',
                    }}
                  />
                </div>
                <p className="text-[#6C7070]">Start speaking...</p>
                <p className="text-xs text-gray-500">
                  Your conversation will appear here
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl transition-colors duration-300 ${
                    message.isUser
                      ? 'bg-[#3E4343] text-white hover:border-yellow-500/20 border border-transparent'
                      : 'bg-[#0E1313]/60 text-[#e5e5e5] border border-[#3E4343]/50'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Mic Control */}
        <div className="border-t border-[#3E4343]/50 p-6">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={toggleMute}
              size="lg"
              className={`rounded-full w-16 h-16 border-0 transition-all duration-300 transform hover:scale-[1.02] ${
                isMuted
                  ? 'bg-[#3E4343] text-red-400 hover:bg-[#4a5151] hover:text-red-300'
                  : 'bg-[#3E4343] text-yellow-500 hover:bg-[#4a5151] hover:text-yellow-400'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {isMuted
                ? 'Click to unmute and start talking'
                : 'Listening... Speak naturally'}
            </p>
          </div>

          {/* Audio Visualizer */}
          {isListening && !isMuted && (
            <div className="flex justify-center items-center space-x-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-yellow-500/70 rounded-full animate-pulse"
                  style={{
                    height: '8px',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
        </Card>
      </div>
    </div>
  );
}
