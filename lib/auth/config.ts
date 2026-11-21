import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db/connect";
import { consumeRateLimit, getClientAddress } from "@/lib/security/rate-limit";
import { adminLoginSchema } from "@/lib/validations/enquiry";
import { Admin } from "@/models/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        await connectToDatabase();

        const address = getClientAddress(request.headers);
        const ipLimit = await consumeRateLimit(
          "admin-login-ip",
          address,
          10,
          15 * 60 * 1000,
        );
        if (!ipLimit.allowed) return null;

        const parsedLogin = adminLoginSchema.safeParse(credentials);
        if (!parsedLogin.success) return null;

        const emailLimit = await consumeRateLimit(
          "admin-login-email",
          parsedLogin.data.email,
          10,
          15 * 60 * 1000,
        );
        if (!emailLimit.allowed) return null;

        const admin = await Admin.findOne({ email: parsedLogin.data.email })
          .select("+passwordHash")
          .exec();
        if (!admin) return null;

        const passwordIsValid = await compare(
          parsedLogin.data.password,
          admin.passwordHash,
        );
        if (!passwordIsValid) return null;

        return {
          id: admin._id.toString(),
          email: admin.email,
          name: admin.email,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
