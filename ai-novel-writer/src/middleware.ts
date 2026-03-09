import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

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
  if (isAdminRoute && req.auth?.user?.role !== "ADMIN") {
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
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
