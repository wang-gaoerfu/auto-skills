import { z } from 'zod'

// Register schema
export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  name: z.string().optional(),
})

// Login schema
export const loginSchema = z.object({
  account: z.string().min(1, '请输入邮箱或手机号'),
  password: z.string().min(1, '请输入密码'),
})

// Tool execution schema
export const toolExecutionSchema = z.object({
  toolId: z.string().min(1, '工具ID不能为空'),
  input: z.record(z.any(), z.any()),
})
