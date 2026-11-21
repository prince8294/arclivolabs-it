import { loadEnvConfig } from "@next/env";
import argon2 from "argon2";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Admin } from "@/models/admin";

async function createInitialAdmin() {
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
  if (await Admin.exists({})) {
    throw new Error("An admin account already exists; no account was changed.");
  }

  const passwordHash = await argon2.hash(input.data.password, {
    type: argon2.argon2id,
  });
  await Admin.create({
    email: input.data.email,
    passwordHash,
    accountSlot: "primary",
  });
  console.info("Initial admin account created.");
}

createInitialAdmin()
  .catch((error: unknown) => {
    console.error(
      "Admin initialization failed:",
      error instanceof Error ? error.message : "Unexpected error.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
