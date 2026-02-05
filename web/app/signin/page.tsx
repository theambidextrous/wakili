"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/authStore";
import { checkAuth } from "../utils/auth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const { recentSignup, clearRecentSignup, login } = useAuthStore();

  useEffect(() => {
    if (checkAuth()) {
      console.log('User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [router]);
  

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('recent_signup');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.email_verified) {
          setEmail(user.email || "");
        }
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      localStorage.removeItem('recent_signup');
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data in the store
      login(data.user, data.access_token);

      // Store in localStorage for persistence
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Clear recent signup
      clearRecentSignup();
      localStorage.removeItem('recent_signup');
      
      // Give cookies a moment to be set, then redirect
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh(); // Refresh to update middleware state
      }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Clear welcome message after 5 seconds
  useEffect(() => {
    if (recentSignup?.email_verified) {
      const timer = setTimeout(() => {
        clearRecentSignup();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentSignup, clearRecentSignup]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white/95 dark:bg-white py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow">
        <Header activePage="signin" />

        <section className="mt-6">
          <div className="max-w-md mx-auto w-72">
            <h2 className="text-center text-2xl font-semibold">Sign In</h2>
            
            {recentSignup?.email_verified && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-blue-600 font-semibold mb-1">
                  Welcome back, {recentSignup.name}! 👋
                </div>
                <p className="text-sm text-blue-700">
                  Your email has been verified successfully. Please sign in.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-full border px-3 py-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-full border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-5 rounded-full bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="text-[var(--wakili-primary)] font-semibold">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}