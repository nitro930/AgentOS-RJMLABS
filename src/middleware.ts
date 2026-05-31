import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Rate Limiting Store ──────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window per IP

// Clean up stale entries every 60 seconds
let lastCleanup = Date.now()
function cleanupStale() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupStale()
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// ─── Security Headers ─────────────────────────────────────────────────────────

function getSecurityHeaders(isProduction: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "worker-src 'self' blob:",
    ].join('; '),
  }

  if (isProduction) {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubDomains'
  }

  return headers
}

// ─── Unprotected Routes ───────────────────────────────────────────────────────

const PUBLIC_API_ROUTES = ['/api/auth', '/api/health', '/api/seed']
const STATIC_PATHS = ['/_next', '/favicon', '/logo', '/robots']

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProduction = process.env.NODE_ENV === 'production'
  const response = NextResponse.next()

  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders(isProduction)
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  // Skip rate limiting and auth for static assets
  if (STATIC_PATHS.some((p) => pathname.startsWith(p))) {
    return response
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: RATE_LIMIT_WINDOW / 1000,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(RATE_LIMIT_WINDOW / 1000),
            ...securityHeaders,
          },
        }
      )
    }

    // Auth check for protected API routes
    const isPublicRoute = PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))
    if (!isPublicRoute) {
      const token =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('agentos_token')?.value

      if (!token && request.method !== 'GET') {
        // Allow GET requests through for now (the client sends tokens via headers)
        // but require auth for mutations from non-browser clients
        const userAgent = request.headers.get('user-agent') || ''
        const isBrowserRequest =
          userAgent.includes('Mozilla') || userAgent.includes('Chrome')

        if (!isBrowserRequest) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401, headers: securityHeaders }
          )
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    '/((?!_next/static|_next/image).*)',
  ],
}
