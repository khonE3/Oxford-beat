import { ExternalLink } from "lucide-react";

const GITHUB_URL = "https://github.com/khonE3";

export function Footer() {
  return (
    <footer className="mt-2 border-t border-zinc-800/90 pt-4 pb-2">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-300">
        <p className="flex items-center gap-1.5 font-sans">
          <span>สร้างโดย</span>
          <span className="font-mono font-bold text-orange-300">Gotjitag</span>
        </p>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="เปิด GitHub ของ Gotjitag (@khonE3) ในแท็บใหม่"
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-[#111114] px-3.5 py-2 font-mono text-xs font-semibold text-zinc-200 transition hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-300 active:scale-[0.98]"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4 fill-current"
          >
            <path d="M12 1.27a11 11 0 0 0-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-3.03.66-3.67-1.45-3.67-1.45-.5-1.26-1.21-1.6-1.21-1.6-.99-.68.07-.67.07-.67 1.09.08 1.67 1.12 1.67 1.12.97 1.66 2.54 1.18 3.16.9.1-.7.38-1.18.69-1.45-2.42-.27-4.96-1.21-4.96-5.38 0-1.19.42-2.16 1.12-2.92-.11-.28-.49-1.39.11-2.89 0 0 .92-.29 3 1.12a10.4 10.4 0 0 1 5.46 0c2.08-1.41 3-1.12 3-1.12.6 1.5.22 2.61.11 2.89.7.76 1.12 1.73 1.12 2.92 0 4.18-2.54 5.1-4.97 5.37.39.34.74 1.01.74 2.04v3.02c0 .29.18.63.74.53A11 11 0 0 0 12 1.27Z" />
          </svg>
          <span>GitHub @khonE3</span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
