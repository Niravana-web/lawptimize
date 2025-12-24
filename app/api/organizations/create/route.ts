import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Organization, OrganizationMember } from '@/lib/models';

/**
 * POST /api/organizations/create
 * Create a new organization (admin creates their organization)
 * Only users without an existing organization can create one
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user
    const user = await currentUser();

    // Connect to MongoDB
    await connectToDatabase();

    // Check if user already belongs to an organization
    const existingMembership = await OrganizationMember.findOne({ userId });
    if (existingMembership) {
      return NextResponse.json(
        { error: 'User already belongs to an organization' },
        { status: 400 }
      );
    }

    // Get organization data from request body
    const body = await request.json();
    const { organizationName, organizationSlug } = body;

    if (!organizationName || !organizationSlug) {
      return NextResponse.json(
        { error: 'Organization name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingOrg = await Organization.findOne({ slug: organizationSlug.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already taken. Please choose a different one.' },
        { status: 400 }
      );
    }

    // Create organization in MongoDB
    const organization = await Organization.create({
      name: organizationName,
      slug: organizationSlug.toLowerCase(),
      createdBy: userId,
      settings: {
        defaultCurrency: 'USD',
        timezone: 'UTC',
      },
      subscription: {
        plan: 'free',
        status: 'active',
      },
    });

    // Create organization member record for the admin
    await OrganizationMember.create({
      organizationId: organization._id,
      userId: userId,
      email: user?.emailAddresses[0]?.emailAddress || '',
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      role: 'admin',
      status: 'active',
      joinedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        createdBy: userId,
        createdAt: organization.createdAt,
      },
      user: {
        id: userId,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Error creating organization:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Organization slug is already taken. Please choose a different one.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization', message: error.message },
      { status: 500 }
    );
  }
}
