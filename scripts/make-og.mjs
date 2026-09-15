import sharp from "sharp";
const W=1200,H=630;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#09090b"/>
  <g opacity="0.06" stroke="#3f3f46" stroke-width="1">
    ${Array.from({length: 25}, (_,i)=> `<line x1="${i*50}" y1="0" x2="${i*50}" y2="${H}"/>`).join("")}
    ${Array.from({length: 13}, (_,i)=> `<line x1="0" y1="${i*50}" x2="${W}" y2="${i*50}"/>`).join("")}
  </g>
  <rect x="36" y="36" width="${W-72}" height="420" rx="10" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
  <rect x="36" y="36" width="${W-72}" height="36" rx="10" fill="#27272a"/>
  <rect x="36" y="64" width="${W-72}" height="8" fill="#27272a"/>
  <circle cx="62" cy="54" r="7" fill="#ef4444"/>
  <circle cx="82" cy="54" r="7" fill="#eab308"/>
  <circle cx="102" cy="54" r="7" fill="#22c55e"/>
  <text x="${W/2}" y="54" text-anchor="middle" font-family="monospace" font-size="11" fill="#a1a1aa" letter-spacing="0.5">zsh — 80x24 — ixi_flower</text>
  <text x="90" y="175" font-family="monospace" font-size="64" font-weight="700" fill="#fafafa" letter-spacing="6">IXI</text>
  <text x="90" y="200" font-family="monospace" font-size="11" fill="#71717a" letter-spacing="4">ixi_flower  ·  ixiflower  ·  ixi-flower</text>
  <text x="90" y="270" font-family="monospace" font-size="38" font-weight="700" fill="#fafafa">Amirabbas Rouintan</text>
  <text x="90" y="302" font-family="monospace" font-size="14" fill="#a1a1aa" letter-spacing="1">Full-Stack Developer — born 2007 · coding since 2019</text>
  <g font-family="monospace" font-size="11" font-weight="600">
    ${["Next.js","React","TypeScript","Python","Go","Docker","Neon"].map((t,i)=>{
      const row = i < 4 ? 0 : 1;
      const col = i < 4 ? i : i-4;
      const px = 90 + col*132;
      const py = 340 + row*36;
      const w = t.length*7 + 24;
      return `<rect x="${px}" y="${py}" width="${w}" height="26" rx="4" fill="#27272a" stroke="#3f3f46"/><text x="${px+w/2}" y="${py+17}" text-anchor="middle" fill="#d4d4d8">${t}</text>`;
    }).join("")}
  </g>
  <text x="90" y="445" font-family="monospace" font-size="11" fill="#52525b">ixiflower.vercel.app  ·  github.com/ixi-flower  ·  x.com/ixi_flower0</text>
  <text x="${W-90}" y="175" text-anchor="end" font-family="monospace" font-size="10" fill="#3f3f46">$ whoami</text>
  <text x="${W-90}" y="192" text-anchor="end" font-family="monospace" font-size="10" fill="#71717a">amirabbas rouintan</text>
</svg>`;
await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile("public/og-image.jpg");
const meta = await sharp("public/og-image.jpg").metadata();
console.log("og-image.jpg", meta.width+"x"+meta.height, meta.format, Math.round(meta.size/1024)+"KB");
