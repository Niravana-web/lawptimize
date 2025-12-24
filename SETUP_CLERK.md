# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for your Lawptimize application.

## Prerequisites

- A Clerk account (sign up at [clerk.com](https://clerk.com))
- Next.js development environment already set up

## Step 1: Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign in to your account
2. Click "Create Application" or "Add Application"
3. Give your application a name (e.g., "Lawptimize")
4. Select your development environment (Development)
5. Click "Create Application"

## Step 2: Get Your API Keys

1. After creating the application, you'll see your API Keys
2. Copy the following values:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Clerk credentials:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Replace the `xxxxx` with your actual Clerk keys.

## Step 4: Configure Clerk Dashboard

### Email/Password Authentication

1. In your Clerk dashboard, go to "User & Authentication" → "Email, Phone & Username"
2. Make sure "Email Address" is enabled
3. Optionally enable "Phone Number" or "Username"

### Session Settings

1. Go to "Sessions"
2. Configure session duration (default: 1 week is good for most apps)
3. Enable "Sign out on tab close" if desired

### JWT Templates (Optional, for advanced use)

1. Go to "JWT Templates"
2. You may want to customize claims to include organization ID and role
3. For now, we're using Clerk's metadata system

## Step 5: Test the Authentication

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to sign-in page
4. Create a new account by clicking "Sign up"
5. Complete the sign-up process
6. After signing up, you'll be redirected to the setup page to create your organization
7. Create your organization to become an Admin

## Step 6: Invite Team Members (Admin Only)

1. As an admin, go to the "Organization" page
2. Enter the email address of the team member you want to invite
3. Click "Invite"
4. Share the invite link with the team member
5. The team member will sign up and automatically join your organization as a "User"

## Features Implemented

### Authentication Flow
- ✅ Sign in / Sign up pages
- ✅ Protected routes (requires authentication)
- ✅ Automatic redirects to sign-in for unauthenticated users
- ✅ Sign out functionality

### Organization Management
- ✅ One organization per user setup
- ✅ Admin role (can manage organization and invite users)
- ✅ User role (standard member access)
- ✅ Organization creation for first-time users
- ✅ Team member invitation system
- ✅ View organization members (admin only)

### Role-Based Access Control (RBAC)
- ✅ Admin-only routes (e.g., `/organization`)
- ✅ Role-based UI elements (admin sees extra options)
- ✅ Protected API endpoints with role checks

### User Context
- ✅ Global user context with role and organization info
- ✅ Access user data throughout the app
- ✅ Admin status helper

## API Endpoints

### User Management
- `GET /api/users/me` - Get current user info with role and organization

### Organization Management
- `POST /api/organizations/create` - Create new organization (for first-time users)
- `POST /api/organizations/invite` - Invite a user to organization (admin only)
- `GET /api/organizations/members` - Get all organization members (admin only)

## Data Structure

### User Metadata (Stored in Clerk)
```typescript
{
  role: 'admin' | 'user',
  organizationId: string,
  organizationName: string,
  joinedAt: string (ISO timestamp)
}
```

### Organization Structure
- One organization per user group
- One admin per organization
- Multiple users per organization

## Security Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Secret Key**: Keep `CLERK_SECRET_KEY` secure and never expose it on the client side
3. **Middleware**: All routes except `/sign-in` and `/sign-up` are protected
4. **Role Checks**: Admin-only routes and actions are validated on the server side
5. **Organization Isolation**: Users can only access their own organization's data

## Troubleshooting

### Issue: "Unauthorized" errors
- Make sure you're signed in
- Check that your Clerk keys are correct
- Verify middleware is running

### Issue: Can't access organization page
- Only admins can access `/organization`
- Check your user role in `/profile`

### Issue: Can't create organization
- You can only create one organization per user
- Check if you already have an organization assigned

### Issue: Invite not working
- Verify you're logged in as admin
- Check the email address is valid
- Ensure invitee doesn't already belong to another organization

## Next Steps

1. Customize the Clerk components (sign-in, sign-up forms)
2. Add organization settings page
3. Implement member removal functionality
4. Add role management (promote users to admin)
5. Add email notifications for invites
6. Implement organization data (MongoDB) for storing organization details
7. Add more admin-only features

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js SDK](https://clerk.com/docs/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com)

