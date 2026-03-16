/**
 * 剧本系统 API 测试验证脚本
 *
 * 运行方式：npx tsx scripts/test-script-apis.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// 测试结果记录
const results = {
  passed: 0,
  failed: 0,
  tests: [] as Array<{ name: string; status: "pass" | "fail"; message?: string }>,
}

// 辅助函数
async function test(name: string, testFn: () => Promise<void>) {
  try {
    await testFn()
    results.passed++
    results.tests.push({ name, status: "pass" })
    console.log(`✅ ${name}`)
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: "fail", message: String(error) })
    console.log(`❌ ${name}: ${error}`)
  }
}

// 测试：检查 API 路由是否可访问
async function checkEndpoint(name: string, path: string) {
  await test(name, async () => {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
  })
}

// 执行所有测试
async function runTests() {
  console.log("🧪 开始剧本系统 API 测试\n")

  // 剧本项目 API
  await checkEndpoint("剧本列表", "/api/scripts")

  // 成本监控 API
  await checkEndpoint("成本统计", "/api/scripts/cost/stats")

  // 会员 API
  await checkEndpoint("会员信息", "/api/scripts/membership")

  // 兑换码 API
  await checkEndpoint("兑换码列表", "/api/scripts/redemption-codes")

  console.log("\n📊 测试结果")
  console.log(`通过: ${results.passed}`)
  console.log(`失败: ${results.failed}`)
  console.log(`总计: ${results.passed + results.failed}`)
  console.log(`成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`)

  if (results.failed > 0) {
    console.log("\n❌ 失败的测试:")
    results.tests.filter((t) => t.status === "fail").forEach((t) => {
      console.log(`  - ${t.name}: ${t.message}`)
    })
    process.exit(1)
  } else {
    console.log("\n✅ 所有测试通过！")
  }
}

runTests().catch((error) => {
  console.error("测试执行失败:", error)
  process.exit(1)
})
