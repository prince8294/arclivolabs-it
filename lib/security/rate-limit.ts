import { createHmac } from "node:crypto";
import { RateLimit } from "@/models/rate-limit";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function getClientAddress(headers: Headers): string {
  const trustedAddress = headers.get("x-real-ip");
  if (trustedAddress) return trustedAddress.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const addresses = forwarded.split(",");
    return addresses[addresses.length - 1]?.trim() || "unknown";
  }

  return "unknown";
}

export async function consumeRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");

  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const key = createHmac("sha256", secret)
    .update(`${scope}\u0000${subject}`)
    .digest("hex");
  const id = `${scope}:${key}:${window}`;

  const record = await RateLimit.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) },
    },
    { new: true, upsert: true },
  )
    .select("count")
    .lean();

  if (!record) throw new Error("Rate limit record was not available.");

  return {
    allowed: record.count <= limit,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(((window + 1) * windowMs - now) / 1000),
    ),
    remaining: Math.max(0, limit - record.count),
  };
}
