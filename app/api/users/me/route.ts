import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization, OrganizationMember } from "@/lib/models";

/**
 * GET /api/users/me
 * Get current user's information with role and organization from MongoDB
 */
export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get user's organization membership from MongoDB
    const membership = await OrganizationMember.findOne({ userId: user.id });

    let organizationData = null;
    if (membership) {
      const organization = await Organization.findById(membership.organizationId);
      if (organization) {
        organizationData = {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
        };
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: membership?.role || null,
        organizationId: membership?.organizationId?.toString() || null,
        organizationName: organizationData?.name || null,
        joinedAt: membership?.joinedAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info", message: error.message },
      { status: 500 }
    );
  }
}
