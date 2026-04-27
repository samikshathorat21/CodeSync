import { useState, useCallback, useEffect } from 'react';
import { RoomPermissions } from '@/types/collaboration';
import { apiClient } from '@/integrations/api/http';
import { toast } from 'sonner';

interface UseRoomPermissionsProps {
  roomId: string | null;
  isHost: boolean;
}

export const useRoomPermissions = ({ roomId, isHost }: UseRoomPermissionsProps) => {
  const [permissions, setPermissions] = useState<RoomPermissions>({
    canEdit: true,
    canExecute: true,
    canChat: true,
    canVideo: true,
    canAudio: true
  });
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/rooms/${roomId}/permissions`);
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      fetchPermissions();
    }
  }, [roomId, fetchPermissions]);

  const updatePermission = useCallback(async (key: keyof RoomPermissions, value: boolean) => {
    if (!roomId || !isHost) return;
    
    try {
      await apiClient.patch(`/api/rooms/${roomId}/permissions`, { [key]: value });
      setPermissions(prev => ({ ...prev, [key]: value }));
      toast.success(`${key} permission updated`);
    } catch (error) {
      console.error('Failed to update permission', error);
      toast.error(`Failed to update ${key} permission`);
    }
  }, [roomId, isHost]);

  return {
    permissions,
    updatePermission,
    loading,
  };
};
