import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { stompClient } from '@/integrations/api/stomp';
import { apiClient } from '@/integrations/api/http';
import { toast } from 'sonner';

interface PeerState {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  iceCandidateQueue: RTCIceCandidateInit[];
  hasRemoteDesc: boolean;
}

export const useWebRTC = (roomId?: string, userId?: string) => {
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const isInCallRef = useRef(false);
  const roomIdRef = useRef(roomId);
  const userIdRef = useRef(user?.id);

  // Keep refs in sync
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { userIdRef.current = user?.id; }, [user]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ── Helper: get ICE servers ──
  const getIceConfig = useCallback((): RTCConfiguration => {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }, []);

  // ── Helper: update remote streams state ──
  const updateRemoteStream = useCallback((remoteUserId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.set(remoteUserId, stream);
      return next;
    });
  }, []);

  // ── Helper: remove remote stream ──
  const removeRemoteStream = useCallback((remoteUserId: string) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(remoteUserId);
      return next;
    });
  }, []);

  // ── Helper: send WebRTC signal via STOMP ──
  const sendSignal = useCallback((type: string, toUserId: string, payload: any = {}) => {
    if (!stompClient.connected || !roomIdRef.current) return;
    console.log(`[WebRTC] Sending ${type} to ${toUserId}`);
    stompClient.publish({
      destination: '/app/webrtc/signal',
      body: JSON.stringify({
        type,
        toUserId,
        roomId: roomIdRef.current,
        ...payload,
      }),
    });
  }, []);

  // ── Helper: flush queued ICE candidates ──
  const flushIceCandidates = useCallback(async (peer: PeerState) => {
    while (peer.iceCandidateQueue.length > 0) {
      const candidate = peer.iceCandidateQueue.shift()!;
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Error adding queued ICE candidate', err);
      }
    }
  }, []);

  // ── Create a new peer connection ──
  const createPeerConnection = useCallback((remoteUserId: string): PeerState => {
    // Clean up existing peer if any
    const existing = peersRef.current.get(remoteUserId);
    if (existing) {
      existing.pc.close();
    }

    console.log(`[WebRTC] Creating peer connection for ${remoteUserId}`);
    const pc = new RTCPeerConnection(getIceConfig());
    const remoteStream = new MediaStream();

    const peerState: PeerState = {
      pc,
      remoteStream,
      iceCandidateQueue: [],
      hasRemoteDesc: false,
    };

    // Add our local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[WebRTC] Adding local track: ${track.kind}`);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // When remote sends tracks, add them to remoteStream
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track: ${event.track.kind} from ${remoteUserId}`);
      event.track.onunmute = () => {
        if (!remoteStream.getTrackById(event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        updateRemoteStream(remoteUserId, remoteStream);
      };
      if (!remoteStream.getTrackById(event.track.id)) {
        remoteStream.addTrack(event.track);
      }
      updateRemoteStream(remoteUserId, remoteStream);
    };

    // When we discover an ICE candidate, send it to the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', remoteUserId, {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state for ${remoteUserId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE failed for ${remoteUserId}, attempting restart`);
        pc.restartIce();
      }
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        removeRemoteStream(remoteUserId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${remoteUserId}: ${pc.connectionState}`);
    };

    peersRef.current.set(remoteUserId, peerState);
    return peerState;
  }, [getIceConfig, updateRemoteStream, removeRemoteStream, sendSignal]);

  // ── Initiate a call to a remote user (send offer) ──
  const callUser = useCallback(async (remoteUserId: string) => {
    const peer = createPeerConnection(remoteUserId);
    try {
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      console.log(`[WebRTC] Sending offer to ${remoteUserId}`);
      sendSignal('offer', remoteUserId, {
        sdp: offer.sdp,
        media: { audio: true, video: true },
      });
    } catch (err) {
      console.error('[WebRTC] Error creating offer', err);
    }
  }, [createPeerConnection, sendSignal]);

  // ── Handle incoming signals ──
  const handleSignalRef = useRef<(data: any) => Promise<void>>();
  
  handleSignalRef.current = async (data: any) => {
    if (!isInCallRef.current || !userIdRef.current) return;
    const fromUserId = data.fromUserId;
    if (!fromUserId || fromUserId === userIdRef.current) return;

    console.log(`[WebRTC] Received signal: ${data.type} from ${fromUserId}`);

    if (data.type === 'offer') {
      // Someone is calling us — create peer and answer
      const peer = createPeerConnection(fromUserId);
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        peer.hasRemoteDesc = true;
        await flushIceCandidates(peer);

        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        console.log(`[WebRTC] Sending answer to ${fromUserId}`);
        sendSignal('answer', fromUserId, { sdp: answer.sdp });
      } catch (err) {
        console.error('[WebRTC] Error handling offer', err);
      }

    } else if (data.type === 'answer') {
      const peer = peersRef.current.get(fromUserId);
      if (peer) {
        try {
          await peer.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
          peer.hasRemoteDesc = true;
          await flushIceCandidates(peer);
          console.log(`[WebRTC] Answer processed from ${fromUserId}`);
        } catch (err) {
          console.error('[WebRTC] Error handling answer', err);
        }
      }

    } else if (data.type === 'ice-candidate') {
      const peer = peersRef.current.get(fromUserId);
      if (peer && data.candidate) {
        if (peer.hasRemoteDesc) {
          try {
            await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('[WebRTC] Error adding ICE candidate', err);
          }
        } else {
          // Queue it — remote description hasn't been set yet
          console.log(`[WebRTC] Queuing ICE candidate from ${fromUserId}`);
          peer.iceCandidateQueue.push(data.candidate);
        }
      }
    }
  };

  // ── STOMP subscriptions (stable — no dependency on callbacks) ──
  useEffect(() => {
    if (!roomId || !user || !stompClient.connected) return;

    console.log(`[WebRTC] Setting up subscriptions for room ${roomId}`);

    // 1. Listen for WebRTC signals
    const signalSub = stompClient.subscribe(`/topic/room/${roomId}/webrtc/signal`, (msg) => {
      const data = JSON.parse(msg.body);
      if (data.toUserId === user.id) {
        handleSignalRef.current?.(data);
      }
    });

    // 2. Listen for new users joining the call
    const joinSub = stompClient.subscribe(`/topic/room/${roomId}/webrtc/join`, (msg) => {
      const data = JSON.parse(msg.body);
      if (data.userId !== user.id && isInCallRef.current) {
        console.log(`[WebRTC] User ${data.userId} joined call, initiating connection`);
        // Small delay to ensure the other user's subscriptions are ready
        setTimeout(() => {
          callUser(data.userId);
        }, 500);
      }
    });

    return () => {
      signalSub.unsubscribe();
      joinSub.unsubscribe();
    };
  }, [roomId, user]); // Minimal deps — handlers use refs

  // ── Start Call ──
  const startCall = useCallback(async () => {
    if (!roomId || !user) return;
    setIsConnecting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      isInCallRef.current = true;
      setIsConnecting(false);

      console.log('[WebRTC] Local media acquired, announcing join');

      // Small delay to ensure state is settled, then announce
      setTimeout(() => {
        if (stompClient.connected) {
          stompClient.publish({
            destination: `/app/room/${roomId}/webrtc/join`,
            body: JSON.stringify({ userId: user.id }),
          });
        }
      }, 300);

    } catch (err: any) {
      console.error('[WebRTC] Error getting user media', err);
      setError('Could not access camera/microphone. Please check permissions.');
      setIsConnecting(false);
    }
  }, [roomId, user]);

  // ── End Call ──
  const endCall = useCallback(() => {
    isInCallRef.current = false;

    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    // Close all peer connections
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());

    // Stop screen share
    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [screenStream]);

  // ── Toggle Video ──
  const toggleVideo = useCallback((enabled?: boolean) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
  }, []);

  // ── Toggle Audio ──
  const toggleAudio = useCallback((enabled?: boolean) => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
  }, []);

  // ── Screen Share ──
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setIsScreenSharing(true);
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('[WebRTC] Screen share error', err);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [screenStream]);

  // ── Broadcast media state ──
  const broadcastMediaState = useCallback((audioEnabled: boolean, videoEnabled: boolean, speaking: boolean) => {
    if (stompClient.connected && roomIdRef.current) {
      stompClient.publish({
        destination: '/app/webrtc/state',
        body: JSON.stringify({ roomId: roomIdRef.current, audioEnabled, videoEnabled, speaking }),
      });
    }
  }, []);

  return {
    localStream,
    screenStream,
    remoteStreams,
    remoteScreenStreams,
    isConnecting,
    isScreenSharing,
    error,
    startCall,
    endCall,
    startScreenShare,
    stopScreenShare,
    toggleVideo,
    toggleAudio,
    broadcastMediaState,
  };
};
