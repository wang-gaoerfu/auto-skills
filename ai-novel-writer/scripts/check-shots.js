require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = process.argv[2] || 'cmmt7ym1300012nuzrw1gitob';

  // 检查场景1的镜头
  const scene1 = await prisma.scriptScene.findFirst({
    where: {
      scriptProjectId: projectId,
      sceneNumber: 1
    },
    include: { shots: true }
  });

  console.log('场景1信息:', scene1 ? {
    id: scene1.id,
    title: scene1.title,
    shotCount: scene1.shots.length
  } : '不存在');

  if (scene1 && scene1.shots.length > 0) {
    console.log('\n场景1的镜头:');
    scene1.shots.forEach(shot => {
      console.log({
        id: shot.id,
        shotNumber: shot.shotNumber,
        shotType: shot.shotType,
        duration: shot.duration,
        status: shot.status
      });
    });
  }

  // 检查所有场景的镜头数
  const allScenes = await prisma.scriptScene.findMany({
    where: { scriptProjectId: projectId },
    include: { _count: { select: { shots: true } } },
    orderBy: { sceneNumber: 'asc' }
  });

  console.log('\n所有场景镜头统计:');
  allScenes.forEach(s => {
    console.log(`场景${s.sceneNumber}: ${s._count.shots} 个镜头`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
