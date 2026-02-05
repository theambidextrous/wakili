import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  recentSignup: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setRecentSignup: (user: User) => void;
  setAccessToken: (token: string) => void;
  clearRecentSignup: () => void;
  clearAuth: () => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      recentSignup: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setRecentSignup: (user) => set({ recentSignup: user }),
      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
      clearRecentSignup: () => set({ recentSignup: null }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      login: (user, token) => set({ 
        user, 
        accessToken: token, 
        isAuthenticated: true,
        recentSignup: null 
      }),
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);