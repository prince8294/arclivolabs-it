import { loadEnvConfig } from "@next/env";
import { hash } from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Admin } from "@/models/admin";

async function syncPrimaryAdmin() {
  loadEnvConfig(process.cwd());
  const input = z
    .object({
      email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
      password: z.string().min(14).max(256),
    })
    .safeParse({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

  if (!input.success) {
    throw new Error("Set a valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 14 characters.");
  }

  await connectToDatabase();
  const passwordHash = await hash(input.data.password, 12);
  await Admin.findOneAndUpdate(
    { accountSlot: "primary" },
    {
      $set: {
        email: input.data.email,
        passwordHash,
      },
      $setOnInsert: { accountSlot: "primary" },
    },
    { upsert: true, runValidators: true },
  ).exec();
  console.info("Primary admin credentials synchronized.");
}

syncPrimaryAdmin()
  .catch((error: unknown) => {
    console.error(
      "Admin synchronization failed:",
      error instanceof Error ? error.message : "Unexpected error.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
