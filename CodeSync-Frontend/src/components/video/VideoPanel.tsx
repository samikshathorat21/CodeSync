import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Users,
  X,
  Loader2,
  Monitor,
  MonitorOff,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, RoomPermissions } from '@/types/collaboration';
import { useWebRTC } from '@/hooks/useWebRTC';
import { stompClient } from '@/integrations/api/stomp';
import { useAudioLevel, useRemoteSpeaking } from '@/hooks/useAudioLevel';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoPanelProps {
  participants: User[];
  currentUserId: string;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  permissions: RoomPermissions;
  isHost: boolean;
}

interface LocalVideoState {
  isCameraOn: boolean;
  isMicOn: boolean;
}

const VideoTile: React.FC<{
  stream: MediaStream | null;
  participant: User;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
}> = ({ stream, participant, isLocal, isMuted, isCameraOff, isSpeaking }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`video-tile aspect-video bg-video-overlay relative overflow-hidden transition-all duration-200 ${
        isSpeaking ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''
      }`}
    >
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
              isSpeaking ? 'scale-110 ring-4 ring-green-500/50' : ''
            }`}
            style={{
              backgroundColor: participant.color,
              color: 'hsl(var(--background))',
            }}
          >
            {participant.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Speaking indicator pulse */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse" />
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1.5">
        {isSpeaking && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        {isLocal ? 'You' : participant.name}
        {participant.isHost && (
          <span className="text-[10px] text-primary">(Host)</span>
        )}
      </div>

      {/* Mic indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/80">
          <MicOff className="w-3 h-3" />
        </div>
      )}

      {/* Camera off indicator */}
      {isCameraOff && (
        <div className="absolute top-2 left-2 p-1.5 rounded-full bg-muted/80">
          <VideoOff className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
};

const ScreenShareTile: React.FC<{
  stream: MediaStream | null;
  sharerName: string;
  isLocal: boolean;
}> = ({ stream, sharerName, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="col-span-full aspect-video bg-video-overlay relative overflow-hidden rounded-lg border-2 border-primary/50"
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Monitor className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      {/* Screen share badge */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1.5 text-primary-foreground">
        <Monitor className="w-3 h-3" />
        {isLocal ? 'Your screen' : `${sharerName}'s screen`}
      </div>
    </motion.div>
  );
};


