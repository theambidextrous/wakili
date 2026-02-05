import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clearAuthStorage } from '../utils/auth';

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
      logout: () => {
        console.log('AuthStore: Logout called');
        
        clearAuthStorage();
        
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'access_token_client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          localStorage.clear();
          
          sessionStorage.clear();
        }
        
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false,
          recentSignup: null
        });
        
        fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include'
        }).catch(console.error);
        
        console.log('AuthStore: Logout completed');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);