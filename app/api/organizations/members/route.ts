import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrganizationMember } from '@/lib/models';

/**
 * GET /api/organizations/members
 * Get all members of the current user's organization
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
    const currentMembership = await OrganizationMember.findOne({ userId });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    // Get all members of the organization
    const members = await OrganizationMember.find({
      organizationId: currentMembership.organizationId,
    }).sort({ joinedAt: -1 });

    return NextResponse.json({
      success: true,
      members: members.map((member) => ({
        id: member._id.toString(),
        userId: member.userId,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/members
 * Remove a member from the organization (admin only)
 */
export async function DELETE(request: Request) {
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
    const currentMembership = await OrganizationMember.findOne({ userId });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get('userId');

    if (!memberUserId) {
      return NextResponse.json(
        { error: 'Member user ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from removing themselves
    if (memberUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the organization' },
        { status: 400 }
      );
    }

    // Remove member from database
    const member = await OrganizationMember.findOneAndDelete({
      organizationId: currentMembership.organizationId,
      userId: memberUserId,
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/members
 * Update a member's role (admin only)
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
    const currentMembership = await OrganizationMember.findOne({ userId });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update member roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberUserId, role } = body;

    if (!memberUserId || !role) {
      return NextResponse.json(
        { error: 'Member user ID and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    // Update member role in database
    const member = await OrganizationMember.findOneAndUpdate(
      {
        organizationId: currentMembership.organizationId,
        userId: memberUserId,
      },
      { $set: { role } },
      { new: true }
    );

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member._id.toString(),
        userId: member.userId,
        role: member.role,
      },
    });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role', message: error.message },
      { status: 500 }
    );
  }
}
