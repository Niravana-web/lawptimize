import { auth, clerkClient } from '@clerk/nextjs/server';
import type { UserMetadata, UserRole } from './types';

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await clerkClient.users.getUser(userId);
  return user;
}

/**
 * Get user's role from metadata
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const role = user.unsafeMetadata?.role || user.publicMetadata?.role;
  return role as UserRole | null;
}

/**
 * Get user's organization ID from metadata
 */
export async function getUserOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const orgId = user.unsafeMetadata?.organizationId || user.publicMetadata?.organizationId;
  return orgId as string | null;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Check if current user is member of organization
 */
export async function isOrganizationMember(organizationId: string): Promise<boolean> {
  const userOrgId = await getUserOrganizationId();
  return userOrgId === organizationId;
}

/**
 * Update user metadata (role and organization)
 */
export async function updateUserMetadata(
  userId: string,
  metadata: Partial<UserMetadata>
) {
  return await clerkClient.users.updateUser(userId, {
    unsafeMetadata: metadata,
  });
}

/**
 * Create a new organization member (user with role and organization)
 */
export async function createOrganizationMember(
  userId: string,
  organizationId: string,
  role: UserRole = 'user'
) {
  const metadata: UserMetadata = {
    role,
    organizationId,
    joinedAt: new Date().toISOString(),
  };

  return await clerkClient.users.updateUser(userId, {
    unsafeMetadata: metadata,
  });
}

/**
 * Get all users in an organization (admin only)
 * @deprecated Use the /api/organizations/members endpoint instead - members are now stored in MongoDB
 */
export async function getOrganizationMembers() {
  console.warn('getOrganizationMembers is deprecated. Use /api/organizations/members endpoint instead.');

  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify user is admin
  const currentUser = await clerkClient.users.getUser(userId);
  const userRole = currentUser.unsafeMetadata?.role || currentUser.publicMetadata?.role;

  if (userRole !== 'admin') {
    throw new Error('Only admins can view organization members');
  }

  // Return empty array - members should be fetched from MongoDB via the API
  return [];
}

