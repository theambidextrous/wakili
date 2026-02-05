"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/authStore";

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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white/95 dark:bg-white py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow">
        <Header activePage="signup" />

        <section className="mt-6">
          <div className="max-w-md mx-auto w-72">
            <h2 className="text-center text-2xl font-semibold">
              {verificationSuccess ? "Verification Complete!" : showVerification ? "Verify Your Email" : "Create account"}
            </h2>
            
            {/* Verification Success Message */}
            {verificationSuccess && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-600 font-semibold mb-2 text-lg">
                  ✓ Email Verified Successfully!
                </div>
                <p className="text-sm text-green-700 mb-2">
                  Your email <strong>{email}</strong> has been verified.
                </p>
                <p className="text-sm text-green-700">
                  You can now log in to your account.
                </p>
                <p className="mt-3 text-xs text-green-600">
                  Redirecting to login in {verificationSuccessCountdown} seconds...
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/signin')}
                    className="rounded-full bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition-colors"
                  >
                    Go to Login Now
                  </button>
                </div>
              </div>
            )}

            {!showVerification && !verificationSuccess && (
              <p className="text-center mt-2 text-sm text-zinc-600">
                Sign up to start using Wakili AI.
              </p>
            )}

            {/* Success message before verification */}
            {signupSuccess && !showVerification && !verificationSuccess && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-600 font-semibold mb-2">
                  ✓ Registration Successful!
                </div>
                <p className="text-sm text-green-700 mb-2">
                  A verification code has been sent to <strong>{email}</strong>
                </p>
                <p className="text-xs text-green-600">
                  Redirecting to verification in {countdown} seconds...
                </p>
                <button
                  type="button"
                  onClick={() => setShowVerification(true)}
                  className="mt-3 text-sm text-[var(--wakili-primary)] underline"
                >
                  Go to verification now
                </button>
              </div>
            )}

            {/* Verification Form */}
            {showVerification && !verificationSuccess ? (
              <div className="mt-6">
                {verificationError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {verificationError}
                  </div>
                )}

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    We&apos;ve sent a verification code to:<br />
                    <strong className="text-gray-900">{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={resendVerificationCode}
                    className="mt-2 text-sm text-[var(--wakili-primary)] underline"
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
                    className="w-full rounded-full border px-3 py-2 text-center text-2xl tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  
                  <button
                    type="submit"
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="mt-5 rounded-full bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
                    className="text-sm text-zinc-600 hover:text-zinc-800"
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
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
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
                      className="w-full rounded-full border px-3 py-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
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
                      minLength={6}
                      className="w-full rounded-full border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 rounded-full bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                      {loading ? 'Creating account...' : 'Create account'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-600">Or sign up with</p>
                    <div className="mt-3 flex justify-center gap-3">
                      <a
                        href="/api/auth/google"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Image src="/google.png" alt="Google" width={40} height={40} />
                        Continue with Google
                      </a>
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