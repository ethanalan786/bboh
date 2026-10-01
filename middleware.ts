import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth') ||
                     req.nextUrl.pathname.startsWith('/forgotpassword')
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard')
  const isHomePage = req.nextUrl.pathname === '/'
  const isAdminPage = req.nextUrl.pathname.startsWith('/dashboard/admin')
  const isFrontDeskPage = req.nextUrl.pathname.startsWith('/dashboard/front-desk-role')

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Don't redirect if going to dashboard page itself (let it handle the redirect)
  if (isDashboardPage && req.nextUrl.pathname === '/dashboard') {
    return NextResponse.next()
  }

  // Redirect unauthenticated users from dashboard pages to login
  if (!isAuth && isDashboardPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Role-based access control
  if (isAuth && isDashboardPage) {
    const userRole = token?.role as string

    // Prevent non-admin users from accessing admin pages
    if (isAdminPage && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/front-desk-role', req.url))
    }

    // Prevent admin users from accessing front-desk pages
    if (isFrontDeskPage && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
