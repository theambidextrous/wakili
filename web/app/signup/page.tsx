"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: hook up backend registration
    alert(`Registration requested for ${email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main className="mx-2 w-full max-w-6xl min-h-screen bg-white/95 dark:bg-black/90 py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow">
        <Header activePage="signup" />

        <section className="mt-6">
          <div className="max-w-md mx-auto w-72">
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-zinc-600">Sign up to start using Wakili AI.</p>

            <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2 mb-4"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
              <button className="mt-5 rounded-full bg-[var(--wakili-primary)] px-4 py-2 text-white font-semibold">Create account</button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">Or sign up with</p>
              <div className="mt-3 flex justify-center gap-3">
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
                >
                  <Image src="/file.svg" alt="Google" width={16} height={16} />
                  Continue with Google
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
