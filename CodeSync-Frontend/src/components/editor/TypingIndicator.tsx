import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingUser {
  userName: string;
  color: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: Map<string, TypingUser>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const users = Array.from(typingUsers.values());
  
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg">
          {/* Colored dots for each typing user */}
          <div className="flex -space-x-1">
            {users.slice(0, 3).map((user, index) => (
              <motion.div
                key={index}
                className="w-2.5 h-2.5 rounded-full ring-2 ring-card"
                style={{ backgroundColor: user.color }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.15,
                }}
              />
            ))}
          </div>
          
          {/* Typing animation dots */}
          <div className="flex items-center gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 bg-muted-foreground rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          
          {/* Text */}
          <span className="text-xs text-muted-foreground ml-1">
            {getTypingText()}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