export const VideoPanel: React.FC<VideoPanelProps> = ({
  participants,
  currentUserId,
  roomId,
  isOpen,
  onClose,
  permissions,
  isHost,
}) => {
  const [localState, setLocalState] = useState<LocalVideoState>({
    isCameraOn: true,
    isMicOn: true,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    localStream = null,
    screenStream = null,
    remoteStreams = new Map(),
    remoteScreenStreams = new Map(),
    isConnecting = false,
    isScreenSharing = false,
    error = null,
    startCall = async () => {},
    endCall = () => {},
    startScreenShare = async () => {},
    stopScreenShare = () => {},
    toggleVideo = () => {},
    toggleAudio = () => {},
    broadcastMediaState = () => {},
  } = (useWebRTC(roomId, currentUserId) as any) || {};

  // Speaking detection
  const isLocalSpeaking = useAudioLevel(localStream);
  const remoteSpeakingUsers = useRemoteSpeaking(remoteStreams);

  const isInCall = !!localStream;

  // Check if mic is allowed by permissions (host always allowed)
  const canUseMic = isHost || permissions.canAudio;

  // Auto-mute if permission is revoked
  useEffect(() => {
    if (!canUseMic && localState.isMicOn && isInCall) {
      setLocalState((prev) => ({ ...prev, isMicOn: false }));
      toggleAudio(false);
      toast.warning('Microphone disabled by host');
    }
  }, [canUseMic, localState.isMicOn, isInCall, toggleAudio]);

  // Broadcast speaking state
  useEffect(() => {
    if (isInCall && stompClient.connected) {
      broadcastMediaState(localState.isMicOn, localState.isCameraOn, isLocalSpeaking);
    }
  }, [isLocalSpeaking, localState.isMicOn, localState.isCameraOn, isInCall, broadcastMediaState]);

  const handleToggleCamera = () => {
    const newState = !localState.isCameraOn;
    setLocalState((prev) => ({ ...prev, isCameraOn: newState }));
    toggleVideo(newState);
  };

  const handleToggleMic = () => {
    if (!canUseMic) {
      toast.error('Microphone is disabled by the host');
      return;
    }
    const newState = !localState.isMicOn;
    setLocalState((prev) => ({ ...prev, isMicOn: newState }));
    toggleAudio(newState);
  };

  const handleToggleCall = async () => {
    if (isInCall) {
      endCall();
      toast.info('Left the video call');
    } else {
      await startCall();
      if (!error) {
        toast.success('Joined video call');
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      toast.info('Stopped screen sharing');
    } else {
      await startScreenShare();
      toast.success('Started screen sharing');
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const currentUser = participants.find((p) => p.id === currentUserId);

  // Get remote participants with streams
  const remoteParticipants = participants.filter(
    (p) => p.id !== currentUserId && remoteStreams.has(p.id)
  );

  // Check if anyone is sharing their screen
  const hasScreenShare = isScreenSharing || remoteScreenStreams.size > 0;
  const screenShareUserId = isScreenSharing 
    ? currentUserId 
    : Array.from(remoteScreenStreams.keys())[0];
  const activeScreenStream = isScreenSharing 
    ? screenStream 
    : remoteScreenStreams.get(screenShareUserId || '');

  const totalParticipants = isInCall
    ? 1 + remoteParticipants.length
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`${
            isExpanded ? 'w-96' : 'w-72'
          } h-full bg-sidebar border-l border-sidebar-border flex flex-col transition-all duration-300`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <span className="font-semibold">Video Call</span>
              {isInCall && (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="iconSm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-3 overflow-y-auto scrollbar-thin">
            {isInCall ? (
              <div className="flex flex-col gap-2">
                {/* Screen Share (if active) */}
                {hasScreenShare && activeScreenStream && (
                  <ScreenShareTile
                    stream={activeScreenStream}
                    sharerName={
                      screenShareUserId === currentUserId 
                        ? 'You' 
                        : participants.find(p => p.id === screenShareUserId)?.name || 'Unknown'
                    }
                    isLocal={screenShareUserId === currentUserId}
                  />
                )}

                {/* Video tiles grid */}
                <div
                  className={`grid gap-2 ${
                    totalParticipants <= 2 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}
                >
                  {/* Local video */}
                  {currentUser && (
                    <VideoTile
                      stream={localStream}
                      participant={currentUser}
                      isLocal={true}
                      isMuted={!localState.isMicOn}
                      isCameraOff={!localState.isCameraOn}
                      isSpeaking={isLocalSpeaking && localState.isMicOn}
                    />
                  )}

                  {/* Remote videos */}
                  {remoteParticipants.map((participant) => (
                    <VideoTile
                      key={participant.id}
                      stream={remoteStreams.get(participant.id) || null}
                      participant={participant}
                      isLocal={false}
                      isMuted={false}
                      isCameraOff={false}
                      isSpeaking={remoteSpeakingUsers.has(participant.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                {isConnecting ? (
                  <>
                    <Loader2 className="w-12 h-12 mb-3 animate-spin text-primary" />
                    <p className="text-sm font-medium mb-1">Connecting...</p>
                    <p className="text-xs text-center">
                      Setting up video call
                    </p>
                  </>
                ) : (
                  <>
                    <Users className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">Not in a call</p>
                    <p className="text-xs text-center">
                      Start a video call to collaborate face-to-face
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Button
                        variant={!canUseMic ? 'outline' : localState.isMicOn ? 'secondary' : 'destructive'}
                        size="icon"
                        onClick={handleToggleMic}
                        disabled={!isInCall}
                        className={`rounded-full ${!canUseMic ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {localState.isMicOn && canUseMic ? (
                          <Mic className="w-5 h-5" />
                        ) : (
                          <MicOff className="w-5 h-5" />
                        )}
                      </Button>
                      {!canUseMic && (
                        <div className="absolute -top-1 -right-1">
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!canUseMic ? 'Microphone disabled by host' : localState.isMicOn ? 'Mute' : 'Unmute'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant={isInCall ? 'destructive' : 'glow'}
                size="iconLg"
                onClick={handleToggleCall}
                disabled={isConnecting}
                className="rounded-full"
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isInCall ? (
                  <PhoneOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant={localState.isCameraOn ? 'secondary' : 'destructive'}
                size="icon"
                onClick={handleToggleCamera}
                disabled={!isInCall}
                className="rounded-full"
              >
                {localState.isCameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant={isScreenSharing ? 'destructive' : 'secondary'}
                size="icon"
                onClick={handleToggleScreenShare}
                disabled={!isInCall}
                className="rounded-full"
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                {isScreenSharing ? (
                  <MonitorOff className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
              </Button>
            </div>

            {!isInCall && !isConnecting && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Click to start video call
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
