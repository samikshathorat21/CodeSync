import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/http';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (username: string, avatarUrl?: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const session = {
    access_token: localStorage.getItem('codesync_access_token') || '',
  };

  const loadUser = async () => {
    const token = localStorage.getItem('codesync_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user', error);
      localStorage.removeItem('codesync_access_token');
      localStorage.removeItem('codesync_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const response = await apiClient.post('/api/auth/signup', { email, password, username });
      const { accessToken, refreshToken, profile } = response.data;
      
      localStorage.setItem('codesync_access_token', accessToken);
      localStorage.setItem('codesync_refresh_token', refreshToken);
      setUser(profile);
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/signin', { email, password });
      const { accessToken, refreshToken, profile } = response.data;
      
      localStorage.setItem('codesync_access_token', accessToken);
      localStorage.setItem('codesync_refresh_token', refreshToken);
      setUser(profile);
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post('/api/auth/signout');
    } catch (error) {
      console.error('Signout failed', error);
    } finally {
      localStorage.removeItem('codesync_access_token');
      localStorage.removeItem('codesync_refresh_token');
      setUser(null);
    }
  };

  const updateProfile = async (username: string, avatarUrl?: string) => {
    try {
      const response = await apiClient.patch('/api/profiles/me', { username, avatarUrl });
      setUser(response.data);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: user ? session : null, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
