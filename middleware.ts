import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "ixi_admin_token";

function isPublicAuthPath(pathname: string): boolean {
  // login page + auth API are public
  if (pathname === "/admin/login") return true;
  if (pathname.startsWith("/api/admin/auth/")) return true;
  return false;
}

async function hasValidCookie(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET || "dev-secret-change-me";
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function hasValidSecretHeader(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET || process.env.IXI_SECRET || process.env.ADMIN_TOKEN;
  if (!secret) return false;
  const h =
    request.headers.get("x-admin-secret") ||
    request.headers.get("x-ixi-secret") ||
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (h === secret) return true;
  const emailHeader = request.headers.get("x-admin-email");
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (emailHeader && adminEmail && emailHeader.trim().toLowerCase() === adminEmail) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  if (isPublicAuthPath(pathname)) return NextResponse.next();

  // Allow if cookie JWT valid OR legacy secret header (back-compat)
  if (await hasValidCookie(request)) return NextResponse.next();
  if (hasValidSecretHeader(request)) return NextResponse.next();

  // Optional Stack Auth when configured
  const stackConfigured = Boolean(process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY);
  if (stackConfigured) {
    try {
      // @ts-ignore optional
      const mod: any = await import("@stackframe/stack" as string).catch(() => null);
      const stackApp = mod?.stackServerApp ?? null;
      if (stackApp) {
        const user = await stackApp.getUser().catch(() => null);
        const email: string | null = user?.primaryEmail ?? user?.email ?? null;
        const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        if (email && adminEmail && email.trim().toLowerCase() === adminEmail) return NextResponse.next();
      }
    } catch {}
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // admin pages → redirect to login
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
