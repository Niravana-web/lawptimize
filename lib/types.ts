/**
 * User Role Types
 */
export type UserRole = 'admin' | 'user';

/**
 * Organization Structure
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended User Metadata for Clerk
 * This will be stored in Clerk user's public/unsafe metadata
 */
export interface UserMetadata {
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  joinedAt: string;
}

/**
 * Clerk User with custom metadata
 */
export interface ClerkUserWithMetadata {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    verified: boolean;
  }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  publicMetadata?: UserMetadata;
  unsafeMetadata?: UserMetadata;
}

/**
 * Organization Member
 */
export interface OrganizationMember {
  id: string;
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  organizationId: string;
  joinedAt: Date;
}

