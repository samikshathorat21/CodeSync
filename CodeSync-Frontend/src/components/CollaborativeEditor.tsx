import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/hooks/useRoom';
import { useRoomPermissions } from '@/hooks/useRoomPermissions';
import { apiClient } from '@/integrations/api/http';
import { ExecutionResult, Language, RoomPermissions } from '@/types/collaboration';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChatPanel } from './chat/ChatPanel';
import { CodeEditor } from './editor/CodeEditor';
import { EditorToolbar } from './editor/EditorToolbar';
import { OutputPanel } from './editor/OutputPanel';
import { RemoteCursors } from './editor/RemoteCursors';
import { TypingIndicator } from './editor/TypingIndicator';
import { WatchingBadges } from './editor/WatchingBadges';
import { ParticipantsList } from './presence/ParticipantsList';
import { HostControls } from './room/HostControls';
import { JoinRoomDialog } from './room/JoinRoomDialog';
import { RoomHeader } from './room/RoomHeader';
import { VideoPanel } from './video/VideoPanel';

export const CollaborativeEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    room,
    currentUser,
    code,
    language,
    messages,
    cursors,
    typingUsers,
    viewports,
    isConnected,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    updateCode,
    updateLanguage,
    sendMessage,
    updateCursor,
    broadcastTyping,
    broadcastViewport,
    saveVersion,
  } = useRoom();
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = currentUser?.isHost ?? false;
  
  const { permissions, updatePermission, loading: permLoading } = useRoomPermissions({
    roomId: room?.id ?? null,
    isHost,
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [stdin, setStdin] = useState('');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Handle pending invite from /join page
  useEffect(() => {
    const handlePendingInvite = async () => {
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (!pendingInvite || !user) return;

      try {
        const { roomId, userName } = JSON.parse(pendingInvite);
        sessionStorage.removeItem('pendingInvite');
        
        // Join the room via invite
        const result = await joinRoom(roomId, userName);
        if (result) {
          toast.success('Joined room via invite!');
        }
      } catch (error) {
        console.error('Failed to process invite:', error);
        sessionStorage.removeItem('pendingInvite');
      }
    };

    if (user && !isConnected) {
      handlePendingInvite();
    }
  }, [user, isConnected, joinRoom]);

  const handleCreateRoom = async (userName: string) => {
    // We use a default name/language for now as the dialog doesn't provide them
    const result = await createRoom(`${userName}'s Room`, 'java');
    if (result) {
      toast.success(`Room created! ID: ${result.id}`);
    }
  };

  const handleJoinRoom = async (roomId: string, userName: string) => {
    const result = await joinRoom(roomId, userName);
    if (result) {
      toast.success('Joined room successfully!');
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    toast.info('Left the room');
  };

  const handleKickUser = useCallback(async (userId: string) => {
    if (!room || !isHost) return;
    
    try {
      await apiClient.delete(`/api/rooms/${room.id}/participants/${userId}`);
      toast.success('User removed from room');
    } catch (error: any) {
      toast.error('Failed to remove user');
    }
  }, [room, isHost]);

  const handleEndRoom = useCallback(async () => {
    if (!room || !isHost) return;
    
    try {
      await apiClient.delete(`/api/rooms/${room.id}`);
      await leaveRoom();
      toast.info('Room ended for all participants');
    } catch (error: any) {
      toast.error('Failed to end room');
    }
  }, [room, isHost, leaveRoom]);

  const handleRunCode = async () => {
    // Check permission for non-hosts
    if (!isHost && !permissions.canExecute) {
      toast.error('Code execution is disabled by the host');
      return;
    }

    setIsRunning(true);
    setIsOutputVisible(true);
    setExecutionResult(null);

    try {
      const response = await apiClient.post('/api/execute', {
        code, 
        language,
        stdin,
        roomId: room?.id,
      });

      const data = response.data;
      setExecutionResult({
        output: data.output || '(No output)',
        error: data.error,
        executionTime: data.executionTime || 0,
        memoryUsed: data.memoryUsed,
      });
    } catch (err: any) {
      setExecutionResult({
        output: '',
        error: err.response?.data?.error || err.message || 'Failed to execute code',
        executionTime: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCodeChange = useCallback((newCode: string) => {
    // Check permission for non-hosts
    if (!isHost && !permissions.canEdit) {
      return; // Silently ignore - editor is already read-only
    }
    updateCode(newCode);
    
    // Broadcast typing indicator
    broadcastTyping(true);
    
    // Clear existing timeout and set new one to stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 1500);
  }, [isHost, permissions.canEdit, updateCode, broadcastTyping]);

  const handleSendMessage = useCallback((content: string) => {
    if (!isHost && !permissions.canChat) {
      toast.error('Chat is disabled by the host');
      return;
    }
    sendMessage(content);
  }, [isHost, permissions.canChat, sendMessage]);

  const handleSave = async () => {
    await saveVersion();
  };

  const handleShowHistory = () => {
    toast.info('Version history coming soon!');
  };

  const handleUpdatePermission = (key: keyof RoomPermissions, value: boolean) => {
    updatePermission(key, value);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show join dialog if not connected
  if (!isConnected || !room || !currentUser) {
    return (
      <JoinRoomDialog 
        onCreateRoom={handleCreateRoom} 
        onJoinRoom={handleJoinRoom}
        isLoading={loading}
      />
    );
  }

  const canEdit = isHost || permissions.canEdit;
  const canExecute = isHost || permissions.canExecute;
  const canChat = isHost || permissions.canChat;
  const canVideo = isHost || permissions.canVideo;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <RoomHeader
        room={room}
        onLeave={handleLeaveRoom}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleVideo={() => {
          if (!canVideo) {
            toast.error('Video is disabled by the host');
            return;
          }
          setIsVideoOpen(!isVideoOpen);
        }}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onToggleHostControls={() => setIsHostControlsOpen(!isHostControlsOpen)}
        isChatOpen={isChatOpen}
        isVideoOpen={isVideoOpen}
        isParticipantsOpen={isParticipantsOpen}
        isHost={isHost}
        permissions={permissions}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <EditorToolbar
            language={language}
            onLanguageChange={(lang: Language, newCode: string) => updateLanguage(lang, newCode)}
            onRun={handleRunCode}
            onSave={handleSave}
            onShowHistory={handleShowHistory}
            isRunning={isRunning}
            participants={room.participants}
            currentCode={code}
            canExecute={canExecute}
            canEdit={canEdit}
            isHost={isHost}
          />

          {/* Editor with permission overlay */}
          <div className="flex-1 min-h-0 relative">
            <CodeEditor
              code={code}
              language={language}
              onChange={handleCodeChange}
              onViewportChange={broadcastViewport}
              onCursorChange={updateCursor}
              viewports={viewports}
              cursors={cursors}
              currentUserId={currentUser?.id}
              readOnly={!canEdit}
            />
            {!canEdit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-14 flex items-center gap-2 px-3 py-1.5 bg-muted/80 backdrop-blur-sm rounded-md border border-border"
              >
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Read-only mode</span>
              </motion.div>
            )}
            
            {/* Remote Cursors Indicator */}
            <RemoteCursors cursors={cursors} />
            
            {/* Watching Badges */}
            <WatchingBadges viewports={viewports} />
            
            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />
          </div>

          {/* Output Panel */}
          <OutputPanel
            result={executionResult}
            isVisible={isOutputVisible}
            isExpanded={isOutputExpanded}
            onToggleExpand={() => setIsOutputExpanded(!isOutputExpanded)}
            onClose={() => setIsOutputVisible(false)}
            stdin={stdin}
            onStdinChange={setStdin}
          />
        </div>

        {/* Side Panels */}
        <ParticipantsList
          participants={room.participants}
          currentUserId={currentUser.id}
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          isHost={currentUser.isHost}
        />

        <ChatPanel
          messages={messages}
          currentUserId={currentUser.id}
          onSendMessage={handleSendMessage}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          participants={room.participants}
          disabled={!canChat}
        />

        <VideoPanel
          participants={room.participants}
          currentUserId={currentUser.id}
          roomId={room.id}
          isOpen={isVideoOpen && canVideo}
          onClose={() => setIsVideoOpen(false)}
          permissions={permissions}
          isHost={isHost}
        />

        {/* Host Controls Panel */}
        {isHost && (
          <HostControls
            isOpen={isHostControlsOpen}
            onClose={() => setIsHostControlsOpen(false)}
            permissions={permissions}
            onUpdatePermission={handleUpdatePermission}
            participants={room.participants}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            roomId={room.id}
            roomName={room.name}
            onKickUser={handleKickUser}
            onEndRoom={handleEndRoom}
            loading={permLoading}
          />
        )}
      </div>
    </div>
  );
};
