import 'next-auth'
import 'default'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      membershipStatus: string | null
      membershipPlan: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    membershipStatus?: string | null
    membershipPlan?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    membershipStatus: string | null
    membershipPlan: string | null
  }
}
