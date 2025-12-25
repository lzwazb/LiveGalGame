#!/usr/bin/env node

/**
 * 脚本：插入测试复盘数据到数据库
 * 用于测试决策树展示效果
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库路径（与主应用一致）
const dbPath = path.join(
  process.env.HOME || process.env.USERPROFILE,
  'Library/Application Support/livegalgame-desktop/livegalgame.db'
);

console.log('数据库路径:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('错误: 数据库文件不存在:', dbPath);
  console.error('请先启动应用以创建数据库');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('连接数据库成功');

// 读取 seed.sql 中的测试数据部分
const seedPath = path.join(__dirname, '../src/db/seed.sql');
const seedSQL = fs.readFileSync(seedPath, 'utf-8');

// 提取测试数据部分（从 "=== 复盘功能测试对话 ===" 开始）
const testDataStart = seedSQL.indexOf('-- === 复盘功能测试对话 ===');
if (testDataStart === -1) {
  console.error('错误: 在 seed.sql 中未找到测试数据');
  process.exit(1);
}

const testDataSQL = seedSQL.substring(testDataStart);

// 分割 SQL 语句
const statements = testDataSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => {
    // 移除注释行
    const lines = stmt.split('\n');
    const cleanedLines = lines
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .filter(line => line.length > 0);
    
    return cleanedLines.join(' ').length > 0;
  })
  .map(stmt => {
    // 移除行内注释
    const lines = stmt.split('\n');
    return lines
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .filter(line => line.length > 0)
      .join(' ');
  })
  .filter(stmt => stmt.length > 0);

console.log(`找到 ${statements.length} 条 SQL 语句`);

// 执行插入
const transaction = db.transaction(() => {
  let successCount = 0;
  let skipCount = 0;
  
  for (const statement of statements) {
    try {
      const result = db.exec(statement);
      successCount++;
      console.log(`✓ 执行成功: ${statement.substring(0, 50)}...`);
    } catch (err) {
      // INSERT OR IGNORE 如果数据已存在会报错，这是正常的
      if (err.message.includes('UNIQUE constraint') || err.message.includes('already exists')) {
        skipCount++;
        console.log(`⊘ 跳过（已存在）: ${statement.substring(0, 50)}...`);
      } else {
        console.error(`✗ 执行失败:`, err.message);
        console.error(`   SQL: ${statement.substring(0, 100)}...`);
      }
    }
  }
  
  console.log(`\n完成:`);
  console.log(`  成功插入: ${successCount} 条`);
  console.log(`  跳过（已存在）: ${skipCount} 条`);
});

transaction();

db.close();
console.log('\n数据库连接已关闭');

