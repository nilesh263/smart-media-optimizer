import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const users: { id: string; name: string; email: string; password: string }[] = [];

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

        const email    = credentials.email.toLowerCase();
        const password = credentials.password;
        const isSignup = credentials.isSignup === "true";

        if (isSignup) {
          const exists = users.find(u => u.email === email);
          if (exists) throw new Error("Email already registered");
          const hashed  = await bcrypt.hash(password, 10);
          const newUser = { id: Date.now().toString(), name: credentials.name || email.split("@")[0], email, password: hashed };
          users.push(newUser);
          return { id: newUser.id, name: newUser.name, email: newUser.email };
        } else {
          const user = users.find(u => u.email === email);
          if (!user) throw new Error("No account found with this email");
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) throw new Error("Incorrect password");
          return { id: user.id, name: user.name, email: user.email };
        }
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
