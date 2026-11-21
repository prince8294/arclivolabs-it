import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
  writeAuditLog,
} from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { projectTaskSchema } from "@/lib/validations/business";
import { ClientProject } from "@/models/business";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

const taskUpdateSchema = z
  .object({
    taskId: z.string().regex(/^[a-f\d]{24}$/i),
    completed: z.boolean(),
  })
  .strict();

export async function POST(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = projectTaskSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Enter a valid task title.");
  try {
    await connectToDatabase();
    const project = await ClientProject.findById(params.id).exec();
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
    project.tasks.push({
      title: parsed.data.title,
      assignedTo: parsed.data.assignedTo || undefined,
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T23:59:59.999Z`) : undefined,
      completed: false,
    });
    await project.save();
    await writeAuditLog(actorId, "project.task_added", "project", project._id.toString(), `Added a task to ${project.name}.`);
    return NextResponse.json(
      { item: project.toObject() },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Project task could not be added.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The task could not be added." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = taskUpdateSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Provide a valid task update.");
  try {
    await connectToDatabase();
    const project = await ClientProject.findById(params.id).exec();
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
    const task = project.tasks.find(
      (item) => item._id?.toString() === parsed.data.taskId,
    );
    if (!task) return NextResponse.json({ message: "Task not found." }, { status: 404, headers: PRIVATE_HEADERS });
    task.completed = parsed.data.completed;
    task.completedAt = task.completed ? new Date() : undefined;
    await project.save();
    await writeAuditLog(actorId, "project.task_updated", "project", project._id.toString(), `Updated a task on ${project.name}.`);
    return NextResponse.json({ item: project.toObject() }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Project task update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The task could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
