import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Users, ArrowRight, Sparkles, Zap, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

interface JoinRoomDialogProps {
  onCreateRoom: (userName: string) => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  isLoading?: boolean;
}

export const JoinRoomDialog: React.FC<JoinRoomDialogProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}) => {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState(user?.username || user?.email?.split('@')[0] || '');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const handleCreate = () => {
    if (userName.trim()) {
      onCreateRoom(userName.trim());
    }
  };

  const handleJoin = () => {
    if (userName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim(), userName.trim());
    }
  };

  const features = [
    { icon: Zap, text: 'Real-time sync', color: 'text-yellow-400' },
    { icon: Users, text: 'Video calls', color: 'text-blue-400' },
    { icon: Shield, text: 'Secure execution', color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-gradient-primary">Code</span>
                <span className="text-foreground">Sync</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Collaborative Code Editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* User info */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4"
          >
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{user.email}</span>
            </p>
            <button 
              onClick={signOut}
              className="text-xs text-primary hover:underline mt-1"
            >
              Sign out
            </button>
          </motion.div>
        )}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6 bg-secondary/50">
              <TabsTrigger value="create" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Create Room
              </TabsTrigger>
              <TabsTrigger value="join" className="gap-2">
                <Users className="w-4 h-4" />
                Join Room
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Your Display Name</Label>
                <Input
                  id="create-name"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <Button
                variant="glow"
                size="lg"
                className="w-full mt-6"
                onClick={handleCreate}
                disabled={!userName.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create New Room
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">Your Display Name</Label>
                <Input
                  id="join-name"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-id">Room ID</Label>
                <Input
                  id="room-id"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-secondary/50 font-mono"
                />
              </div>

              <Button
                variant="glow"
                size="lg"
                className="w-full mt-6"
                onClick={handleJoin}
                disabled={!userName.trim() || !roomId.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Join Room
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Real-time collaboration • Video calls • Secure code execution
        </motion.p>
      </motion.div>
    </div>
  );
};
