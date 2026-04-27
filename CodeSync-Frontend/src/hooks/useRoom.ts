import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Room,
  ChatMessage,
  CursorPosition,
  Language,
} from '@/types/collaboration';
import { getDefaultTemplate } from '@/constants/codeTemplates';
import { apiClient } from '@/integrations/api/http';
import { stompClient, connectStomp } from '@/integrations/api/stomp';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useRoom = (roomId?: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [code, setCode] = useState(getDefaultTemplate('java'));
  const [language, setLanguage] = useState<Language>('java');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { userName: string; color: string; timestamp: number }>
  >(new Map());
  const [viewports, setViewports] = useState<
    Map<string, { userId: string; userName: string; color: string; startLine: number; endLine: number }>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(roomId);

  const subscriptions = useRef<any[]>([]);

  const fetchRoom = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/api/rooms/${id}`);
      const data = response.data;
      
      setRoom({
        ...data,
        participants: data.participants.map((p: any) => ({
          id: p.userId,
          name: p.username,
          color: p.cursorColor,
          isHost: p.isHost,
          isOnline: true,
        })),
        createdAt: new Date(data.createdAt),
      });
      const isValidLanguage = ['java', 'python'].includes(data.language);
      const safeLanguage = (isValidLanguage ? data.language : 'java') as Language;
      
      setCode(data.code || getDefaultTemplate(safeLanguage));
      setLanguage(safeLanguage);
      
      const me = data.participants.find((p: any) => p.userId === user?.id);
      if (me) {
        setCurrentUser({
          id: me.userId,
          name: me.username,
          color: me.cursorColor,
          isHost: me.isHost,
          isOnline: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch room', error);
      toast.error('Failed to load room data');
      navigate('/app');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const fetchMessages = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/api/rooms/${id}/messages?limit=50`);
      setMessages(response.data.map((m: any) => ({
        ...m,
        timestamp: new Date(m.createdAt),
      })));
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId || !user) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      await fetchRoom(activeRoomId);
      await fetchMessages(activeRoomId);
      
      try {
        await connectStomp();
        setIsConnected(true);

        // Subscriptions
        const subs = [
          stompClient.subscribe(`/topic/room/${activeRoomId}/code`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.fromUserId !== user.id) {
              setCode(data.code);
              setLanguage(data.language);
            }
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/typing`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.userId !== user.id) {
              setTypingUsers((prev) => {
                const next = new Map(prev);
                if (data.isTyping) {
                  next.set(data.userId, { userName: data.userName, color: '#ccc', timestamp: Date.now() });
                } else {
                  next.delete(data.userId);
                }
                return next;
              });
            }
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/cursor`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.userId !== user.id) {
              setCursors((prev) => {
                const next = new Map(prev);
                next.set(data.userId, {
                  userId: data.userId,
                  userName: data.userName,
                  color: data.color,
                  line: data.line,
                  column: data.column,
                });
                return next;
              });
            }
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/viewport`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.userId !== user.id) {
              setViewports((prev) => {
                const next = new Map(prev);
                next.set(data.userId, {
                  userId: data.userId,
                  userName: data.userName,
                  color: data.color,
                  startLine: data.startLine,
                  endLine: data.endLine,
                });
                return next;
              });
            }
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/presence`, (msg) => {
            const data = JSON.parse(msg.body);
            setRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                participants: data.participants.map((p: any) => ({
                  id: p.userId,
                  name: p.username,
                  color: p.cursorColor,
                  isHost: p.isHost,
                  isOnline: true,
                })),
              };
            });
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/permissions`, (msg) => {
            const data = JSON.parse(msg.body);
            setRoom((prev) => {
              if (!prev) return null;
              return { ...prev, permissions: data };
            });
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/chat`, (msg) => {
            const data = JSON.parse(msg.body);
            setMessages((prev) => [...prev, { ...data, timestamp: new Date(data.createdAt) }]);
          }),
          stompClient.subscribe(`/topic/room/${activeRoomId}/host`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.type === 'kick' && data.userId === user.id) {
              toast.error('You were removed from this room');
              navigate('/app');
            }
            if (data.type === 'lang-change') {
              setLanguage(data.language);
            }
          }),
        ];
        
        subscriptions.current = subs;
        
        // Sync presence
        stompClient.publish({ destination: `/app/room/${activeRoomId}/presence/sync` });

        // Start heartbeat to prevent being kicked out for inactivity
        const intervalId = setInterval(() => {
          if (stompClient.connected) {
            stompClient.publish({ destination: `/app/room/${activeRoomId}/presence/heartbeat` });
          }
        }, 15000);
        
        subscriptions.current.push({
          unsubscribe: () => clearInterval(intervalId)
        });

      } catch (error) {
        console.error('STOMP connection failed', error);
        toast.error('Real-time connection failed');
      }
    };

    init();

    return () => {
      subscriptions.current.forEach((s) => s.unsubscribe());
      setIsConnected(false);
    };
  }, [activeRoomId, user, fetchRoom, fetchMessages, navigate]);

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/code`,
        body: JSON.stringify({ code: newCode }),
      });
    }
  }, [activeRoomId]);

  const updateLanguage = useCallback((lang: Language, newCode: string) => {
    setLanguage(lang);
    setCode(newCode);
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/code`,
        body: JSON.stringify({ code: newCode, language: lang }),
      });
    }
  }, [activeRoomId]);

  const sendMessage = useCallback((content: string) => {
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/chat`,
        body: JSON.stringify({ content }),
      });
    }
  }, [activeRoomId]);

  const updateCursor = useCallback((position: CursorPosition) => {
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/cursor`,
        body: JSON.stringify({ line: position.line, column: position.column }),
      });
    }
  }, [activeRoomId]);

  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/typing`,
        body: JSON.stringify({ isTyping }),
      });
    }
  }, [activeRoomId]);

  const broadcastViewport = useCallback((startLine: number, endLine: number) => {
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/viewport`,
        body: JSON.stringify({ startLine, endLine }),
      });
    }
  }, [activeRoomId]);

  const saveVersion = useCallback(async (description?: string) => {
    if (stompClient.connected && activeRoomId) {
      stompClient.publish({
        destination: `/app/room/${activeRoomId}/save`,
        body: JSON.stringify({ description }),
      });
      toast.success('Version saved');
    }
  }, [activeRoomId]);

  const createRoom = useCallback(async (name: string, language: string) => {
    try {
      const response = await apiClient.post('/api/rooms', { name, language });
      const data = response.data;
      setActiveRoomId(data.id);
      return data;
    } catch (error) {
      toast.error('Failed to create room');
      throw error;
    }
  }, []);

  const joinRoom = useCallback(async (id: string, _userName?: string) => {
    try {
      const response = await apiClient.post(`/api/rooms/${id}/participants/join`);
      const data = response.data;
      setActiveRoomId(id);
      return data;
    } catch (error) {
      toast.error('Failed to join room');
      throw error;
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    // Logic to disconnect
    subscriptions.current.forEach((s) => s.unsubscribe());
    setIsConnected(false);
  }, []);

  return {
    room,
    currentUser,
    code,
    language,
    messages,
    cursors,
    typingUsers,
    viewports,
    isConnected,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    updateCode,
    updateLanguage,
    sendMessage,
    updateCursor,
    broadcastTyping,
    broadcastViewport,
    saveVersion,
  };
};
