#!/usr/bin/env node

/**
 * 验证所有技能的配置
 */

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.join(__dirname, '..', 'skills');

// 验证结果
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * 去除 JSON 注释
 */
function stripJsonComments(json) {
  let result = json;
  result = result.replace(/\/\/.*$/gm, '');
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/,(\s*[}\]])/g, '$1');
  return result;
}

/**
 * 验证单个技能
 */
function validateSkill(skillPath, category) {
  const skillName = path.basename(skillPath);
  const relativePath = path.join('skills', category, skillName);

  const skillResult = {
    name: skillName,
    path: relativePath,
    errors: [],
    warnings: []
  };

  // 1. 检查 skill.json 是否存在
  const jsonPath = path.join(skillPath, 'skill.json');
  if (!fs.existsSync(jsonPath)) {
    skillResult.errors.push('缺少 skill.json 文件');
    return skillResult;
  }

  // 2. 解析 skill.json
  let skillJson;
  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    skillJson = JSON.parse(stripJsonComments(content));
  } catch (error) {
    skillResult.errors.push(`skill.json 解析失败: ${error.message}`);
    return skillResult;
  }

  // 3. 验证必需字段
  const requiredFields = ['name', 'description', 'version'];
  for (const field of requiredFields) {
    if (!skillJson[field]) {
      skillResult.errors.push(`缺少必需字段: ${field}`);
    }
  }

  // 4. 验证 name 与目录名一致
  if (skillJson.name && skillJson.name !== skillName) {
    skillResult.errors.push(`name "${skillJson.name}" 与目录名 "${skillName}" 不一致`);
  }

  // 5. 验证 version 格式
  if (skillJson.version && !/^\d+\.\d+\.\d+/.test(skillJson.version)) {
    skillResult.warnings.push('version 未遵循语义化版本格式 (x.y.z)');
  }

  // 6. 检查 SKILL.md 是否存在
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    skillResult.errors.push('缺少 SKILL.md 文件');
  } else {
    // 检查 SKILL.md 是否为空
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    if (!content.trim()) {
      skillResult.errors.push('SKILL.md 文件为空');
    }
  }

  // 7. 检查 description.md（推荐但非必需）
  const descMdPath = path.join(skillPath, 'description.md');
  if (!fs.existsSync(descMdPath)) {
    skillResult.warnings.push('缺少 description.md 使用说明文档（推荐）');
  }

  // 8. 验证 parameters 格式
  if (skillJson.parameters) {
    if (skillJson.parameters.type !== 'object') {
      skillResult.errors.push('parameters.type 必须为 "object"');
    }
    if (skillJson.parameters.properties && typeof skillJson.parameters.properties !== 'object') {
      skillResult.errors.push('parameters.properties 必须为对象');
    }
  }

  return skillResult;
}

/**
 * 扫描并验证所有技能
 */
function scanAndValidate() {
  const categories = ['builtin', 'community', 'templates'];

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
      const result = validateSkill(skillPath, category);

      if (result.errors.length === 0) {
        results.passed.push(result);
      } else {
        results.failed.push(result);
      }

      if (result.warnings.length > 0) {
        results.warnings.push(result);
      }
    }
  }
}

/**
 * 输出验证结果
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('  Skills 配置验证');
  console.log('='.repeat(60) + '\n');

  // 通过的技能
  if (results.passed.length > 0) {
    console.log('✅ 通过验证 (' + results.passed.length + ')');
    for (const skill of results.passed) {
      console.log(`  /${skill.name} (${skill.path})`);
    }
    console.log();
  }

  // 失败的技能
  if (results.failed.length > 0) {
    console.log('❌ 验证失败 (' + results.failed.length + ')');
    for (const skill of results.failed) {
      console.log(`  /${skill.name} (${skill.path})`);
      for (const error of skill.errors) {
        console.log(`    ✗ ${error}`);
      }
    }
    console.log();
  }

  // 警告
  if (results.warnings.length > 0) {
    console.log('⚠️  警告 (' + results.warnings.length + ')');
    for (const skill of results.warnings) {
      if (skill.warnings.length > 0) {
        console.log(`  /${skill.name} (${skill.path})`);
        for (const warning of skill.warnings) {
          console.log(`    ⚠ ${warning}`);
        }
      }
    }
    console.log();
  }

  console.log('='.repeat(60));

  const total = results.passed.length + results.failed.length;
  console.log(`  总计: ${total} 个技能 | 通过: ${results.passed.length} | 失败: ${results.failed.length}`);

  if (results.warnings.length > 0) {
    console.log(`  警告: ${results.warnings.length} 个技能有警告`);
  }

  console.log('='.repeat(60) + '\n');

  // 返回退出码
  return results.failed.length > 0 ? 1 : 0;
}

// 主函数
function main() {
  scanAndValidate();
  const exitCode = printResults();
  process.exit(exitCode);
}

main();
