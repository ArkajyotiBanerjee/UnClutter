import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, PriorityEnum } from "@/lib/validations/task";
import { ZodError } from "zod";
import { Priority } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const completedParam = searchParams.get("completed");
    const priorityParam = searchParams.get("priority");
    const searchParam = searchParams.get("search");

    const where: {
      userId: string;
      completed?: boolean;
      priority?: Priority;
      title?: { contains: string; mode: "insensitive" };
    } = {
      userId: session.user.id,
    };

    if (completedParam === "true") {
      where.completed = true;
    } else if (completedParam === "false") {
      where.completed = false;
    }

    if (priorityParam && PriorityEnum.safeParse(priorityParam).success) {
      where.priority = priorityParam as Priority;
    }

    if (searchParam && searchParam.trim().length > 0) {
      where.title = {
        contains: searchParam.trim(),
        mode: "insensitive",
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { completed: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedData = createTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        description: validatedData.description ?? null,
        completed: validatedData.completed ?? false,
        priority: validatedData.priority as Priority,
        dueDate: validatedData.dueDate ?? null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
