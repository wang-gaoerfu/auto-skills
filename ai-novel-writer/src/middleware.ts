import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // 获取 JWT token（不需要数据库连接）
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isLoggedIn = !!token

  // 需要登录才能访问的路由
  const protectedRoutes = ["/dashboard", "/projects", "/knowledge", "/settings"]
  const isProtectedRoute = protectedRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  // 管理员路由
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  // 如果是受保护的路由但未登录，重定向到登录页
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // 如果是管理员路由但不是管理员，返回403
  if (isAdminRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // 如果已登录访问登录页，重定向到仪表盘
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // 如果已登录访问注册页，重定向到仪表盘
  if (isLoggedIn && nextUrl.pathname === "/register") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
