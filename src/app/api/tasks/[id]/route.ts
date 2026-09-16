import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import { ZodError } from "zod";
import { Priority } from "@prisma/client";

function getTaskId(request: NextRequest, context?: { params?: { id?: string } }): string | null {
  if (context?.params?.id) {
    return context.params.id;
  }
  const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment || null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getTaskId(request, context);
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedData = updateTaskSchema.parse(body);

    const updateData: {
      title?: string;
      description?: string | null;
      completed?: boolean;
      priority?: Priority;
      dueDate?: Date | null;
    } = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.completed !== undefined) updateData.completed = validatedData.completed;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority as Priority;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getTaskId(request, context);
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
