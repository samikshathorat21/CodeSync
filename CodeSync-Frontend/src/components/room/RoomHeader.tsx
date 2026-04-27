import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  LogOut,
  MessageSquare,
  Video,
  Users,
  Code2,
  Share2,
  Settings,
  Crown,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Room, RoomPermissions } from '@/types/collaboration';
import { toast } from 'sonner';
import { InviteDialog } from './InviteDialog';

interface RoomHeaderProps {
  room: Room;
  onLeave: () => void;
  onToggleChat: () => void;
  onToggleVideo: () => void;
  onToggleParticipants: () => void;
  onToggleHostControls?: () => void;
  isChatOpen: boolean;
  isVideoOpen: boolean;
  isParticipantsOpen: boolean;
  isHost?: boolean;
  permissions?: RoomPermissions;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  onLeave,
  onToggleChat,
  onToggleVideo,
  onToggleParticipants,
  onToggleHostControls,
  isChatOpen,
  isVideoOpen,
  isParticipantsOpen,
  isHost = false,
  permissions,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    toast.success('Room ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const onlineCount = room.participants.filter((p) => p.isOnline).length;
  const canVideo = isHost || (permissions?.canVideo ?? true);
  const canChat = isHost || (permissions?.canChat ?? true);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 bg-card/80 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-4"
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Code2 className="w-6 h-6" />
          <span className="font-bold text-lg">CodeSync</span>
        </div>

        <div className="h-6 w-px bg-border/50" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{room.name}</span>
          {isHost && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Crown className="w-3 h-3 text-yellow-500" />
              Host
            </Badge>
          )}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={copyRoomId}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
          {room.id}
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Host controls button */}
        {isHost && onToggleHostControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleHostControls}
            className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Controls</span>
          </Button>
        )}

        {/* Panel toggles */}
        <Button
          variant={isParticipantsOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleParticipants}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          <span className="hidden md:inline">{onlineCount}</span>
        </Button>

        <Button
          variant={isChatOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleChat}
          className="gap-2 relative"
          disabled={!canChat && !isHost}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden md:inline">Chat</span>
          {!canChat && !isHost && (
            <Lock className="w-3 h-3 absolute -top-1 -right-1 text-muted-foreground" />
          )}
        </Button>

        <Button
          variant={isVideoOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleVideo}
          className="gap-2 relative"
          disabled={!canVideo && !isHost}
        >
          <Video className="w-4 h-4" />
          <span className="hidden md:inline">Video</span>
          {!canVideo && !isHost && (
            <Lock className="w-3 h-3 absolute -top-1 -right-1 text-muted-foreground" />
          )}
        </Button>

        <div className="h-6 w-px bg-border/50 mx-2" />

        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setInviteDialogOpen(true)}
          disabled={!isHost}
          title={!isHost ? 'Only the host can invite others' : 'Invite others to this room'}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden md:inline">Invite</span>
        </Button>

        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          roomId={room.id}
        />

        <Button variant="danger" size="sm" onClick={onLeave} className="gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Leave</span>
        </Button>
      </div>
    </motion.header>
  );
};
