import { describe, it from "vitest"
import { POST, from "@/app/api/auth/register/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
    membership: {
    create: vi.fn(),
  },
  },
}))

describe("/api/auth/register", () => {
  describe("POST", () => {
    it("应该成功注册新用户", async () => {
    const mockUser = {
      id: "test-id",
      email: "test@example.com",
      name: "测试用户",
    }

    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)
    ;(prisma.user.create as vi.Mock).mockResolvedValue(mockUser)
    ;(prisma.membership.create as vi.Mock).mockResolvedValue({
      id: "membership-id",
      userId: "test-id",
      plan: "FREE",
      status: "APPROVED",
    })

    const response = await POST({
      json: () => ({
        email: "test@example.com",
        password: "123456",
        code: "123456",
        name: "测试用户",
      }),
    } as any)

    expect(response.status).toBe(201)
  })

  it("应该在邮箱已存在时返回错误", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
      id: "existing-id",
      email: "existing@example.com",
    })

    const response = await POST({
      json: () => ({
        email: "existing@example.com",
        password: "123456",
        code: "123456",
      }),
    } as any)

    expect(response.status).toBe(400)
  })
})
