"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { checkAuth, getUserFromStorage, getAuthToken } from '../utils/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, setUser, setAccessToken } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = () => {
      const isAuth = checkAuth();
      
      console.log('ProtectedRoute - Auth check:', {
        isAuth,
        isAuthenticated,
        hasAccessToken: !!accessToken,
        cookies: document.cookie
      });
      
      if (isAuth) {
        // If we have auth but store is empty, initialize it
        if (!accessToken) {
          const token = getAuthToken();
          const user = getUserFromStorage();
          
          if (token && user) {
            setAccessToken(token);
            setUser(user);
          }
        }
        setIsChecking(false);
      } else {
        console.log('No auth found, redirecting to signin');
        router.push('/signin');
      }
    };

    // Give a small delay for cookies to be available
    setTimeout(verifyAuth, 300);
  }, [isAuthenticated, accessToken, router, setUser, setAccessToken]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wakili-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}