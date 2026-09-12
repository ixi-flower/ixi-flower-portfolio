import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  // During `next build` on Vercel the env may not yet be injected for
  // pages that statically import `db`. Return a proxy that throws only
  // when actually queried, so the build can complete.
  if (!url) {
    console.warn("[db] DATABASE_URL not set — db queries will fail until env is configured");
    // Use a dummy URL so `neon()` doesn't throw at import time; any real query will still error.
    const dummy = neon("postgresql://user:pass@localhost:5432/dummy");
    return drizzle(dummy, { schema });
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = createDb();
export { schema };
