# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture Overview

Lawptimize is a legal SaaS platform built with Next.js 16 (App Router), Clerk authentication, and a Radix UI component system.

### Authentication Flow

Clerk authentication with organization-based multi-tenancy:
1. User signs in via `/sign-in` or `/sign-up`
2. Users without an organization are redirected to `/setup`
3. Admins create organizations via `/api/organizations/create`
4. User metadata stores `organizationId`, `role` ("admin" | "user"), `joinedAt`
5. `middleware.ts` protects routes; `UserProvider` (lib/user-context.tsx) provides client-side auth state

### State Management

Two React Context providers:
- **UserProvider** (`lib/user-context.tsx`): Fetches user data from `/api/users/me`, provides `user`, `isLoading`, `isAdmin`, `refreshUser()`
- **TaskProvider** (`lib/task-store.tsx`): In-memory task state for kanban board with CRUD operations

### API Routes

RESTful endpoints under `app/api/`:
- `GET /api/users/me` - Current user with metadata
- `POST /api/organizations/create` - Create organization (admin)
- `GET/POST /api/organizations/members` - Team member management
- `POST /api/organizations/invite` - Send invitations

All routes use Clerk's `currentUser()` and `clerkClient` for server-side auth.

### Component Patterns

- **UI Components** (`components/ui/`): shadcn/Radix-UI primitives with CVA (class-variance-authority) for variants
- **Feature Components**: Sidebar (navigation), AIChatBar (fixed bottom chat), IntelligenceFeed (live activity), PageHeader
- **Layout**: Fixed sidebar (16 units), dark theme default via next-themes

### Key Files

- `middleware.ts` - Route protection logic
- `lib/user-context.tsx` - User/auth state provider
- `lib/task-store.tsx` - Task state for kanban
- `lib/types.ts` - TypeScript interfaces (UserRole, UserMetadata, Task)
- `lib/clerk-utils.ts` - Auth utility functions
- `components/sidebar.tsx` - Main navigation with role-based visibility

### Styling

Tailwind CSS v4 with custom theme classes in `app/globals.css`:
- Color palette: cyan primary, teal/purple/pink accents
- Custom effects: `gradient-border`, `card-glow`, `logo-glow`
- Status colors: green (success), yellow (in-progress), red (urgent)
