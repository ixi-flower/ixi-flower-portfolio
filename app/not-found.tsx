import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 p-4 font-mono overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        {/* window chrome */}
        <div className="bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[11px] text-zinc-400">zsh — 80×24</span>
            <span className="w-9" />
          </div>

          {/* terminal body */}
          <div className="px-4 py-6 sm:py-8 text-sm leading-relaxed">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-6">
              <span className="text-zinc-400">$</span>
              <span>cat ./route</span>
              <span className="inline-block h-4 w-2 bg-zinc-600 animate-pulse ml-1" />
            </div>

            <div className="flex flex-col items-center justify-center text-center py-2">
              <pre className="font-mono text-[11px] sm:text-xs leading-none tracking-tight text-zinc-700 select-none text-center" aria-hidden>
{`  ╱╱  404  ╱╱
 ╱╱ file not found ╱╱`}
              </pre>
              <div className="mt-5 flex items-center justify-center gap-3 text-3xl font-bold tracking-tight">
                <span className="text-zinc-100">404</span>
                <span className="h-10 w-px bg-zinc-800" aria-hidden />
                <span className="text-sm sm:text-base font-normal text-zinc-500 text-left leading-tight">This page<br className="sm:hidden" /> could not be found.</span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                <span className="text-red-400">cat:</span> no such file or directory — maybe a typo in the URL ?
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">tip: try <span className="text-zinc-400">ls ~/</span> below or jump home.</p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link href="/" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs hover:bg-white transition-colors"># cd ~</Link>
              <Link href="/blogs" className="px-4 py-2 border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors">$ ls ~/blogs</Link>
              <Link href="/projects" className="px-4 py-2 border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors">$ ls ~/projects</Link>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-zinc-600 border-t border-zinc-800 pt-4">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
              <span>ixi_wave — terminal edition · © 2026 ixiflower</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] text-zinc-700">
          press <span className="text-zinc-500 border border-zinc-800 px-1 py-0.5 bg-zinc-900">ESC</span> or click a link above
        </div>
      </div>
    </div>
  )
}
