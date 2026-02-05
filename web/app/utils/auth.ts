export const checkAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check cookies
  const cookies = document.cookie;
  const hasCookieAuth = cookies.includes('auth-token=') || 
                       cookies.includes('access_token_client=');
  
  // Check localStorage
  const hasLocalStorageAuth = !!localStorage.getItem('access_token');
  
  return hasCookieAuth || hasLocalStorageAuth;
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get from cookies first
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    if (cookie.startsWith('access_token_client=')) {
      return cookie.split('=')[1];
    }
    if (cookie.startsWith('auth-token=')) {
      return cookie.split('=')[1];
    }
  }
  
  // Fallback to localStorage
  return localStorage.getItem('access_token');
};

export const getUserFromStorage = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Error parsing user from storage:', err);
    return null;
  }
};

export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('recent_signup');
  
  // Clear cookies (client-side)
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'access_token_client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};