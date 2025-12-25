#!/usr/bin/env node

/**
 * 脚本：生成超长且复杂的测试对话 SQL
 * 生成 200+ 条消息，并带有多条决策路径
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置 ---
const CHAR_ID = 'complex-test-girl';
const CONV_ID = 'conv-complex-' + Date.now();
const START_TIME = Date.now() - 3600000 * 2; // 2小时前开始

const sqlStatements = [];
sqlStatements.push(`-- Test Data for Conversation Review`);
sqlStatements.push(`PRAGMA foreign_keys = ON;`);

// 1. 创建测试角色
sqlStatements.push(`INSERT OR IGNORE INTO characters (id, name, nickname, relationship_label, avatar_color, affinity, created_at, updated_at)
VALUES ('${CHAR_ID}', '林舒涵', '舒涵', '青梅竹马', '#ff85c0', 65, ${Date.now()}, ${Date.now()});`);

// 2. 创建会话
sqlStatements.push(`INSERT INTO conversations (id, character_id, title, date, created_at, updated_at)
VALUES ('${CONV_ID}', '${CHAR_ID}', '关于未来的深夜长谈', ${START_TIME}, ${Date.now()}, ${Date.now()});`);

// 3. 生成 200+ 条消息
const messages = [];
let currentTs = START_TIME;

const addMsg = (sender, content) => {
    currentTs += Math.floor(Math.random() * 15000) + 5000;
    const id = `msg-${CONV_ID}-${messages.length}`;
    const escContent = content.replace(/'/g, "''");
    sqlStatements.push(`INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('${id}', '${CONV_ID}', '${sender}', '${escContent}', ${currentTs}, ${sender === 'user' ? 0 : 1});`);
    messages.push({ id });
    return id;
};

// --- 第一阶段：轻松闲聊 (0-40) ---
addMsg('character', '在忙吗？');
addMsg('user', '刚忙完，正打算刷会儿手机，怎么啦？');
addMsg('character', '没什么，今天去吃了你说的那家甜品店，草莓大福真的超好吃！');
addMsg('user', '哈哈我就说吧，那家店是老字号了。');
for (let i = 0; i < 36; i++) {
    const contents = [
        ['character', '明天天气好像不太好呢。'],
        ['user', '是吗？我看预报说是多云。'],
        ['character', '但我刚才看又有雷阵雨预警了。'],
        ['user', '那出门得记得带伞。'],
        ['character', '嗯我知道啦。']
    ];
    addMsg(...contents[i % contents.length]);
}

// --- 第二阶段：怀旧回忆 (41-80) ---
addMsg('character', '对了，你还记得咱们大二那年去洱海骑行吗？');
addMsg('user', '当然记得，那天我晒得跟黑炭一样。');
addMsg('character', '你还好意思说，我那天可是提醒过你要涂防晒的。');
for (let i = 2; i < 38; i++) {
    const contents = [
        ['character', '那时候咱们真是有精力，骑了大半个洱海。'],
        ['user', '现在的我估计骑五公里就要求饶了。'],
        ['character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。'],
        ['user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。']
    ];
    const item = contents[i % contents.length];
    addMsg(item[0], item[1] + ` (${i})`);
}

// 插入决策点 1
const dp1Anchor = addMsg('character', '如果我们现在还能一起再去一次，你觉得会和以前感觉一样吗？');
const dp1Id = `dp-${CONV_ID}-1`;
const batch1Id = `batch-${CONV_ID}-1`;
sqlStatements.push(`INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('${dp1Id}', '${CONV_ID}', '${dp1Anchor}', ${currentTs + 100});`);
sqlStatements.push(`INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('${batch1Id}', '${dp1Id}', 'manual', 'user_silence', ${currentTs + 200});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-1A', '${CONV_ID}', '${dp1Id}', '${batch1Id}', 0, '怀旧浪漫', '肯定不一样啊，毕竟现在的我，比那时候更珍惜和你在一起的时间了。', 5, ${currentTs + 300});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-1B', '${CONV_ID}', '${dp1Id}', '${batch1Id}', 1, '幽默回应', '感觉肯定不一样，这次我得租个电动车，坚决不脚踩了！', 2, ${currentTs + 300});`);

addMsg('user', '肯定不一样啊，毕竟现在的我，比那时候更珍惜和你在一起的时间了。');

// --- 第三阶段：深沉话题 (81-120) ---
addMsg('character', '突然这么感性，我都不知道该怎么接了……');
addMsg('character', '不过说真的，最近我一直在想，现在的这份工作真的适合我吗？');
for (let i = 0; i < 38; i++) {
    const contents = [
        ['user', '怎么突然想这个了？压力太大了吗？'],
        ['character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。'],
        ['user', '职场倦怠其实挺普遍的。'],
        ['character', '但我怕自己一直在这个舒适圈呆下去会废掉。']
    ];
    const item = contents[i % contents.length];
    addMsg(item[0], item[1] + ` (${i})`);
}

// 插入决策点 2
const dp2Anchor = addMsg('character', '你说，我是不是该鼓起勇气去试试那个新项目的机会？');
const dp2Id = `dp-${CONV_ID}-2`;
const batch2Id = `batch-${CONV_ID}-2`;
sqlStatements.push(`INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('${dp2Id}', '${CONV_ID}', '${dp2Anchor}', ${currentTs + 100});`);
sqlStatements.push(`INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('${batch2Id}', '${dp2Id}', 'passive', 'topic_switch', ${currentTs + 200});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-2A', '${CONV_ID}', '${dp2Id}', '${batch2Id}', 0, '理性支持', '如果那个项目对你的长期规划有帮助，确实值得一试。', 3, ${currentTs + 300});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-2B', '${CONV_ID}', '${dp2Id}', '${batch2Id}', 1, '共情鼓励', '无论你做什么决定，我都会支持你的。想试就去试吧，别让自己遗憾。', 6, ${currentTs + 300});`);

addMsg('user', '我觉得现在的生活节奏也挺好的，没必要把自己搞得那么累吧？');

// --- 第四阶段：观点冲突 (121-160) ---
addMsg('character', '可是我想变得更好啊，你是在质疑我的上进心吗？');
addMsg('user', '我不是那个意思，只是觉得健康和心情更重要。');
for (let i = 0; i < 38; i++) {
    const contents = [
        ['character', '但你总是试图在我想拼一把的时候泼冷水。'],
        ['user', '我只是不想看你每天只睡五小时。'],
        ['character', '那是我的选择，我觉得值得。'],
        ['user', '好吧，既然你这么坚持，我也没什么好说的了。']
    ];
    const item = contents[i % contents.length];
    addMsg(item[0], item[1] + ` (${i})`);
}

const dp3Anchor = addMsg('character', '算了，感觉咱们讨论这个话题只会吵架，早点睡吧。');
const dp3Id = `dp-${CONV_ID}-3`;
const batch3Id = `batch-${CONV_ID}-3`;
sqlStatements.push(`INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('${dp3Id}', '${CONV_ID}', '${dp3Anchor}', ${currentTs + 100});`);
sqlStatements.push(`INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('${batch3Id}', '${dp3Id}', 'manual', 'conflict_detected', ${currentTs + 200});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-3A', '${CONV_ID}', '${dp3Id}', '${batch3Id}', 0, '道歉服软', '对不起，我刚才说话语气可能重了点，其实我是担心你。', 8, ${currentTs + 300});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-3B', '${CONV_ID}', '${dp3Id}', '${batch3Id}', 1, '冷静结束', '行吧，那确实都累了，早点休息。', -2, ${currentTs + 300});`);

addMsg('user', '对不起舒涵，我刚才说话语气太生硬了，其实我只是看你最近压力大，很心疼你。');

// --- 第五阶段：和解 (161-200) ---
addMsg('character', '……我也知道你是关心我，刚才我也有点激动了。');
for (let i = 0; i < 38; i++) {
    const contents = [
        ['user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。'],
        ['character', '真的吗？我总觉得自己做不到最好。'],
        ['user', '那是你对自己要求太高了。'],
        ['character', '听到你这么说，我感觉心情好多了。']
    ];
    const item = contents[i % contents.length];
    addMsg(item[0], item[1] + ` (${i})`);
}

const dp4Anchor = addMsg('character', '下个周末你有空吗？我请你吃饭，就当是赔罪啦。');
const dp4Id = `dp-${CONV_ID}-4`;
const batch4Id = `batch-${CONV_ID}-4`;
sqlStatements.push(`INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('${dp4Id}', '${CONV_ID}', '${dp4Anchor}', ${currentTs + 100});`);
sqlStatements.push(`INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('${batch4Id}', '${dp4Id}', 'passive', 'positive_vibe', ${currentTs + 200});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-4A', '${CONV_ID}', '${dp4Id}', '${batch4Id}', 0, '欣然接受', '好啊，那我也要吃草莓大福！', 4, ${currentTs + 300});`);
sqlStatements.push(`INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-${CONV_ID}-4B', '${CONV_ID}', '${dp4Id}', '${batch4Id}', 1, '调皮调侃', '赔罪可不够，得三顿起步。', 3, ${currentTs + 300});`);

addMsg('user', '好啊，那我也要吃草莓大福！');

addMsg('character', '没问题！管够！');
for (let i = 0; i < 20; i++) {
    const contents = [
        ['user', '那早点睡吧，都快一点了。'],
        ['character', '嗯确实不早了，晚安。'],
        ['user', '晚安，好梦。'],
        ['character', '你也是，梦里见~']
    ];
    const item = contents[i % contents.length];
    addMsg(item[0], item[1] + ` (${i})`);
}

const outputPath = path.join(__dirname, 'complex-test-data.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'));
console.log(`SQL file generated at: ${outputPath}`);
console.log(`Conversation ID: ${CONV_ID}`);
