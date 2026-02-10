// Membership plan types
export type MembershipPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

// Membership status types
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

// Membership interface
export interface Membership {
  id: string
  userId: string
  plan: MembershipPlan
  status: MembershipStatus
  expiresAt?: Date | null
  appliedAt: Date
  approvedAt?: Date | null
  approvedBy?: string | null
  rejectedAt?: Date | null
  rejectReason?: string | null
}

// Membership price info
export interface MembershipPrice {
  price: number
  duration: number  // days
  name: string
}

// Membership prices mapping
export interface MembershipPrices {
  FREE: MembershipPrice
  BASIC: MembershipPrice
  PRO: MembershipPrice
  ENTERPRISE: MembershipPrice
}
