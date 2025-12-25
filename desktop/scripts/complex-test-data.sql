-- Test Data for Conversation Review
PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO characters (id, name, nickname, relationship_label, avatar_color, affinity, created_at, updated_at)
VALUES ('complex-test-girl', '林舒涵', '舒涵', '青梅竹马', '#ff85c0', 65, 1766477258405, 1766477258405);
INSERT INTO conversations (id, character_id, title, date, created_at, updated_at)
VALUES ('conv-complex-1766477258405', 'complex-test-girl', '关于未来的深夜长谈', 1766470058405, 1766477258405, 1766477258405);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-0', 'conv-complex-1766477258405', 'character', '在忙吗？', 1766470069551, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-1', 'conv-complex-1766477258405', 'user', '刚忙完，正打算刷会儿手机，怎么啦？', 1766470079354, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-2', 'conv-complex-1766477258405', 'character', '没什么，今天去吃了你说的那家甜品店，草莓大福真的超好吃！', 1766470087618, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-3', 'conv-complex-1766477258405', 'user', '哈哈我就说吧，那家店是老字号了。', 1766470100248, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-4', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470110971, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-5', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470116106, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-6', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470127422, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-7', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470146835, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-8', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470158588, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-9', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470170284, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-10', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470189391, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-11', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470202595, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-12', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470215800, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-13', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470230435, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-14', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470240390, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-15', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470252201, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-16', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470263707, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-17', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470281846, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-18', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470294496, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-19', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470312833, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-20', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470318700, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-21', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470334323, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-22', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470349788, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-23', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470365875, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-24', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470385172, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-25', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470400246, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-26', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470410964, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-27', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470423597, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-28', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470435533, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-29', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470445801, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-30', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470465068, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-31', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470480671, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-32', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470487624, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-33', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470503260, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-34', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470514240, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-35', 'conv-complex-1766477258405', 'user', '是吗？我看预报说是多云。', 1766470528207, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-36', 'conv-complex-1766477258405', 'character', '但我刚才看又有雷阵雨预警了。', 1766470537001, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-37', 'conv-complex-1766477258405', 'user', '那出门得记得带伞。', 1766470546307, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-38', 'conv-complex-1766477258405', 'character', '嗯我知道啦。', 1766470558467, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-39', 'conv-complex-1766477258405', 'character', '明天天气好像不太好呢。', 1766470572307, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-40', 'conv-complex-1766477258405', 'character', '对了，你还记得咱们大二那年去洱海骑行吗？', 1766470581201, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-41', 'conv-complex-1766477258405', 'user', '当然记得，那天我晒得跟黑炭一样。', 1766470601050, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-42', 'conv-complex-1766477258405', 'character', '你还好意思说，我那天可是提醒过你要涂防晒的。', 1766470610118, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-43', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (2)', 1766470623017, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-44', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (3)', 1766470636319, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-45', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (4)', 1766470647783, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-46', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (5)', 1766470657886, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-47', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (6)', 1766470668037, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-48', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (7)', 1766470683980, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-49', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (8)', 1766470691379, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-50', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (9)', 1766470699533, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-51', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (10)', 1766470709264, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-52', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (11)', 1766470725094, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-53', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (12)', 1766470737026, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-54', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (13)', 1766470748614, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-55', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (14)', 1766470758427, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-56', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (15)', 1766470771100, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-57', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (16)', 1766470779544, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-58', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (17)', 1766470787440, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-59', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (18)', 1766470794224, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-60', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (19)', 1766470799720, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-61', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (20)', 1766470806923, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-62', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (21)', 1766470826541, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-63', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (22)', 1766470844048, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-64', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (23)', 1766470860210, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-65', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (24)', 1766470867690, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-66', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (25)', 1766470883445, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-67', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (26)', 1766470894587, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-68', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (27)', 1766470911137, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-69', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (28)', 1766470917883, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-70', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (29)', 1766470932091, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-71', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (30)', 1766470937769, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-72', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (31)', 1766470946881, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-73', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (32)', 1766470954175, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-74', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (33)', 1766470964994, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-75', 'conv-complex-1766477258405', 'character', '其实我偶尔还会翻出那时候的照片看，大家都好青涩。 (34)', 1766470978215, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-76', 'conv-complex-1766477258405', 'user', '那时候还没这么多烦心事，每天就想着晚上去哪儿吃。 (35)', 1766470984326, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-77', 'conv-complex-1766477258405', 'character', '那时候咱们真是有精力，骑了大半个洱海。 (36)', 1766470996571, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-78', 'conv-complex-1766477258405', 'user', '现在的我估计骑五公里就要求饶了。 (37)', 1766471013888, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-79', 'conv-complex-1766477258405', 'character', '如果我们现在还能一起再去一次，你觉得会和以前感觉一样吗？', 1766471030671, 1);
INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('dp-conv-complex-1766477258405-1', 'conv-complex-1766477258405', 'msg-conv-complex-1766477258405-79', 1766471030771);
INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('batch-conv-complex-1766477258405-1', 'dp-conv-complex-1766477258405-1', 'manual', 'user_silence', 1766471030871);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-1A', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-1', 'batch-conv-complex-1766477258405-1', 0, '怀旧浪漫', '肯定不一样啊，毕竟现在的我，比那时候更珍惜和你在一起的时间了。', 5, 1766471030971);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-1B', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-1', 'batch-conv-complex-1766477258405-1', 1, '幽默回应', '感觉肯定不一样，这次我得租个电动车，坚决不脚踩了！', 2, 1766471030971);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-80', 'conv-complex-1766477258405', 'user', '肯定不一样啊，毕竟现在的我，比那时候更珍惜和你在一起的时间了。', 1766471047842, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-81', 'conv-complex-1766477258405', 'character', '突然这么感性，我都不知道该怎么接了……', 1766471052925, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-82', 'conv-complex-1766477258405', 'character', '不过说真的，最近我一直在想，现在的这份工作真的适合我吗？', 1766471060510, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-83', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (0)', 1766471071918, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-84', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (1)', 1766471088308, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-85', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (2)', 1766471099893, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-86', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (3)', 1766471105204, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-87', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (4)', 1766471110419, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-88', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (5)', 1766471123180, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-89', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (6)', 1766471128494, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-90', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (7)', 1766471140924, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-91', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (8)', 1766471160206, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-92', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (9)', 1766471172316, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-93', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (10)', 1766471189979, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-94', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (11)', 1766471195926, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-95', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (12)', 1766471206216, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-96', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (13)', 1766471222526, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-97', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (14)', 1766471232987, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-98', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (15)', 1766471247143, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-99', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (16)', 1766471254982, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-100', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (17)', 1766471273983, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-101', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (18)', 1766471281822, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-102', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (19)', 1766471287397, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-103', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (20)', 1766471298375, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-104', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (21)', 1766471305089, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-105', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (22)', 1766471310220, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-106', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (23)', 1766471316998, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-107', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (24)', 1766471333520, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-108', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (25)', 1766471343492, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-109', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (26)', 1766471359762, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-110', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (27)', 1766471365112, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-111', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (28)', 1766471382602, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-112', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (29)', 1766471399484, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-113', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (30)', 1766471419061, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-114', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (31)', 1766471428288, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-115', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (32)', 1766471437642, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-116', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (33)', 1766471452998, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-117', 'conv-complex-1766477258405', 'user', '职场倦怠其实挺普遍的。 (34)', 1766471470941, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-118', 'conv-complex-1766477258405', 'character', '但我怕自己一直在这个舒适圈呆下去会废掉。 (35)', 1766471486310, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-119', 'conv-complex-1766477258405', 'user', '怎么突然想这个了？压力太大了吗？ (36)', 1766471500159, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-120', 'conv-complex-1766477258405', 'character', '倒也不是压力，就是觉得每天都在重复，找不到成就感。 (37)', 1766471509379, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-121', 'conv-complex-1766477258405', 'character', '你说，我是不是该鼓起勇气去试试那个新项目的机会？', 1766471522987, 1);
INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('dp-conv-complex-1766477258405-2', 'conv-complex-1766477258405', 'msg-conv-complex-1766477258405-121', 1766471523087);
INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('batch-conv-complex-1766477258405-2', 'dp-conv-complex-1766477258405-2', 'passive', 'topic_switch', 1766471523187);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-2A', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-2', 'batch-conv-complex-1766477258405-2', 0, '理性支持', '如果那个项目对你的长期规划有帮助，确实值得一试。', 3, 1766471523287);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-2B', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-2', 'batch-conv-complex-1766477258405-2', 1, '共情鼓励', '无论你做什么决定，我都会支持你的。想试就去试吧，别让自己遗憾。', 6, 1766471523287);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-122', 'conv-complex-1766477258405', 'user', '我觉得现在的生活节奏也挺好的，没必要把自己搞得那么累吧？', 1766471529812, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-123', 'conv-complex-1766477258405', 'character', '可是我想变得更好啊，你是在质疑我的上进心吗？', 1766471541187, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-124', 'conv-complex-1766477258405', 'user', '我不是那个意思，只是觉得健康和心情更重要。', 1766471548785, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-125', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (0)', 1766471556505, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-126', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (1)', 1766471572911, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-127', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (2)', 1766471585002, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-128', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (3)', 1766471590133, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-129', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (4)', 1766471610101, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-130', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (5)', 1766471623711, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-131', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (6)', 1766471631755, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-132', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (7)', 1766471642597, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-133', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (8)', 1766471648067, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-134', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (9)', 1766471667883, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-135', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (10)', 1766471675948, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-136', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (11)', 1766471690592, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-137', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (12)', 1766471698144, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-138', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (13)', 1766471703644, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-139', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (14)', 1766471716504, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-140', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (15)', 1766471733107, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-141', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (16)', 1766471746390, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-142', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (17)', 1766471761929, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-143', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (18)', 1766471771757, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-144', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (19)', 1766471785213, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-145', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (20)', 1766471800641, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-146', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (21)', 1766471819558, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-147', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (22)', 1766471828945, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-148', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (23)', 1766471845053, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-149', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (24)', 1766471861115, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-150', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (25)', 1766471877540, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-151', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (26)', 1766471889214, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-152', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (27)', 1766471905421, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-153', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (28)', 1766471917655, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-154', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (29)', 1766471927744, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-155', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (30)', 1766471933961, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-156', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (31)', 1766471942686, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-157', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (32)', 1766471952431, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-158', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (33)', 1766471970163, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-159', 'conv-complex-1766477258405', 'character', '那是我的选择，我觉得值得。 (34)', 1766471976164, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-160', 'conv-complex-1766477258405', 'user', '好吧，既然你这么坚持，我也没什么好说的了。 (35)', 1766471989710, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-161', 'conv-complex-1766477258405', 'character', '但你总是试图在我想拼一把的时候泼冷水。 (36)', 1766472005913, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-162', 'conv-complex-1766477258405', 'user', '我只是不想看你每天只睡五小时。 (37)', 1766472017002, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-163', 'conv-complex-1766477258405', 'character', '算了，感觉咱们讨论这个话题只会吵架，早点睡吧。', 1766472032313, 1);
INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('dp-conv-complex-1766477258405-3', 'conv-complex-1766477258405', 'msg-conv-complex-1766477258405-163', 1766472032413);
INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('batch-conv-complex-1766477258405-3', 'dp-conv-complex-1766477258405-3', 'manual', 'conflict_detected', 1766472032513);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-3A', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-3', 'batch-conv-complex-1766477258405-3', 0, '道歉服软', '对不起，我刚才说话语气可能重了点，其实我是担心你。', 8, 1766472032613);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-3B', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-3', 'batch-conv-complex-1766477258405-3', 1, '冷静结束', '行吧，那确实都累了，早点休息。', -2, 1766472032613);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-164', 'conv-complex-1766477258405', 'user', '对不起舒涵，我刚才说话语气太生硬了，其实我只是看你最近压力大，很心疼你。', 1766472048221, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-165', 'conv-complex-1766477258405', 'character', '……我也知道你是关心我，刚才我也有点激动了。', 1766472056574, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-166', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (0)', 1766472071281, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-167', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (1)', 1766472079442, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-168', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (2)', 1766472093608, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-169', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (3)', 1766472111001, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-170', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (4)', 1766472118861, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-171', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (5)', 1766472136213, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-172', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (6)', 1766472151820, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-173', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (7)', 1766472167899, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-174', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (8)', 1766472177011, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-175', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (9)', 1766472185130, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-176', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (10)', 1766472203950, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-177', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (11)', 1766472211429, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-178', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (12)', 1766472225240, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-179', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (13)', 1766472242869, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-180', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (14)', 1766472251234, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-181', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (15)', 1766472256269, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-182', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (16)', 1766472263989, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-183', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (17)', 1766472282936, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-184', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (18)', 1766472290154, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-185', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (19)', 1766472302297, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-186', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (20)', 1766472321102, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-187', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (21)', 1766472339535, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-188', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (22)', 1766472352147, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-189', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (23)', 1766472357369, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-190', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (24)', 1766472376137, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-191', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (25)', 1766472393710, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-192', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (26)', 1766472408837, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-193', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (27)', 1766472425447, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-194', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (28)', 1766472434002, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-195', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (29)', 1766472449521, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-196', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (30)', 1766472467377, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-197', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (31)', 1766472485104, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-198', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (32)', 1766472490499, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-199', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (33)', 1766472496421, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-200', 'conv-complex-1766477258405', 'user', '那是你对自己要求太高了。 (34)', 1766472508635, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-201', 'conv-complex-1766477258405', 'character', '听到你这么说，我感觉心情好多了。 (35)', 1766472523463, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-202', 'conv-complex-1766477258405', 'user', '抱歉哈，其实你的上进心一直是我最佩服你的地方。 (36)', 1766472531027, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-203', 'conv-complex-1766477258405', 'character', '真的吗？我总觉得自己做不到最好。 (37)', 1766472547703, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-204', 'conv-complex-1766477258405', 'character', '下个周末你有空吗？我请你吃饭，就当是赔罪啦。', 1766472558914, 1);
INSERT INTO decision_points (id, conversation_id, anchor_message_id, created_at) VALUES ('dp-conv-complex-1766477258405-4', 'conv-complex-1766477258405', 'msg-conv-complex-1766477258405-204', 1766472559014);
INSERT INTO suggestion_batches (id, decision_point_id, trigger, reason, created_at) VALUES ('batch-conv-complex-1766477258405-4', 'dp-conv-complex-1766477258405-4', 'passive', 'positive_vibe', 1766472559114);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-4A', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-4', 'batch-conv-complex-1766477258405-4', 0, '欣然接受', '好啊，那我也要吃草莓大福！', 4, 1766472559214);
INSERT INTO ai_suggestions (id, conversation_id, decision_point_id, batch_id, suggestion_index, title, content, affinity_prediction, created_at) VALUES ('sugg-conv-complex-1766477258405-4B', 'conv-complex-1766477258405', 'dp-conv-complex-1766477258405-4', 'batch-conv-complex-1766477258405-4', 1, '调皮调侃', '赔罪可不够，得三顿起步。', 3, 1766472559214);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-205', 'conv-complex-1766477258405', 'user', '好啊，那我也要吃草莓大福！', 1766472565861, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-206', 'conv-complex-1766477258405', 'character', '没问题！管够！', 1766472579650, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-207', 'conv-complex-1766477258405', 'user', '那早点睡吧，都快一点了。 (0)', 1766472588080, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-208', 'conv-complex-1766477258405', 'character', '嗯确实不早了，晚安。 (1)', 1766472597590, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-209', 'conv-complex-1766477258405', 'user', '晚安，好梦。 (2)', 1766472603011, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-210', 'conv-complex-1766477258405', 'character', '你也是，梦里见~ (3)', 1766472614793, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-211', 'conv-complex-1766477258405', 'user', '那早点睡吧，都快一点了。 (4)', 1766472632618, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-212', 'conv-complex-1766477258405', 'character', '嗯确实不早了，晚安。 (5)', 1766472650071, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-213', 'conv-complex-1766477258405', 'user', '晚安，好梦。 (6)', 1766472669561, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-214', 'conv-complex-1766477258405', 'character', '你也是，梦里见~ (7)', 1766472681988, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-215', 'conv-complex-1766477258405', 'user', '那早点睡吧，都快一点了。 (8)', 1766472689037, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-216', 'conv-complex-1766477258405', 'character', '嗯确实不早了，晚安。 (9)', 1766472704592, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-217', 'conv-complex-1766477258405', 'user', '晚安，好梦。 (10)', 1766472710167, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-218', 'conv-complex-1766477258405', 'character', '你也是，梦里见~ (11)', 1766472726040, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-219', 'conv-complex-1766477258405', 'user', '那早点睡吧，都快一点了。 (12)', 1766472745717, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-220', 'conv-complex-1766477258405', 'character', '嗯确实不早了，晚安。 (13)', 1766472760136, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-221', 'conv-complex-1766477258405', 'user', '晚安，好梦。 (14)', 1766472770771, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-222', 'conv-complex-1766477258405', 'character', '你也是，梦里见~ (15)', 1766472788424, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-223', 'conv-complex-1766477258405', 'user', '那早点睡吧，都快一点了。 (16)', 1766472800216, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-224', 'conv-complex-1766477258405', 'character', '嗯确实不早了，晚安。 (17)', 1766472811127, 1);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-225', 'conv-complex-1766477258405', 'user', '晚安，好梦。 (18)', 1766472819470, 0);
INSERT INTO messages (id, conversation_id, sender, content, timestamp, is_ai_generated)
VALUES ('msg-conv-complex-1766477258405-226', 'conv-complex-1766477258405', 'character', '你也是，梦里见~ (19)', 1766472838877, 1);