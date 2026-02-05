import { WakiliUser } from "../types/auth";

export const storage = {
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  },
  
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  setUser: (user: WakiliUser) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  },
  
  getUser: () => {
    try {
      if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
    return null;
  },
  
  clearUser: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error clearing user from localStorage:', error);
    }
  }
};