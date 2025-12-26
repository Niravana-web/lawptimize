import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrganizationMember } from '@/lib/models';
import mongoose from 'mongoose';

/**
 * POST /api/organizations/accept-invitation
 * Accept an organization invitation
 */
export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Decode invitation token
    let inviteData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      inviteData = JSON.parse(decoded);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const { memberId, organizationId, organizationName, email, role } = inviteData;

    // Verify email matches current user
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (userEmail?.toLowerCase() !== email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if user already belongs to an organization
    const existingMembership = await OrganizationMember.findOne({ userId: user.id });
    if (existingMembership) {
      return NextResponse.json(
        { error: 'You already belong to an organization' },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await OrganizationMember.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      email: email.toLowerCase(),
      status: 'invited',
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    // Update the invitation to active membership
    invitation.userId = user.id;
    invitation.status = 'active';
    invitation.firstName = user.firstName || undefined;
    invitation.lastName = user.lastName || undefined;
    invitation.joinedAt = new Date();
    await invitation.save();

    return NextResponse.json({
      success: true,
      message: `Welcome to ${organizationName}!`,
      organization: {
        id: organizationId,
        name: organizationName,
        role,
      },
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/accept-invitation
 * Verify invitation token and get details
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Decode invitation token
    let inviteData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      inviteData = JSON.parse(decoded);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const { memberId, organizationId, organizationName, email, role } = inviteData;

    await connectToDatabase();

    // Verify invitation still exists and is pending
    const invitation = await OrganizationMember.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      email: email.toLowerCase(),
      status: 'invited',
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted', valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        organizationName,
        email,
        role,
        invitedAt: invitation.invitedAt,
      },
    });
  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation', message: error.message },
      { status: 500 }
    );
  }
}
