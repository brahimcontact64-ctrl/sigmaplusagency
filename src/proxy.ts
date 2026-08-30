import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * The admin area is intentionally outside the [locale] tree (see
 * master plan Phase 5 — "admin UI language independent from public
 * routing"), so it must never pass through next-intl's middleware:
 * that would try to resolve/redirect it to a locale-prefixed path.
 *
 * This is an *optimistic* check only (JWT signature/expiry, no DB
 * round-trip) per Next's own Proxy-for-auth guidance — it exists to
 * bounce obviously-unauthenticated requests before they render
 * anything, not as the real authorization boundary. The actual,
 * DB-verified check lives in src/lib/auth/dal.ts's requireActor() and
 * runs again in every protected layout/page/server action.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoginRoute = pathname === "/admin/login";
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await decryptSession(sessionCookie);

    if (!session && !isLoginRoute) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (session && isLoginRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
