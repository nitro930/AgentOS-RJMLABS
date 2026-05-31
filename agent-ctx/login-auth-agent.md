# Task: Login/Auth Page for RJMLABS.CO.UK AgentOS

## Work Completed

### 1. Updated Seed Route (`/src/app/api/seed/route.ts`)
- Added `bcryptjs` import
- Added cleanup for `UserSession`, `User`, `RolePermission`, and `Role` tables
- Created 3 default roles: `admin`, `operator`, `viewer` with proper priorities and colors
- Created admin role permissions for all 12 resources (agents, memory, workflows, terminal, settings, users, audit, backups, knowledge, swarm, mcp, plugins)
- Created default admin user: `admin` / `admin123` with `admin@rjmlabs.co.uk` email

### 2. Created Login Page (`/src/app/login/page.tsx`)
- Full-page dark cyberpunk login screen with centered card
- Animated background with CSS grid, scan line, floating particles, and glow orbs
- RJM logo with Zap icon and "RJMLABS.CO.UK" / "AgentOS Platform" branding
- Username/email input with User icon
- Password input with Lock icon and Eye/EyeOff toggle
- "Remember me" checkbox
- Emerald-themed login button with loading state (Loader2 spinner)
- "Forgot password?" styled link (non-functional)
- Error message display with AnimatePresence
- Framer Motion entrance animations (fade, slide, scale)
- On successful login: stores token, session ID, session expiry, and user data in localStorage
- Redirects to "/" on success using router.push
- Checks for existing token on mount, auto-redirects if authenticated

### 3. Created Auth Guard (`/src/components/agent-os/auth-guard.tsx`)
- `AuthGuard` component wraps children with auth context
- Checks localStorage for `agentos_token` on mount
- Validates session expiry, clears expired sessions
- Redirects to `/login` if no valid token
- Shows loading spinner while checking auth
- Provides `login()` function that calls POST /api/auth
- Provides `logout()` function that calls DELETE /api/auth and clears storage
- `useAuth()` hook returns `{ isAuthenticated, user, token, loading, login, logout }`
- Full TypeScript types for AuthUser and AuthContextValue

### 4. Updated Main Page (`/src/app/page.tsx`)
- Imported `AuthGuard` from `@/components/agent-os/auth-guard`
- Wrapped entire return JSX with `<AuthGuard>` around `<ShortcutsProvider>`

## API Contract
- POST /api/auth: `{ username, password }` → `{ user, session: { id, token, expiresAt } }`
- DELETE /api/auth: `{ token }` → `{ success: true }`

## Default Credentials
- Username: `admin`
- Password: `admin123`

## Lint Status
All new/modified files pass lint. Pre-existing lint errors in other component files are unrelated.
