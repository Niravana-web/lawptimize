import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Case, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

/**
 * GET /api/cases
 * Fetch all cases for the user's organization
 */
export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's organization membership
    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    // Fetch cases for this organization
    const cases = await Case.find({
      organizationId: membership.organizationId,
      status: { $ne: 'archived' }
    }).sort({ createdAt: -1 });

    // Transform for frontend
    const transformedCases = cases.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      caseNumber: c.caseNumber,
      court: c.court,
      client: c.client,
      description: c.description || '',
      stage: c.stage,
      stageProgress: c.stageProgress,
      priority: c.priority,
      nextDate: c.nextDate ? formatDate(c.nextDate) : 'Not Scheduled',
      filedDate: c.filedDate ? formatDate(c.filedDate) : '',
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      cases: transformedCases,
    });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's organization membership
    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, caseNumber, court, client, description, stage, priority, nextDate, filedDate } = body;

    // Validate required fields
    if (!title || !caseNumber || !court || !client) {
      return NextResponse.json(
        { error: "Missing required fields: title, caseNumber, court, client" },
        { status: 400 }
      );
    }

    // Calculate stage progress based on stage
    const stageProgressMap: Record<string, number> = {
      'FILING': 15,
      'HEARING': 45,
      'ARGUMENTS': 70,
      'JUDGMENT': 95,
    };

    // Create the case
    const newCase = await Case.create({
      organizationId: membership.organizationId,
      title,
      caseNumber,
      court,
      client,
      description: description || '',
      stage: stage || 'FILING',
      stageProgress: stageProgressMap[stage] || 15,
      priority: priority || 'MEDIUM',
      nextDate: nextDate ? new Date(nextDate) : undefined,
      filedDate: filedDate ? new Date(filedDate) : new Date(),
      status: 'active',
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      case: {
        id: newCase._id.toString(),
        title: newCase.title,
        caseNumber: newCase.caseNumber,
        court: newCase.court,
        client: newCase.client,
        description: newCase.description,
        stage: newCase.stage,
        stageProgress: newCase.stageProgress,
        priority: newCase.priority,
        nextDate: newCase.nextDate ? formatDate(newCase.nextDate) : 'Not Scheduled',
        filedDate: newCase.filedDate ? formatDate(newCase.filedDate) : '',
        status: newCase.status,
        createdAt: newCase.createdAt.toISOString(),
        updatedAt: newCase.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating case:", error);

    // Handle duplicate case number error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A case with this case number already exists in your organization" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create case", message: error.message },
      { status: 500 }
    );
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}
