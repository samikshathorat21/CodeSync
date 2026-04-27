import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useInvite } from '@/hooks/useInvite';
import { apiClient } from '@/integrations/api/http';

const Join: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { acceptInvite } = useInvite();
  
  const token = searchParams.get('token');
  
  const [validationState, setValidationState] = useState<'validating' | 'valid' | 'invalid' | 'error'>('validating');
  const [roomName, setRoomName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setValidationState('invalid');
        setErrorMessage('Invalid invite link - missing token');
        return;
      }

      try {
        // Just lookup the room if possible (we don't have a direct lookup-by-token REST but we can try)
        // Or we just assume valid until "Join" is clicked, or we add a GET /api/invites/lookup?token=X
        // For now, let's keep it simple.
        setValidationState('valid');
        setRoomName('Invited Room');
      } catch (error) {
        setValidationState('invalid');
        setErrorMessage('Invalid or expired invite token');
      }
    };

    validate();
  }, [token]);

  const handleJoin = async () => {
    if (!token || !userName.trim()) return;
    
    setLoading(true);
    try {
      if (!user) {
        // Store for after login
        sessionStorage.setItem('pendingInvite', JSON.stringify({ token, userName: userName.trim() }));
        navigate('/auth');
        return;
      }

      const result = await acceptInvite(token);
      navigate(`/room/${result.room.id}`);
    } catch (error) {
      console.error('Join failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || validationState === 'validating') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invite link...</p>
        </motion.div>
      </div>
    );
  }

  if (validationState === 'invalid' || validationState === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Invalid Invite</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Code2 className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">CodeSync</span>
            </div>
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              You've been invited to join a collaborative session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
                You'll need to sign in or create an account to join this room.
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="userName">Your Display Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <Button 
              onClick={handleJoin} 
              className="w-full"
              disabled={!userName.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : user ? (
                'Join Room'
              ) : (
                'Continue to Sign In'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Join;
