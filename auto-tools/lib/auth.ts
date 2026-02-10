import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        account: { label: '邮箱/手机', type: 'text' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.account || !credentials?.password) {
          throw new Error('请输入账号和密码')
        }

        // Find user by email or phone
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.account },
              { phone: credentials.account }
            ]
          },
          include: {
            membership: true
          }
        })

        if (!user) {
          throw new Error('账号不存在')
        }

        if (!user.isActive) {
          throw new Error('账号已被禁用')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('密码错误')
        }

        // Return user data (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          membershipStatus: user.membership?.status || null,
          membershipPlan: user.membership?.plan || null,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token on sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.membershipStatus = user.membershipStatus || null
        token.membershipPlan = user.membershipPlan || null
      }
      return token
    },
    async session({ session, token }) {
      // Add token info to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.membershipStatus = token.membershipStatus as string | null
        session.user.membershipPlan = token.membershipPlan as string | null
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
