import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Case, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cases/[id]
 * Get a single case by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid case ID" }, { status: 400 });
    }

    await connectToDatabase();

    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    const caseDoc = await Case.findOne({
      _id: id,
      organizationId: membership.organizationId,
    });

    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      case: {
        id: caseDoc._id.toString(),
        title: caseDoc.title,
        caseNumber: caseDoc.caseNumber,
        court: caseDoc.court,
        client: caseDoc.client,
        description: caseDoc.description || '',
        stage: caseDoc.stage,
        stageProgress: caseDoc.stageProgress,
        priority: caseDoc.priority,
        nextDate: caseDoc.nextDate ? formatDate(caseDoc.nextDate) : 'Not Scheduled',
        filedDate: caseDoc.filedDate ? formatDate(caseDoc.filedDate) : '',
        status: caseDoc.status,
        createdAt: caseDoc.createdAt.toISOString(),
        updatedAt: caseDoc.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Failed to fetch case", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cases/[id]
 * Update a case
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid case ID" }, { status: 400 });
    }

    await connectToDatabase();

    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, caseNumber, court, client, description, stage, stageProgress, priority, nextDate, filedDate, status } = body;

    // Calculate stage progress based on stage if not explicitly provided
    const stageProgressMap: Record<string, number> = {
      'FILING': 15,
      'HEARING': 45,
      'ARGUMENTS': 70,
      'JUDGMENT': 95,
    };

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (caseNumber !== undefined) updateData.caseNumber = caseNumber;
    if (court !== undefined) updateData.court = court;
    if (client !== undefined) updateData.client = client;
    if (description !== undefined) updateData.description = description;
    if (stage !== undefined) {
      updateData.stage = stage;
      // Auto-update progress if not explicitly set
      if (stageProgress === undefined) {
        updateData.stageProgress = stageProgressMap[stage] || 15;
      }
    }
    if (stageProgress !== undefined) updateData.stageProgress = stageProgress;
    if (priority !== undefined) updateData.priority = priority;
    if (nextDate !== undefined) updateData.nextDate = nextDate ? new Date(nextDate) : null;
    if (filedDate !== undefined) updateData.filedDate = filedDate ? new Date(filedDate) : null;
    if (status !== undefined) updateData.status = status;

    const updatedCase = await Case.findOneAndUpdate(
      {
        _id: id,
        organizationId: membership.organizationId,
      },
      { $set: updateData },
      { new: true }
    );

    if (!updatedCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      case: {
        id: updatedCase._id.toString(),
        title: updatedCase.title,
        caseNumber: updatedCase.caseNumber,
        court: updatedCase.court,
        client: updatedCase.client,
        description: updatedCase.description || '',
        stage: updatedCase.stage,
        stageProgress: updatedCase.stageProgress,
        priority: updatedCase.priority,
        nextDate: updatedCase.nextDate ? formatDate(updatedCase.nextDate) : 'Not Scheduled',
        filedDate: updatedCase.filedDate ? formatDate(updatedCase.filedDate) : '',
        status: updatedCase.status,
        createdAt: updatedCase.createdAt.toISOString(),
        updatedAt: updatedCase.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error updating case:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A case with this case number already exists in your organization" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update case", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 * Delete (archive) a case
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid case ID" }, { status: 400 });
    }

    await connectToDatabase();

    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    // Soft delete - set status to archived
    const deletedCase = await Case.findOneAndUpdate(
      {
        _id: id,
        organizationId: membership.organizationId,
      },
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!deletedCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Case archived successfully",
    });
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Failed to delete case", message: error.message },
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
