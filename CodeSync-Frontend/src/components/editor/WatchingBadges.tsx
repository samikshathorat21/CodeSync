import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';

interface ViewportUser {
  userId: string;
  userName: string;
  color: string;
  startLine: number;
  endLine: number;
}

interface WatchingBadgesProps {
  viewports: Map<string, ViewportUser>;
}

export const WatchingBadges: React.FC<WatchingBadgesProps> = ({ viewports }) => {
  const users = Array.from(viewports.values());
  
  if (users.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1.5 max-w-[300px]">
      <AnimatePresence mode="popLayout">
        {users.map((user) => (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            layout
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-md"
            style={{ 
              backgroundColor: `${user.color}20`,
              borderColor: user.color,
              borderWidth: '1px',
            }}
          >
            <Eye className="w-3 h-3" style={{ color: user.color }} />
            <span className="text-foreground/90">{user.userName}</span>
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{ 
                backgroundColor: `${user.color}30`,
                color: user.color,
              }}
            >
              L{user.startLine}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
