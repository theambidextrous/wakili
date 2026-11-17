"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/authStore";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [verificationSuccessCountdown, setVerificationSuccessCountdown] = useState(3);
  const router = useRouter();
  
  // Get the store actions
  const { setRecentSignup } = useAuthStore();

  // Countdown timer after successful signup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signupSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (signupSuccess && countdown === 0) {
      setShowVerification(true);
    }
    return () => clearTimeout(timer);
  }, [signupSuccess, countdown]);

  // Countdown timer after verification success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verificationSuccess && verificationSuccessCountdown > 0) {
      timer = setTimeout(() => {
        setVerificationSuccessCountdown(prev => prev - 1);
      }, 1000);
    } else if (verificationSuccess && verificationSuccessCountdown === 0) {
      // Redirect to signin page
      router.push('/signin');
    }
    return () => clearTimeout(timer);
  }, [verificationSuccess, verificationSuccessCountdown, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data in localStorage and zustand store
      const userData = {
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        email_verified: data.email_verified,
        created_at: data.created_at
      };

      // Save to localStorage directly (as fallback)
      if (typeof window !== 'undefined') {
        localStorage.setItem('recent_signup', JSON.stringify(userData));
      }
      
      // Save to zustand store
      setRecentSignup(userData);

      // Registration successful
      setSignupSuccess(true);
      setCountdown(5);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");
    setVerificationLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Verification successful - update user verification status
      const storedUser = localStorage.getItem('recent_signup');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.email_verified = true;
        
        // Update in localStorage
        localStorage.setItem('recent_signup', JSON.stringify(user));
        
        // Update in zustand store
        setRecentSignup(user);
      }

      // Show success message before redirect
      setVerificationSuccess(true);
      setVerificationSuccessCountdown(3);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setVerificationError(errorMessage);
      console.error('Verification error:', err);
    } finally {
      setVerificationLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      alert('Verification code resent successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      alert(errorMessage);
    }
  };

  // Get recent signup from localStorage on component mount
  useEffect(() => {
    const recentSignup = localStorage.getItem('recent_signup');
    if (recentSignup) {
      const user = JSON.parse(recentSignup);
      if (user && !user.email_verified) {
        // If user signed up but didn't verify, pre-fill the form
        setEmail(user.email);
        setName(user.name);
        // Don't auto-show verification unless they come back to this page
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white/95 dark:bg-gray-900/95 py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] dark:border dark:border-gray-800">
        <Header activePage="signup" />

        <section className="mt-6">
          <div className="max-w-md mx-auto w-72">
            <h2 className="text-center text-2xl font-semibold dark:text-gray-100">
              {verificationSuccess ? "Verification Complete!" : showVerification ? "Verify Your Email" : "Create account"}
            </h2>
            
            {/* Verification Success Message */}
            {verificationSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <div className="text-green-600 dark:text-green-400 font-semibold mb-2 text-lg">
                  ✓ Email Verified Successfully!
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Your email <strong className="dark:text-green-200">{email}</strong> has been verified.
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You can now log in to your account.
                </p>
                <p className="mt-3 text-xs text-green-600 dark:text-green-400">
                  Redirecting to login in {verificationSuccessCountdown} seconds...
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/signin')}
                    className="rounded-full bg-green-600 dark:bg-green-700 px-4 py-2 text-white font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    Go to Login Now
                  </button>
                </div>
              </div>
            )}

            {!showVerification && !verificationSuccess && !signupSuccess && (
              <p className="text-center mt-2 text-sm text-zinc-600 dark:text-gray-400">
                Sign up to start using Wakili AI.
              </p>
            )}

            {/* Success message before verification */}
            {signupSuccess && !showVerification && !verificationSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <div className="text-green-600 dark:text-green-400 font-semibold mb-2">
                  ✓ Registration Successful!
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  A verification code has been sent to <strong className="dark:text-green-200">{email}</strong>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Redirecting to verification in {countdown} seconds...
                </p>
                <button
                  type="button"
                  onClick={() => setShowVerification(true)}
                  className="mt-3 text-sm text-[var(--wakili-primary)] dark:text-[var(--wakili-primary-light)] underline"
                >
                  Go to verification now
                </button>
              </div>
            )}

            {/* Verification Form */}
            {showVerification && !verificationSuccess ? (
              <div className="mt-6">
                {verificationError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                    {verificationError}
                  </div>
                )}

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We&apos;ve sent a verification code to:<br />
                    <strong className="text-gray-900 dark:text-gray-200">{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={resendVerificationCode}
                    className="mt-2 text-sm text-[var(--wakili-primary)] dark:text-[var(--wakili-primary-light)] underline"
                  >
                    Didn&apos;t receive the code? Resend
                  </button>
                </div>

                <form className="flex flex-col gap-3" onSubmit={handleVerification}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={verificationLoading}
                    pattern="\d{6}"
                    inputMode="numeric"
                    className="w-full rounded-full border px-3 py-2 text-center text-2xl tracking-widest disabled:opacity-50 disabled:cursor-not-allowed dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500 focus:dark:border-[var(--wakili-primary)] focus:dark:ring-1 focus:dark:ring-[var(--wakili-primary)] focus:dark:bg-gray-800/50 transition-colors"
                  />
                  
                  <button
                    type="submit"
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="mt-5 rounded-full bg-[var(--wakili-primary)] dark:bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 dark:hover:bg-[var(--wakili-primary-dark)] transition-colors"
                  >
                    {verificationLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerification(false);
                      setSignupSuccess(false);
                    }}
                    className="text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-gray-300"
                  >
                    ← Back to signup
                  </button>
                </div>
              </div>
            ) : (
              /* Original Signup Form (only show if not showing verification or success) */
              !showVerification && !verificationSuccess && !signupSuccess && (
                <>
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
                    <input
                      type="text"
                      placeholder="Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-full border px-3 py-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500 focus:dark:border-[var(--wakili-primary)] focus:dark:ring-1 focus:dark:ring-[var(--wakili-primary)] focus:dark:bg-gray-800/50 transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-full border px-3 py-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500 focus:dark:border-[var(--wakili-primary)] focus:dark:ring-1 focus:dark:ring-[var(--wakili-primary)] focus:dark:bg-gray-800/50 transition-colors"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                      className="w-full rounded-full border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500 focus:dark:border-[var(--wakili-primary)] focus:dark:ring-1 focus:dark:ring-[var(--wakili-primary)] focus:dark:bg-gray-800/50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 rounded-full bg-[var(--wakili-primary)] dark:bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 dark:hover:bg-[var(--wakili-primary-dark)] transition-colors"
                    >
                      {loading ? 'Creating account...' : 'Create account'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-600 dark:text-gray-400">Or sign up with</p>
                    <div className="mt-3 flex justify-center gap-3">
                      <GoogleAuthButton />
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}