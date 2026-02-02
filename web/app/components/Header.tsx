import Image from "next/image";
import Link from "next/link";

export default function Header({ activePage }: { activePage?: string }) {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <Image src="/wakili-logo-sm-icon.png" alt="Wakili" width={70} height={48} />
        <div>
          <h3 className="text-4xl font-semibold text-[var(--wakili-neutral)]">Wakili AI</h3>
          <p className="text-xs text-zinc-500">Kenyan Legal Assistant</p>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        <Link
          href="/signin"
          className={`hidden sm:inline-flex rounded-full px-12 py-2 text-sm font-semibold text-[var(--wakili-primary)] hover:bg-[var(--wakili-primary)]/10 ${activePage === "signin" ? "bg-[var(--wakili-primary)]/10" : ""}`}
        >
          Sign In
        </Link>
        { activePage && activePage !== "home" && (
            <Link
                href="/signup"
                className={`hidden sm:inline-flex rounded-full px-12 py-2 text-sm font-semibold text-[var(--wakili-primary)] hover:bg-[var(--wakili-primary)]/10 ${activePage === "signup" ? "bg-[var(--wakili-primary)]/10" : ""}`}
            >
                Sign Up
            </Link>
        )}
      </nav>
    </header>
  );
}
