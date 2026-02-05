"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const errorParam = searchParams.get('error');
      const accessToken = searchParams.get('access_token');
        
        if (errorParam) {
          console.error('Auth callback error:', errorParam);
          setError(`Authentication failed: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!accessToken) {
          console.error('Missing token info');
          setError('Authentication failed: Missing required information');
          setLoading(false);
          return;
        }

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          const token = accessToken
          console.log('User data from /api/auth/me:', userData, token);
          if (userData && token) {
            login(userData, token);
            router.push('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }

      // Fallback: redirect to signin
      router.push('/signin?error=callback_failed');
    };

    processCallback();
  }, [router, searchParams, login]);
if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wakili-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Completing authentication...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You will be redirected shortly
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/signin')}
              className="w-full px-4 py-2 bg-[var(--wakili-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Sign In
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}