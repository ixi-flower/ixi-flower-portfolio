import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

function isStackConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY,
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin and /api/admin
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // If Stack Auth is configured, try to use it (best-effort)
  if (isStackConfigured()) {
    try {
      // @ts-ignore — optional dep, only when Stack Auth is configured
      const mod: any = await import("@stackframe/stack" as string).catch(() => null);
      const stackApp = mod?.stackServerApp ?? null;
      if (stackApp) {
        const user = await stackApp.getUser().catch(() => null);
        const email: string | null =
          user?.primaryEmail ?? user?.email ?? null;
        if (email && email.trim().toLowerCase() === ADMIN_EMAIL) {
          return NextResponse.next();
        }
        // Allow secret header override even when Stack is configured
        const secret = process.env.ADMIN_SECRET || process.env.IXI_SECRET;
        if (secret) {
          const h =
            request.headers.get("x-admin-secret") ||
            request.headers.get("x-ixi-secret") ||
            request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
          if (h === secret) return NextResponse.next();
        }
        if (isAdminApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // fall through to secret check
    }
  }

  // Fallback: check secret header (dev / pre-Stack)
  const secret = process.env.ADMIN_SECRET || process.env.IXI_SECRET || process.env.ADMIN_TOKEN;
  if (secret) {
    const h =
      request.headers.get("x-admin-secret") ||
      request.headers.get("x-ixi-secret") ||
      request.headers.get("x-admin-token") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (h === secret) return NextResponse.next();
    // Also allow x-admin-email matching ADMIN_EMAIL when no Stack
    const emailHeader = request.headers.get("x-admin-email");
    if (emailHeader && emailHeader.trim().toLowerCase() === ADMIN_EMAIL) {
      return NextResponse.next();
    }
  }

  // No valid credentials
  if (isAdminApi) {
    const hasHeader =
      request.headers.has("x-admin-secret") ||
      request.headers.has("x-ixi-secret") ||
      request.headers.has("authorization");
    return NextResponse.json(
      { error: hasHeader ? "Forbidden — invalid credentials" : "Unauthorized" },
      { status: hasHeader ? 403 : 401 },
    );
  }

  // For admin pages: redirect to home if not owner
  // In dev without Stack, pages are client-guarded; middleware allows through only with header
  // For now, allow pages through — client components will handle redirect
  // But if ADMIN_SECRET is set and no header, block API only (pages handled client-side)
  // To avoid infinite redirect loops in dev, let pages through
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
