import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { hasTrustedRequestOrigin } from "@/lib/security/request-origin";
import { readLimitedBody } from "@/lib/security/read-limited-body";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function getAdminId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function rejectUnauthorized() {
  return NextResponse.json(
    { message: "Sign in to access this resource." },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}

export function rejectOrigin(request: NextRequest) {
  if (hasTrustedRequestOrigin(request)) return null;
  return NextResponse.json(
    { message: "This request was not allowed." },
    { status: 403, headers: PRIVATE_HEADERS },
  );
}

export async function readJsonBody(
  request: NextRequest,
  maxBytes = 32 * 1024,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Send the request as JSON." },
        { status: 415, headers: PRIVATE_HEADERS },
      ),
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "The request is too large." },
        { status: 413, headers: PRIVATE_HEADERS },
      ),
    };
  }

  try {
    const body = await readLimitedBody(request, maxBytes);
    if (body.tooLarge) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "The request is too large." },
          { status: 413, headers: PRIVATE_HEADERS },
        ),
      };
    }
    return { ok: true, value: JSON.parse(body.text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "The request could not be understood." },
        { status: 400, headers: PRIVATE_HEADERS },
      ),
    };
  }
}

export function badInput(message = "Check the submitted fields.") {
  return NextResponse.json({ message }, { status: 400, headers: PRIVATE_HEADERS });
}

export async function writeAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  changes?: Record<string, unknown>,
) {
  const { AuditLog } = await import("@/models/business");
  await AuditLog.create({ actorId, action, entityType, entityId, summary, changes });
}
