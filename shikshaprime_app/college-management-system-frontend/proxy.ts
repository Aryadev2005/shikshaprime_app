// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Either default export...
export default function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  const response = NextResponse.next();

  if (subdomain) {
    response.cookies.set("tenant", subdomain, { path: "/" });
  }

  return response;
}

// Avoid running proxy on static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
