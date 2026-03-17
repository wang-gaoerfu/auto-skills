require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { ScriptAIService } = require('../lib/script/ai-service');

async function main() {
  const aiService = new ScriptAIService();

  console.log('测试 AI 生成镜头...\n');

  try {
    const result = await aiService.generateShots(
      {
        title: '零点刷新',
        location: '城市广场',
        mood: '紧张',
        characters: ['李明'],
        content: '午夜时分，李明站在城市广场中央，看着周围的景象开始发生变化。',
      },
      { '李明': { appearance: '青年男性，穿着黑色外套', personality: '冷静、果断' } }
    );

    console.log('生成结果:');
    console.log('镜头数量:', result.shots.length);
    console.log('镜头列表:', JSON.stringify(result.shots, null, 2));
  } catch (error) {
    console.error('错误:', error);
  }
}

main();
