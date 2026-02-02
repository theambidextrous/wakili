import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--wakili-primary)/5,_transparent)]">
      <main
        className="mx-2 w-full max-w-6xl min-h-screen bg-white/95 dark:bg-black/90 py-8 px-6 md:px-12 lg:px-20 rounded-none side-shadow"
      >
        <Header activePage="home" />

        <section className="mt-3 grid gap-6 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="text-4xl font-normal leading-tight sm:text-5xl text-[var(--wakili-neutral)]">
              Need legal help? <br></br> <span className="font-medium">Ask Wakili.</span>
            </h2>
         
            <ul className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-700">
              <li className="inline-flex items-center gap-2">⚖️ Know your rights</li>
              <li className="inline-flex items-center gap-2">📜 Legal drafting</li>
              <li className="inline-flex items-center gap-2">🔎 Kenyan law research</li>
            </ul>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                className="w-48 text-center inline-flex items-center justify-center rounded-full bg-[var(--wakili-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--wakili-primary-dark)]"
              >
                Create account
              </a>
              <a
                href="/signin"
                className=" w-32 text-center inline-flex items-center justify-center rounded-full border border-[var(--wakili-primary)] px-6 py-3 text-sm font-semibold text-[var(--wakili-primary)] hover:bg-[var(--wakili-primary)]/10"
              >
                Sign in
              </a>
            </div>

            
          </div>

          <div className="order-first sm:order-last flex items-center justify-center">
            <div className="w-full max-w-[560px]">
              <div className="w-full h-[220px] sm:h-[320px] md:h-[420px] overflow-hidden rounded-md">
                <Image
                  src="/ask-wakili-hm.png"
                  alt="Ask Wakili — Kenyan legal assistance"
                  width={1200}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      {/* Mobile CTA bar */}
      <div className="fixed bottom-6 left-1/2 z-40 w-[90%] -translate-x-1/2 sm:hidden">
        <div className="flex items-center justify-between gap-3 rounded-full bg-white/95 p-2 shadow-md">
          <a
            href="/signin"
            className="flex-1 rounded-full px-4 py-3 text-center text-sm font-semibold text-[var(--wakili-primary)] border border-[var(--wakili-primary)]"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="flex-1 rounded-full bg-[var(--wakili-primary)] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
