import { describe, it } from "vitest"
import { GET, POST } from "@/app/api/projects/route"
import { prisma } from "@/lib/prisma"

// Mock
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: "USER",
      membershipPlan: "VIP",
    },
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
    },
  },
}))

describe("/api/projects", () => {
  describe("GET", () => {
    it("应该返回用户的项目列表", async () => {
      const mockProjects = [
        {
          id: "project-1",
          title: "测试项目",
          description: "项目描述",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.project.findMany as vi.Mock).mockResolvedValue(mockProjects)

      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(1)
      expect(data.projects[0].title).toBe("测试项目")
    })
  })
})
