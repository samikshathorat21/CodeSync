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

interface ViewportIndicatorProps {
  viewports: Map<string, ViewportUser>;
  totalLines: number;
}

export const ViewportIndicator: React.FC<ViewportIndicatorProps> = ({ viewports, totalLines }) => {
  const users = Array.from(viewports.values());
  
  if (users.length === 0 || totalLines === 0) return null;

  return (
    <div className="absolute top-0 right-12 h-full w-3 z-10 pointer-events-none">
      {/* Minimap track */}
      <div className="relative h-full bg-card/30 rounded-sm overflow-hidden">
        <AnimatePresence>
          {users.map((user) => {
            const startPercent = Math.max(0, ((user.startLine - 1) / totalLines) * 100);
            const heightPercent = Math.max(2, ((user.endLine - user.startLine + 1) / totalLines) * 100);
            
            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute left-0 right-0 rounded-sm group cursor-default pointer-events-auto"
                style={{
                  top: `${startPercent}%`,
                  height: `${Math.min(heightPercent, 100 - startPercent)}%`,
                  minHeight: '8px',
                  backgroundColor: `${user.color}40`,
                  borderLeft: `2px solid ${user.color}`,
                }}
              >
                {/* Tooltip on hover */}
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div 
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-lg"
                    style={{ 
                      backgroundColor: user.color,
                      color: 'white',
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{user.userName}</span>
                    <span className="opacity-75">L{user.startLine}-{user.endLine}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
