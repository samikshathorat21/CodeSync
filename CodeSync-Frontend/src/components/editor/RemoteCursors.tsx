import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorPosition } from '@/types/collaboration';

interface RemoteCursorsProps {
  cursors: Map<string, CursorPosition>;
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ cursors }) => {
  // This component renders an overlay showing remote cursor info
  // The actual cursor decorations are handled in CodeEditor
  
  if (cursors.size === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
      <AnimatePresence>
        {Array.from(cursors.values()).map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium"
            style={{ 
              backgroundColor: `${cursor.color}20`,
              borderLeft: `3px solid ${cursor.color}`,
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: cursor.color }}
            />
            <span className="text-foreground/80">
              {cursor.userName} • Line {cursor.line}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
