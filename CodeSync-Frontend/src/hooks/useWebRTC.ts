import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { stompClient } from '@/integrations/api/stomp';
import { apiClient } from '@/integrations/api/http';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useWebRTC = (roomId?: string, userId?: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [iceServers, setIceServers] = useState<any[]>([]);
  const subscriptions = useRef<any[]>([]);

  const fetchIceServers = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await apiClient.get(`/api/webrtc/ice-servers?roomId=${roomId}`);
      setIceServers(response.data.iceServers);
    } catch (error) {
      console.error('Failed to fetch ICE servers', error);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !user) return;

    fetchIceServers();

    if (stompClient.connected) {
      const subs = [
        stompClient.subscribe(`/user/queue/webrtc`, (msg) => {
          const data = JSON.parse(msg.body);
          // Handle signal (handled by VideoPanel usually, but we expose the hook)
          // Custom event for VideoPanel to listen to
          window.dispatchEvent(new CustomEvent('webrtc-signal', { detail: data }));
        }),
        stompClient.subscribe(`/topic/room/${roomId}/media`, (msg) => {
          const data = JSON.parse(msg.body);
          window.dispatchEvent(new CustomEvent('webrtc-media-state', { detail: data }));
        }),
        stompClient.subscribe(`/topic/room/${roomId}/host`, (msg) => {
          const data = JSON.parse(msg.body);
          if (data.type === 'mute' && data.userId === user.id) {
            window.dispatchEvent(new CustomEvent('webrtc-mute-me'));
          }
          if (data.type === 'mute-all') {
            window.dispatchEvent(new CustomEvent('webrtc-mute-all'));
          }
          if (data.type === 'permission-change' && (data.permission === 'canAudio' || data.permission === 'canVideo') && data.value === false) {
             window.dispatchEvent(new CustomEvent('webrtc-permission-stopped', { detail: data }));
          }
        }),
      ];
      subscriptions.current = subs;
    }

    return () => {
      subscriptions.current.forEach((s) => s.unsubscribe());
    };
  }, [roomId, user, fetchIceServers]);

  const sendSignal = useCallback((toUserId: string, type: string, sdp?: any, candidate?: any, media?: any) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: `/app/webrtc/signal`,
        body: JSON.stringify({ type, toUserId, roomId, sdp, candidate, media }),
      });
    }
  }, [roomId]);

  const broadcastMediaState = useCallback((audioEnabled: boolean, videoEnabled: boolean, speaking: boolean) => {
    if (stompClient.connected) {
      stompClient.publish({
        destination: `/app/webrtc/state`,
        body: JSON.stringify({ roomId, audioEnabled, videoEnabled, speaking }),
      });
    }
  }, [roomId]);

  return {
    iceServers,
    sendSignal,
    broadcastMediaState,
  };
};
