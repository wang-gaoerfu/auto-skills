#!/usr/bin/env node

/**
 * 列出所有已安装的技能
 */

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.join(__dirname, '..', 'skills');

/**
 * 去除 JSON 注释
 */
function stripJsonComments(json) {
  let result = json;

  // 移除 // 单行注释
  result = result.replace(/\/\/.*$/gm, '');

  // 移除 /* */ 多行注释
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // 移除行尾逗号
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return result;
}

/**
 * 读取并解析 skill.json
 */
function readSkillJson(skillPath) {
  const jsonPath = path.join(skillPath, 'skill.json');

  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const cleanContent = stripJsonComments(content);
    return JSON.parse(cleanContent);
  } catch (error) {
    return null;
  }
}

/**
 * 获取技能分类
 */
function getSkillCategory(skillPath) {
  const relativePath = path.relative(SKILLS_ROOT, skillPath);
  const parts = relativePath.split(path.sep);
  return parts[0] || 'unknown';
}

/**
 * 扫描所有技能
 */
function scanSkills() {
  const categories = ['builtin', 'community', 'templates'];
  const skills = [];

  for (const category of categories) {
    const categoryPath = path.join(SKILLS_ROOT, category);

    if (!fs.existsSync(categoryPath)) {
      continue;
    }

    const entries = fs.readdirSync(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = path.join(categoryPath, entry.name);
      const skillJson = readSkillJson(skillPath);

      if (skillJson) {
        skills.push({
          name: skillJson.name || entry.name,
          displayName: skillJson.displayName || skillJson.name,
          description: skillJson.description || '',
          version: skillJson.version || '0.0.0',
          category: category,
          path: path.join('skills', category, entry.name)
        });
      }
    }
  }

  return skills;
}

/**
 * 输出技能列表
 */
function printSkills(skills) {
  console.log('\n' + '='.repeat(60));
  console.log('  Auto-Skills 技能列表');
  console.log('='.repeat(60) + '\n');

  const byCategory = {
    builtin: skills.filter(s => s.category === 'builtin'),
    community: skills.filter(s => s.category === 'community'),
    templates: skills.filter(s => s.category === 'templates')
  };

  // 内置技能
  if (byCategory.builtin.length > 0) {
    console.log('📦 内置技能 (builtin)');
    console.log('─'.repeat(40));
    for (const skill of byCategory.builtin) {
      console.log(`  /${skill.name.padEnd(20)} ${skill.version.padEnd(8)}`);
      if (skill.description) {
        console.log(`  ${' '.repeat(4)}${skill.description}`);
      }
      console.log();
    }
  }

  // 社区技能
  if (byCategory.community.length > 0) {
    console.log('🌍 社区技能 (community)');
    console.log('─'.repeat(40));
    for (const skill of byCategory.community) {
      console.log(`  /${skill.name.padEnd(20)} ${skill.version.padEnd(8)}`);
      if (skill.description) {
        console.log(`  ${' '.repeat(4)}${skill.description}`);
      }
      console.log();
    }
  }

  // 模板
  if (byCategory.templates.length > 0) {
    console.log('📋 技能模板 (templates)');
    console.log('─'.repeat(40));
    for (const skill of byCategory.templates) {
      console.log(`  ${skill.name.padEnd(20)}`);
      if (skill.description) {
        console.log(`  ${' '.repeat(4)}${skill.description}`);
      }
      console.log();
    }
  }

  console.log('='.repeat(60));
  console.log(`  总计: ${skills.length} 个技能`);
  console.log('='.repeat(60) + '\n');
}

// 主函数
function main() {
  const skills = scanSkills();
  printSkills(skills);
}

main();
