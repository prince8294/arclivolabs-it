import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
  writeAuditLog,
} from "@/lib/admin/api";
import { listManagedServices } from "@/lib/admin/content";
import { SERVICE_IDS, serviceInputSchema } from "@/lib/validations/business";
import { ManagedService } from "@/models/business";
import { connectToDatabase } from "@/lib/db/connect";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const serviceUpdateSchema = z
  .object({ id: z.enum(SERVICE_IDS) })
  .merge(serviceInputSchema)
  .strict();

export async function GET() {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    const items = await listManagedServices();
    return NextResponse.json({ items }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Services could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Services could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = serviceUpdateSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the service details and try again.");
  try {
    await connectToDatabase();
    const service = await ManagedService.findOneAndUpdate(
      { _id: parsed.data.id },
      {
        $set: {
          name: parsed.data.name,
          shortDescription: parsed.data.shortDescription,
          description: parsed.data.description,
          iconId: parsed.data.iconId,
          displayOrder: parsed.data.displayOrder,
          visible: parsed.data.visible,
        },
      },
      { new: true, runValidators: true },
    ).exec();
    if (!service) return NextResponse.json({ message: "Service not found." }, { status: 404, headers: PRIVATE_HEADERS });
    await writeAuditLog(actorId, "service.updated", "service", service._id, `Updated service ${service.name}.`);
    revalidatePath("/");
    return NextResponse.json({ item: service.toObject() }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Service update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The service could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
