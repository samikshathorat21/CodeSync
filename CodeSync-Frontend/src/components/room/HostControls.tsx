import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Edit3, Play, MessageSquare, Video, Users, Crown, UserX, 
  Link2, Trash2, Mail, Clock, CheckCircle, Loader2, Mic
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomPermissions, User } from '@/types/collaboration';
import { useInvite } from '@/hooks/useInvite';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HostControlsProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: RoomPermissions;
  onUpdatePermission: (key: keyof RoomPermissions, value: boolean) => void;
  participants: User[];
  currentUserId: string;
  currentUserName: string;
  roomId: string;
  roomName: string;
  onKickUser?: (userId: string) => void;
  onEndRoom?: () => void;
  loading?: boolean;
}

export const HostControls: React.FC<HostControlsProps> = ({
  isOpen,
  onClose,
  permissions,
  onUpdatePermission,
  participants,
  currentUserId,
  currentUserName,
  roomId,
  roomName,
  onKickUser,
  onEndRoom,
  loading = false,
}) => {
  const { 
    fetchInvites, 
    revokeInvite, 
    sendEmailInvite, 
    invites, 
    loadingInvites,
    loading: inviteLoading 
  } = useInvite();

  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchInvites(roomId);
    }
  }, [isOpen, roomId, fetchInvites]);

  const handleSendEmailInvite = async () => {
    if (!emailTo.trim()) return;
    
    setSendingEmail(true);
    const success = await sendEmailInvite(roomId, roomName, emailTo.trim(), emailName.trim(), currentUserName);
    if (success) {
      setEmailTo('');
      setEmailName('');
      fetchInvites(roomId);
    }
    setSendingEmail(false);
  };

  const permissionControls = [
    {
      key: 'canEdit' as keyof RoomPermissions,
      label: 'Code Editing',
      description: 'Allow participants to edit code',
      icon: Edit3,
    },
    {
      key: 'canExecute' as keyof RoomPermissions,
      label: 'Code Execution',
      description: 'Allow participants to run code',
      icon: Play,
    },
    {
      key: 'canChat' as keyof RoomPermissions,
      label: 'Chat',
      description: 'Allow participants to send messages',
      icon: MessageSquare,
    },
    {
      key: 'canVideo' as keyof RoomPermissions,
      label: 'Video',
      description: 'Allow participants to use video',
      icon: Video,
    },
    {
      key: 'canAudio' as keyof RoomPermissions,
      label: 'Microphone',
      description: 'Allow participants to use microphone',
      icon: Mic,
    },
  ];

  const otherParticipants = participants.filter(p => p.id !== currentUserId && !p.isHost);
  const activeInvites = invites.filter(i => new Date(i.expires_at) > new Date() && !i.is_used);
  const expiredOrUsedInvites = invites.filter(i => new Date(i.expires_at) <= new Date() || i.is_used);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full bg-card border-l border-border flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Host Controls</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="permissions" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="permissions" className="flex-1">Permissions</TabsTrigger>
              <TabsTrigger value="invites" className="flex-1">Invites</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Permissions Tab */}
              <TabsContent value="permissions" className="p-4 space-y-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-medium text-foreground">Room Permissions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Control what participants can do
                  </p>

                  <div className="space-y-3">
                    {permissionControls.map(({ key, label, description, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-background">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <Label htmlFor={key} className="font-medium cursor-pointer text-sm">
                              {label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <Switch
                          id={key}
                          checked={permissions[key]}
                          onCheckedChange={(checked) => onUpdatePermission(key, checked)}
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {onEndRoom && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        End Room for Everyone
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Room</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect all participants and close the room.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onEndRoom}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          End Room
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TabsContent>

              {/* Invites Tab */}
              <TabsContent value="invites" className="p-4 space-y-6 m-0">
                {/* Email Invite */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-foreground">Send Email Invite</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Email address"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                    <Input
                      placeholder="Recipient name (optional)"
                      value={emailName}
                      onChange={(e) => setEmailName(e.target.value)}
                    />
                    <Button 
                      onClick={handleSendEmailInvite}
                      disabled={!emailTo.trim() || sendingEmail}
                      className="w-full"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Active Invites */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      <h3 className="font-medium text-foreground">Active Invites</h3>
                    </div>
                    {loadingInvites && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>

                  {activeInvites.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active invite links
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <code className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                              {invite.token.substring(0, 12)}...
                            </code>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke Invite</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This invite link will no longer work.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokeInvite(invite.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {expiredOrUsedInvites.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Expired / Used ({expiredOrUsedInvites.length})
                      </h3>
                      <div className="space-y-2">
                        {expiredOrUsedInvites.slice(0, 3).map((invite) => (
                          <div
                            key={invite.id}
                            className="p-2 rounded-lg bg-muted/30 border border-border/50 opacity-60"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                                {invite.token.substring(0, 12)}...
                              </code>
                              <Badge variant="secondary" className="text-xs">
                                {invite.is_used ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Used</>
                                ) : (
                                  'Expired'
                                )}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="p-4 space-y-4 m-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Manage Participants</h3>
                </div>

                {otherParticipants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other participants in the room
                  </p>
                ) : (
                  <div className="space-y-2">
                    {otherParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              style={{ backgroundColor: participant.color }}
                              className="text-white text-xs"
                            >
                              {participant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{participant.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Participant
                              </Badge>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                        {onKickUser && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Participant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove {participant.name} from the room?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onKickUser(participant.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
