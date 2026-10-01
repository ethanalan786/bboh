import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { JWT } from "next-auth/jwt"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Check password (stored as plain text as requested)
        if (user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Check if user exists by Google ID first
        const existingUserByGoogleId = await prisma.user.findFirst({
          where: { googleId: account.providerAccountId }
        })

        if (existingUserByGoogleId) {
          user.id = existingUserByGoogleId.id
          user.role = existingUserByGoogleId.role
          return true
        }

        // Check if user exists by email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Create new user from Google data
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              role: 'FRONT_DESK', // Default role for new Google users
            }
          })
          user.id = newUser.id
          user.role = newUser.role
        } else {
          // Update existing user with Google info if needed
          if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                image: user.image || existingUser.image,
              }
            })
          }
          user.id = existingUser.id
          user.role = existingUser.role
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name || undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string || undefined
        session.user.image = null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, prepend the base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If the URL is already an absolute URL, return it as is
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      // Otherwise, redirect to the base URL (dashboard)
      return `${baseUrl}/dashboard`
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}