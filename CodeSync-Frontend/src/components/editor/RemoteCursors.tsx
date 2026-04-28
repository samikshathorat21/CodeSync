import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorPosition } from '@/types/collaboration';

interface RemoteCursorsProps {
  cursors: Map<string, CursorPosition>;
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ cursors }) => {
  if (cursors.size === 0) return null;

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-none">
      <AnimatePresence>
        {Array.from(cursors.values()).map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md border border-white/10 shadow-lg"
            style={{ 
              backgroundColor: `${cursor.color}15`,
              color: cursor.color,
            }}
          >
            <div 
              className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: 'currentColor' }}
            />
            <span className="max-w-[120px] truncate">
              {cursor.userName}
            </span>
            <span className="opacity-60 font-normal">
              Line {cursor.line}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
