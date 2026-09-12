import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const existing = await sql`SELECT id FROM posts WHERE slug='deploying-jitsi-meet-at-scale' LIMIT 1`;
if (existing.length > 0) {
  console.log("Jitsi post already exists:", existing[0].id);
} else {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const content = `<h1>Deploying Jitsi Meet at Scale</h1>
<blockquote><p>How I autoscale Jitsi + Jibri on a single VPS with Python — no Kubernetes needed.</p></blockquote>
<pre><code class="language-python"># autoscaler.py — watches jvb load + spawns JVBs via Docker
import docker, time
client = docker.from_env()

THRESHOLD = 180  # participants per JVB
def scale():
    load = get_jvb_load()
    if load > THRESHOLD:
        client.containers.run(
            'jitsi/jvb:latest', detach=True,
            network='jitsi_meet', environment={'JVB_OPTS': '--apis=rest'}
        )
        print(f'[scale] +1 JVB  load={load}')

while True:
    scale()
    time.sleep(15)</code></pre>
<h3>Why not Kubernetes?</h3>
<ul>
<li>Single €12 VPS handles 300+ participants with 2 JVBs + Jibri.</li>
<li>Docker + Python is 30 lines vs 300 lines of Helm.</li>
<li>Jibri recording just works — no sidecar hell.</li>
</ul>
<h3>Stack</h3>
<p><code>Next.js</code> frontend → <code>Prosody</code> → <code>Jicofo</code> → <code>n× JVB</code> → <code>Jibri</code> → <code>MinIO</code></p>
<p>Full repo: <code>github.com/ixiflower/jitsi-infinity</code> — PRs welcome.</p>`;

  const contentFa = `<h1>استقرار Jitsi Meet در مقیاس بالا</h1>
<blockquote><p>چطور روی یک سرور مجازی با پایتون، Jitsi و Jibri را به صورت خودکار مقیاس دادم — بدون نیاز به Kubernetes.</p></blockquote>
<pre><code class="language-python"># autoscaler.py — بار JVB را می‌خواند و در صورت نیاز JVB جدید می‌سازد
import docker, time
client = docker.from_env()

THRESHOLD = 180  # تعداد شرکت‌کننده به ازای هر JVB
def scale():
    load = get_jvb_load()
    if load > THRESHOLD:
        client.containers.run(
            'jitsi/jvb:latest', detach=True,
            network='jitsi_meet', environment={'JVB_OPTS': '--apis=rest'}
        )
        print(f'[scale] +1 JVB  load={load}')

while True:
    scale()
    time.sleep(15)</code></pre>
<h3>چرا Kubernetes نه؟</h3>
<ul>
<li>یک سرور ۱۲ یورویی تا ۳۰۰ شرکت‌کننده را با ۲ JVB و Jibri جواب می‌دهد.</li>
<li>داکر + پایتون ۳۰ خط است در برابر ۳۰۰ خط Helm.</li>
<li>ضبط Jibri ساده و بدون دردسر sidecar کار می‌کند.</li>
</ul>
<h3>پشتهٔ فناوری</h3>
<p><code>Next.js</code> فرانت‌اند → <code>Prosody</code> → <code>Jicofo</code> → <code>n× JVB</code> → <code>Jibri</code> → <code>MinIO</code></p>
<p>ریپازیتوری کامل: <code>github.com/ixiflower/jitsi-infinity</code> — مشارکت آزاد است.</p>`;

  await sql`
    INSERT INTO posts (id, slug, slug_fa, title, title_fa, excerpt, excerpt_fa, content, content_fa, status, published_at, created_at, updated_at, author_id)
    VALUES (
      ${id},
      'deploying-jitsi-meet-at-scale',
      'esteghrar-jitsi-meet-dar-meghyas-bala',
      'Deploying Jitsi Meet at Scale',
      'استقرار Jitsi Meet در مقیاس بالا',
      'How I autoscale Jitsi + Jibri on a single VPS with Python.',
      'چطور روی یک سرور مجازی با پایتون Jitsi و Jibri را خودکار مقیاس دادم.',
      ${content},
      ${contentFa},
      'published',
      ${now},
      ${now},
      ${now},
      'ixi_flower'
    )
  `;
  console.log("Seeded Jitsi post:", id);

  // Tags
  const tags = [['DevOps','devops'],['Jitsi','jitsi'],['Jibri','jibri']];
  for (const [name, slug] of tags) {
    await sql`INSERT INTO tags (slug, name) VALUES (${slug}, ${name}) ON CONFLICT (slug) DO NOTHING`;
  }
  const tagRows = await sql`SELECT id, slug FROM tags WHERE slug IN ('devops','jitsi','jibri')`;
  for (const t of tagRows) {
    await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${id}, ${t.id}) ON CONFLICT (post_id, tag_id) DO NOTHING`;
  }
  console.log("Tagged Jitsi");
}

// Second post — Hydrogen
const existing2 = await sql`SELECT id FROM posts WHERE slug='headless-shopify-hydrogen' LIMIT 1`;
if (existing2.length === 0) {
  const id2 = crypto.randomUUID();
  const now = new Date().toISOString();
  const content2 = `<h1>Headless Shopify with Hydrogen</h1>
<blockquote><p>Oxygen, Remix, and glass — how I shipped shopify-frost in a weekend.</p></blockquote>
<pre><code class="language-tsx">// app/routes/products.$handle.tsx
export async function loader({ params }: LoaderArgs) {
  return await storefront.query(PRODUCT_QUERY, { variables: { handle: params.handle } });
}
export default function Product() {
  const { product } = useLoaderData&lt;typeof loader&gt;();
  return &lt;GlassCard product={product} /&gt;;
}</code></pre>
<p>Hydrogen on Oxygen is stupid fast — 80ms TTFB from edge.</p>`;
  const contentFa2 = `<h1>شاپیفای Headless با Hydrogen</h1>
<blockquote><p>Oxygen، Remix و شیشه — چطور shopify-frost را در یک آخر هفته ساختم.</p></blockquote>
<pre><code class="language-tsx">// app/routes/products.$handle.tsx
export async function loader({ params }: LoaderArgs) {
  return await storefront.query(PRODUCT_QUERY, { variables: { handle: params.handle } });
}
export default function Product() {
  const { product } = useLoaderData&lt;typeof loader&gt;();
  return &lt;GlassCard product={product} /&gt;;
}</code></pre>
<p>Hydrogen روی Oxygen فوق‌العاده سریع است — ۸۰ میلی‌ثانیه TTFB از لبه.</p>`;
  await sql`
    INSERT INTO posts (id, slug, slug_fa, title, title_fa, excerpt, excerpt_fa, content, content_fa, status, published_at, created_at, updated_at, author_id)
    VALUES (
      ${id2},
      'headless-shopify-hydrogen',
      'shopify-headless-ba-hydrogen',
      'Headless Shopify with Hydrogen',
      'شاپیفای Headless با Hydrogen',
      'Building a glassmorphism storefront with Shopify Hydrogen + Tailwind.',
      'ساخت ویترین شیشه‌ای با Shopify Hydrogen و Tailwind.',
      ${content2},
      ${contentFa2},
      'published',
      ${now},
      ${now},
      ${now},
      'ixi_flower'
    )
  `;
  console.log("Seeded Hydrogen:", id2);
  const feTag = await sql`SELECT id FROM tags WHERE slug='frontend' LIMIT 1`;
  if (feTag.length === 0) {
    await sql`INSERT INTO tags (slug, name) VALUES ('frontend','Frontend') ON CONFLICT (slug) DO NOTHING`;
    const ft = await sql`SELECT id FROM tags WHERE slug='frontend' LIMIT 1`;
    await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${id2}, ${ft[0].id}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${id2}, ${feTag[0].id}) ON CONFLICT DO NOTHING`;
  }
} else {
  console.log("Hydrogen already exists");
}
console.log("Done seeding");
