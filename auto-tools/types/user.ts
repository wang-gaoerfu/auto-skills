// User role types
export type UserRole = 'USER' | 'ADMIN'

// User interface
export interface User {
  id: string
  email: string
  phone?: string | null
  password: string
  name?: string | null
  avatar?: string | null
  role: UserRole
  isActive: boolean
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Public user info (without password)
export type PublicUser = Omit<User, 'password'>

// Registration input
export interface RegisterInput {
  email: string
  password: string
  name?: string
}

// Login input
export interface LoginInput {
  account: string  // email or phone
  password: string
}
