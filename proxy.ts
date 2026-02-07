import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session (this also sets cookies properly)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const user = session?.user || null

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth', '/api']
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and trying to access login/signup page, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check role-based access
  if (user) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const userRole = roleData?.role

    // Protect /admin routes - Admin only
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Protect /settings routes - Admin only
    if (request.nextUrl.pathname.startsWith('/settings')) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Protect all transaction routes - Admin and Bookkeeper only (Viewers cannot access)
    if (request.nextUrl.pathname.startsWith('/transactions')) {
      if (userRole !== 'admin' && userRole !== 'bookkeeper') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Protect donor statement routes - Admin and Bookkeeper only (Viewers cannot access)
    if (
      request.nextUrl.pathname.startsWith('/reports/donor-statements') ||
      request.nextUrl.pathname.startsWith('/reports/annual-statements')
    ) {
      if (userRole !== 'admin' && userRole !== 'bookkeeper') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
    
    // Check for dashboard and other routes
    if (!userRole && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
