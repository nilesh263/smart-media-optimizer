import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Users are stored on the always-on backend (Railway), not in memory here —
// an in-memory array does not persist across Vercel's stateless serverless
// invocations, which made signed-up accounts vanish on the next request.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
        name:     { label: "Name",     type: "text"     },
        isSignup: { label: "IsSignup", type: "text"     },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const isSignup = credentials.isSignup === "true";
        const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";

        const res = await fetch(API_URL + endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:     credentials.name,
            email:    credentials.email,
            password: credentials.password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Authentication failed");
        return { id: data.id, name: data.name, email: data.email };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.name = user.name; }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id   = token.id as string;
        session.user.name          = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
