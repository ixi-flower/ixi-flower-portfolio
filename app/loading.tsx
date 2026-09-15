"use client";
import { useEffect, useState } from "react";

const STEPS = [
  { label: "booting ixi-wave", done: "ixi-wave ready" },
  { label: "loading modules", done: "modules ready" },
  { label: "hydrating content", done: "content ready" },
  { label: "syncing waka & playlist", done: "sync complete" },
];

export default function Loading() {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // stagger step reveals
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setPhase(i + 1), 380 + i * 420));
    });
    // smooth progress bar 0→100 over ~2.2s
    let pct = 8;
    const interval = setInterval(() => {
      pct = Math.min(100, pct + (pct < 60 ? 9 : pct < 85 ? 5 : 2.5));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 120);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-zinc-950 font-mono">
      <div className="flex flex-col items-start gap-1.5 min-w-[220px]">
        {/* boot lines — sequential reveal */}
        {STEPS.map((s, i) => (
          <p
            key={s.label}
            className={`text-xs transition-all duration-400 ${i < phase ? "text-zinc-400" : i === phase ? "text-zinc-300" : "text-zinc-600 opacity-40"}`}
          >
            <span className={i < phase ? "text-emerald-500" : "text-zinc-600"}>{i < phase ? "✓" : i === phase ? "›" : "$"}</span>{" "}
            {i < phase ? s.done : i === phase ? s.label : s.label}
            {i === phase && <span className="animate-pulse">...</span>}
          </p>
        ))}

        {/* dotted spinner */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="text-[10px] text-zinc-600 tracking-widest">init</span>
          <span className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-pulse [animation-delay:200ms]" />
            <span className="h-1 w-1 rounded-full bg-zinc-500 animate-pulse [animation-delay:400ms]" />
          </span>
          <span className="text-[10px] text-zinc-600 ml-1">{Math.round(progress)}%</span>
        </div>

        {/* progress bar — eased fill */}
        <div className="mt-3 h-[2px] w-52 bg-zinc-800 overflow-hidden rounded-full">
          <div className="h-full bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* brand + cursor */}
        <div className="mt-5 flex items-center gap-1 text-sm tracking-tight">
          <span className="text-zinc-300">ixi_flower</span>
          <span className="inline-block h-4 w-2 bg-zinc-400 animate-[pulse-blink_1s_steps(1)_infinite] translate-y-px">▋</span>
        </div>
        <p className="text-[10px] tracking-[0.2em] text-zinc-600">ixi-wave — terminal soul</p>
        <p className="text-[10px] text-zinc-700 mt-1">© 2026 ixiflower</p>
      </div>
    </div>
  );
}
