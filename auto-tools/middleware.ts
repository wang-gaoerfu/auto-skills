import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = req.nextUrl.pathname.startsWith('/admin')
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                       req.nextUrl.pathname.startsWith('/register')

    // Check admin access
    if (isAdmin && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
        const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard') ||
                                req.nextUrl.pathname.startsWith('/membership') ||
                                req.nextUrl.pathname.startsWith('/profile')

        // Public pages
        if (!isAdminPage && !isProtectedPage) {
          return true
        }

        // Protected pages require auth
        if (isProtectedPage && !token) {
          return false
        }

        // Admin pages require admin role
        if (isAdminPage && token?.role !== 'ADMIN') {
          return false
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
