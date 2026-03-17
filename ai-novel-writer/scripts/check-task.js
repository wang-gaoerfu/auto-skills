require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = process.argv[2] || 'cmmt7ym1300012nuzrw1gitob';

  // 检查最近的生成任务
  const task = await prisma.scriptGenerationTask.findFirst({
    where: { scriptProjectId: projectId },
    orderBy: { createdAt: 'desc' }
  });

  console.log('最近生成任务:');
  console.log(JSON.stringify(task, null, 2));

  // 检查项目的锁定状态
  const project = await prisma.scriptProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      subStatus: true,
      progress: true,
      generationLock: true
    }
  });

  console.log('\n项目状态:');
  console.log(JSON.stringify(project, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
