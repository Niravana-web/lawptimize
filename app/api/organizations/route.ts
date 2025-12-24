import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Organization, OrganizationMember } from '@/lib/models';

/**
 * GET /api/organizations
 * Get current user's organization details
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get user's membership
    const membership = await OrganizationMember.findOne({ userId });

    if (!membership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    // Get organization details
    const organization = await Organization.findById(membership.organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get member count
    const memberCount = await OrganizationMember.countDocuments({
      organizationId: organization._id,
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        createdBy: organization.createdBy,
        settings: organization.settings,
        subscription: organization.subscription,
        memberCount,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations
 * Update organization settings (admin only)
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get user's membership and check if admin
    const membership = await OrganizationMember.findOne({ userId });

    if (!membership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update organization settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, settings } = body;

    // Build update object
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (settings) {
      if (settings.defaultCurrency) updateData['settings.defaultCurrency'] = settings.defaultCurrency;
      if (settings.timezone) updateData['settings.timezone'] = settings.timezone;
      if (settings.billingEmail) updateData['settings.billingEmail'] = settings.billingEmail;
    }

    const organization = await Organization.findByIdAndUpdate(
      membership.organizationId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        settings: organization.settings,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization', message: error.message },
      { status: 500 }
    );
  }
}
