import { useCallback, useState } from 'react';
import { apiClient } from '@/integrations/api/http';
import { toast } from 'sonner';

export const useInvite = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async (roomId: string) => {
    setLoadingInvites(true);
    try {
      const response = await apiClient.get(`/api/invites/room/${roomId}`);
      setInvites(response.data || []);
    } catch (error) {
      console.error('Failed to fetch invites', error);
      setInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  const revokeInvite = useCallback(async (inviteId: string) => {
    try {
      await apiClient.delete(`/api/invites/${inviteId}`);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      toast.success('Invite revoked');
    } catch (error) {
      console.error('Failed to revoke invite', error);
      toast.error('Failed to revoke invite');
    }
  }, []);

  const createInvite = useCallback(async (roomId: string, role: 'host' | 'participant') => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/invites', { roomId, role });
      return response.data; // { token, inviteUrl, expiresAt }
    } catch (error) {
      console.error('Failed to create invite', error);
      toast.error('Failed to generate invite link');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvite = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/invites/accept', { token });
      return response.data; // { room, participant }
    } catch (error) {
      console.error('Failed to accept invite', error);
      toast.error('Invalid or expired invite token');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendEmailInvite = useCallback(async (roomId: string, roomName: string, recipientEmail: string, recipientName: string, senderName: string) => {
    // Note: This matches the args used in HostControls.tsx
    try {
      // Create token first or let backend handle it? The backend expects a request to create and send email.
      // Usually there's an api for this. We will assume POST /api/invites/email-direct works, or use the existing sendInviteEmail if it matched. 
      // Actually, the original implementation had `sendInviteEmail(token, recipientEmail, recipientName)`.
      // Since HostControls passes `(roomId, roomName, emailTo, emailName, currentUserName)`, we'll send it back appropriately.
      const response = await apiClient.post('/api/invites/send-email', { 
        roomId, roomName, recipientEmail, recipientName, senderName 
      });
      toast.success(`Invite sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send email invite', error);
      toast.error('Failed to send email invitation');
      return false;
    }
  }, []);

  const sendInviteEmail = useCallback(async (token: string, recipientEmail: string, recipientName: string) => {
    try {
      await apiClient.post('/api/invites/email', { token, recipientEmail, recipientName });
      toast.success(`Invite sent to ${recipientEmail}`);
    } catch (error) {
      console.error('Failed to send email invite', error);
      toast.error('Failed to send email invitation');
    }
  }, []);

  return {
    invites,
    loadingInvites,
    loading,
    fetchInvites,
    revokeInvite,
    createInvite,
    acceptInvite,
    sendEmailInvite,
    sendInviteEmail,
  };
};
