import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from 'bcryptjs'

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET environment variable is not set');
    }
    return 'fallback-secret-for-development';
  })(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          // User not found or password not set (e.g., OAuth user)
          return null
        }

        const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password)

        if (passwordsMatch) {
          // Return a minimal user object
          // The session callback will populate more details
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            country: user.country
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    // The `user` object passed to the `jwt` callback is only available on sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.country = user.country
      }
      return token
    },
    // The `session` callback receives the token from the `jwt` callback.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.country = token.country as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login", // The spec had /auth/signin, but the file structure has /login
  },
  session: {
    strategy: "jwt"
  }
} satisfies NextAuthConfig
