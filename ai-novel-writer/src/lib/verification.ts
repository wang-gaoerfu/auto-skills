// 验证码存储（开发环境用内存，生产环境建议用 Redis）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()
const resendLimits = new Map<string, number>()

const CODE_EXPIRE_TIME = Number(process.env.VERIFICATION_CODE_EXPIRE_MINUTES || 10) * 60 * 1000
const RESEND_INTERVAL = Number(process.env.VERIFICATION_CODE_RESEND_INTERVAL || 60) * 1000

// 保存验证码
export function saveVerificationCode(email: string, code: string): void {
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + CODE_EXPIRE_TIME,
  })
}

// 验证验证码
export function verifyCode(email: string, code: string): boolean {
  const stored = verificationCodes.get(email)

  if (!stored) {
    return false
  }

  // 检查是否过期
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email)
    return false
  }

  // 验证码正确
  if (stored.code === code) {
    verificationCodes.delete(email)
    return true
  }

  return false
}

// 检查是否可以重发验证码
export function canResendCode(email: string): boolean {
  const lastSent = resendLimits.get(email)

  if (!lastSent) {
    return true
  }

  return Date.now() > lastSent
}

// 设置重发限制
export function setResendLimit(email: string): void {
  resendLimits.set(email, Date.now() + RESEND_INTERVAL)
}

// 清理过期的验证码（定期执行）
export function cleanupExpiredCodes(): void {
  const now = Date.now()

  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email)
    }
  }

  for (const [email, expiresAt] of resendLimits.entries()) {
    if (now > expiresAt) {
      resendLimits.delete(email)
    }
  }
}

// 每5分钟清理一次
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredCodes, 5 * 60 * 1000)
}
