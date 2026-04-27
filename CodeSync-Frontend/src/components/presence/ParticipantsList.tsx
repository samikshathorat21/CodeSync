import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/collaboration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ParticipantsListProps {
  participants: User[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentUserId,
  isOpen,
  onClose,
  isHost,
}) => {
  const onlineCount = participants.filter((p) => p.isOnline).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-72 h-full bg-sidebar border-l border-sidebar-border flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold">Participants</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {onlineCount} online
              </span>
            </div>
            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: participant.color,
                      color: 'hsl(var(--background))',
                    }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar ${
                      participant.isOnline ? 'bg-green-500' : 'bg-muted-foreground'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">
                      {participant.id === currentUserId
                        ? `${participant.name} (You)`
                        : participant.name}
                    </span>
                    {participant.isHost && (
                      <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {participant.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Actions (only for host) */}
                {isHost && participant.id !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Make Host</DropdownMenuItem>
                      <DropdownMenuItem>Mute</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remove from Room
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <Button variant="outline" className="w-full" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Invite Others
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
