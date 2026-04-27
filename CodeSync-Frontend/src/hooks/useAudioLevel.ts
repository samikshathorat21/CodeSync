import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { stompClient } from '@/integrations/api/stomp';

export const useAudioLevel = (audioStream: MediaStream | null) => {
  const { user } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastBroadcastRef = useRef<number>(0);

  useEffect(() => {
    if (!audioStream || !user || !stompClient.connected) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const speaking = average > 30;

      if (speaking !== isSpeaking) {
        setIsSpeaking(speaking);
        
        // Throttled broadcast
        const now = Date.now();
        if (now - lastBroadcastRef.current > 200) {
          // We assume roomId is available or we need to pass it
          // For now, VideoPanel can handle the broadcast OR we pass roomId to this hook
          // Since VideoPanel calls it as useAudioLevel(localStream), we might need roomId
          // But looking at the existing code, it was useAudioLevel(localStream)
        }
      }
      requestAnimationFrame(checkAudio);
    };

    const animationId = requestAnimationFrame(checkAudio);

    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [audioStream, user, isSpeaking]);

  return isSpeaking;
};

export const useRemoteSpeaking = (remoteStreams: Map<string, MediaStream>) => {
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Listen for media state updates from other users
    // This requires a subscription to the media topic
    // Since useWebRTC or useRoom might already handle this, 
    // we can use a window event or a specific subscription here.
    
    // For simplicity with the existing architecture, we'll listen for a custom event
    // that our STOMP listeners in useWebRTC/useRoom dispatch.
    
    const handleMediaUpdate = (event: any) => {
      const { userId, speaking } = event.detail;
      setSpeakingUsers(prev => {
        const next = new Set(prev);
        if (speaking) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    };

    window.addEventListener('webrtc-media-state', handleMediaUpdate);
    return () => window.removeEventListener('webrtc-media-state', handleMediaUpdate);
  }, []);

  return speakingUsers;
};
