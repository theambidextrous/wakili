export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[var(--wakili-primary)] pt-4 text-xs text-zinc-500">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="max-w-3xl">
          <strong>Note:</strong> As Wakili, I provide information and tools to
          assist with legal problems. I do not replace professional
          legal advice.
        </p>
        <p className="mt-1 font-bold">© {new Date().getFullYear()} Wakili AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
