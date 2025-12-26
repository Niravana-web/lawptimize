import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrganizationMember } from '@/lib/models';
import mongoose from 'mongoose';

/**
 * DELETE /api/organizations/members/[id]
 * Remove a member from the organization (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get current user's membership and verify admin
    const currentMembership = await OrganizationMember.findOne({ userId });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can remove members' },
        { status: 403 }
      );
    }

    // Find the member to remove
    const memberToRemove = await OrganizationMember.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: currentMembership.organizationId,
    });

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing yourself
    if (memberToRemove.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the organization' },
        { status: 400 }
      );
    }

    // Prevent removing other admins
    if (memberToRemove.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin members' },
        { status: 400 }
      );
    }

    // Delete the member
    await OrganizationMember.findByIdAndDelete(id);

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
 * PATCH /api/organizations/members/[id]
 * Update member role (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get current user's membership and verify admin
    const currentMembership = await OrganizationMember.findOne({ userId });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can change member roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    // Find the member to update
    const memberToUpdate = await OrganizationMember.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: currentMembership.organizationId,
    });

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent changing your own role
    if (memberToUpdate.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Update the role
    memberToUpdate.role = role;
    await memberToUpdate.save();

    return NextResponse.json({
      success: true,
      message: `Member role updated to ${role}`,
      member: {
        id: memberToUpdate._id.toString(),
        email: memberToUpdate.email,
        role: memberToUpdate.role,
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
