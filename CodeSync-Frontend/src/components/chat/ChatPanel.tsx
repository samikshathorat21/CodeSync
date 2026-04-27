import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, User } from '@/types/collaboration';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
  participants: User[];
  disabled?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  isOpen,
  onClose,
  participants,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getUserColor = (userId: string) => {
    const user = participants.find((p) => p.id === userId);
    return user?.color || 'hsl(var(--muted))';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-80 h-full bg-sidebar border-l border-sidebar-border flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-semibold">Chat</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            </div>
            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.userId === currentUserId;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-background"
                          style={{ backgroundColor: getUserColor(message.userId) }}
                        >
                          {message.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {message.userName}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-chat-other text-foreground rounded-bl-md'
                      }`}
                    >
                      {message.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            {disabled ? (
              <div className="text-center text-sm text-muted-foreground py-2">
                Chat is disabled by the host
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary/50 border-border/50"
                />
                <Button
                  variant="glow"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
