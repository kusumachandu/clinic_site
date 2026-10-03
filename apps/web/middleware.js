import { NextResponse } from 'next/server';

// Quick gate: no login cookie means no admin pages. The API still verifies the session.
export function middleware(req) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (!req.cookies.get('clinic_token')) return NextResponse.redirect(new URL('/admin/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
