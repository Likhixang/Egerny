const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/AppleIntelligence-Qwen.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math });
vm.runInContext(
  source.replace('export default async function (ctx)', 'async function main(ctx)') +
    `\nglobalThis.api = { main, readConfig, buildEndpoint, parseRequestPath, extractInput, extractUserText, buildUserContent, pickAnnotations, buildTextSSE, makeSummary, pickAnswer, unwrapAnswer, chunkString, looksLikeImageRequest, isComposeRequest, parseComposeInput, composeUserMessage, parseComposeResult, buildComposeValue };`,
  context,
);
const api = context.api;
const plain = value => JSON.parse(JSON.stringify(value));

// 抓包里真实观察到的事件序列（新会话会多一个 session.created）
const TEXT_CAPTURED = [
  'session.response.created',
  'session.response.choices[].added',
  'session.response.choices[].items[].added',
  'session.response.choices[].items[].message.content[].added',
  'session.response.choices[].items[].message.content[].text.value.delta',
  'session.response.choices[].items[].message.content[].text.value.done',
  'session.response.choices[].items[].message.content[].done',
  'session.response.choices[].items[].done',
  'session.response.choices[].completed',
  'session.response.choices[].done',
  'session.response.done',
];

function parseSSE(text) {
  const events = [];
  for (const block of text.split('\n\n')) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const m = /^event: (.+)\ndata: ([\s\S]+)$/.exec(trimmed);
    assert.ok(m, 'SSE 块格式错误: ' + trimmed.slice(0, 120));
    const name = m[1];
    const data = JSON.parse(m[2]);
    assert.ok(name in data, 'data 缺少同名 key: ' + name);
    assert.equal(data.type, name, 'type 与事件名不一致: ' + name);
    events.push({ name, payload: data[name] });
  }
  return events;
}

function collapse(names) {
  const out = [];
  for (const n of names) if (out[out.length - 1] !== n) out.push(n);
  return out;
}

function ok(json) {
  return { status: 200, text: async () => JSON.stringify(json) };
}

function err(status, body) {
  return { status, text: async () => JSON.stringify(body) };
}

function chatText(content) {
  return ok({ choices: [{ message: { role: 'assistant', content } }] });
}

function makeCtx({ url, body, env, route, storage = new Map() }) {
  const calls = [];
  return {
    env: env || {},
    calls,
    request: {
      url,
      method: 'POST',
      headers: {},
      json: async () => body,
      text: async () => JSON.stringify(body),
    },
    http: {
      post: async (target, options) => {
        calls.push({ target, options });
        return route(target, options, calls.length);
      },
    },
    storage: {
      getJSON: key => (storage.has(key) ? structuredClone(storage.get(key)) : null),
      setJSON: (key, value) => storage.set(key, structuredClone(value)),
      get: key => (storage.has(key) ? storage.get(key) : null),
      set: (key, value) => storage.set(key, value),
      delete: key => storage.delete(key),
    },
    notify: () => {},
    respond: payload => ({ __responded: payload }),
  };
}

const PROVIDER_BASE = 'https://unit.invalid/v1';
const PROVIDER_URL = PROVIDER_BASE + '/chat/completions';
const ENV = {
  PROVIDER_URL: PROVIDER_BASE,
  API_KEY: 'sk-test',
  MODEL: 'test-model',
};
// 画图请求：只用于验证「放行给千问」的判定
const DRAW_BODY = {
  input: [{ message: { role: 'user', content: [{ text: '问千问，画只狸花猫', type: 'text' }] }, type: 'message' }],
  stream: true,
};
const NEW_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/responses';
const CONT_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/sess_616a864d-6c8b-4d94-914b-262f04a9c3d9/responses';
const BODY = {
  input: [{ message: { role: 'user', content: [{ text: '问千问，你是什么模型', type: 'text' }] }, type: 'message' }],
  stream: true,
  input_hint: 'knowledge',
};
// 视觉智能：只有图片，没有文字；configuration 里是 siri.visualIntelligenceCamera
const IMG_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ==';
const VISION_BODY = {
  configuration: {
    query: { locale: 'zh_CN', os_major_version: 27, os_minor_version: 3, platform: 'iOS' },
    response_configuration_group_id: 'siri.visualIntelligenceCamera',
  },
  input: [{ type: 'message', message: { role: 'user', content: [{ type: 'image_url', image_url: { url: IMG_URL } }] } }],
  server_tools: [{ type: 'image_generator' }, { type: 'file_generator' }],
  stream: true,
};

test('路径解析：新会话 / 续轮 / 非目标', () => {
  assert.deepEqual(plain(api.parseRequestPath(NEW_URL)), { sessionId: null, isNew: true });
  assert.deepEqual(plain(api.parseRequestPath(CONT_URL)), { sessionId: 'sess_616a864d-6c8b-4d94-914b-262f04a9c3d9', isNew: false });
  assert.equal(api.parseRequestPath('https://prod-yabuli.qianwen.com/v1/sessions/responses/extra'), null);
  assert.equal(api.parseRequestPath('https://guzzoni.apple.com/v1/sessions/responses'), null);
  assert.equal(api.parseRequestPath('not a url'), null);
});

test('只取用户文本，忽略其他 role', () => {
  assert.equal(api.extractUserText(BODY), '问千问，你是什么模型');
  assert.equal(api.extractUserText({ input: [{ message: { role: 'assistant', content: [{ text: 'x', type: 'text' }] } }] }), '');
  assert.equal(api.extractUserText({}), '');
  assert.equal(api.extractUserText(null), '');
});

test('文本 SSE 事件序列与抓包一致', () => {
  const names = parseSSE(api.buildTextSSE('sess_unit', '我是千问', { isNew: true })).map(e => e.name);
  assert.equal(names[0], 'session.created');
  assert.deepEqual(collapse(names.slice(1)), TEXT_CAPTURED);
});

test('文本 SSE：deltas 拼接等于 done.value，内层是合法 JSON', () => {
  const answer = '杭州是浙江省省会，西湖就在城西。';
  const events = parseSSE(api.buildTextSSE('sess_unit', answer, { isNew: false }));
  let acc = '';
  let doneValue = null;
  for (const { name, payload } of events) {
    if (name.endsWith('text.value.delta')) acc += payload.delta;
    if (name.endsWith('text.value.done')) doneValue = payload.value;
  }
  assert.equal(acc, doneValue);
  const inner = JSON.parse(doneValue);
  assert.equal(inner.content, answer);
  assert.equal(inner.isRequestingUserInput, false);

  const completed = events.find(e => e.name === 'session.response.choices[].completed');
  assert.equal(completed.payload.choice.status, 'completed');
  assert.equal(completed.payload.choice.output[0].message.content[0].text.value, doneValue);
});

test('多轮对话把历史带上，并写入存储', async () => {
  const storage = new Map();
  const first = makeCtx({ url: NEW_URL, body: BODY, env: ENV, storage, route: () => chatText('第一轮回答') });
  await api.main(first);
  const sessionId = [...storage.keys()][0].replace('AIQ:hist:', '');
  assert.ok(sessionId.startsWith('sess_'));

  const second = makeCtx({
    url: `https://prod-yabuli.qianwen.com/v1/sessions/${sessionId}/responses`,
    body: { input: [{ message: { role: 'user', content: [{ text: '再说一句', type: 'text' }] } }] },
    env: ENV,
    storage,
    route: () => chatText('第二轮回答'),
  });
  await api.main(second);

  const sent = second.calls[0].options.body.messages;
  assert.equal(sent[0].role, 'system');
  assert.equal(sent[1].content, '问千问，你是什么模型');
  assert.equal(sent[2].content, '第一轮回答');
  assert.equal(sent[3].content, '再说一句');
  assert.equal(second.calls[0].options.headers.Authorization, 'Bearer sk-test');
});

test('普通提问不会触发出图', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('我是你的助理') });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), TEXT_CAPTURED);
  assert.equal(ctx.calls.length, 1);
});

test('上游失败也返回合法 SSE，而不是挂起', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: ENV,
    route: () => err(500, { error: { message: 'boom' } }),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), TEXT_CAPTURED);
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.match(JSON.parse(done.value).content, /后端不可用/);
  assert.match(JSON.parse(done.value).content, /boom/);
});

test('未配置时给出可读错误，不抛异常', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: {} });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.match(JSON.parse(done.value).content, /配置错误/);
  assert.match(JSON.parse(done.value).content, /PROVIDER_URL/);
});

test('非目标 URL 透传（返回 undefined）', async () => {
  const ctx = makeCtx({ url: 'https://guzzoni.apple.com/v1/sessions/responses', body: BODY, env: ENV });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('兼容 Responses 风格与包裹式返回', () => {
  assert.equal(api.pickAnswer({ output_text: 'plain' }), 'plain');
  assert.equal(api.pickAnswer({ output: [{ content: [{ text: 'a' }, { text: 'b' }] }] }), 'ab');
  assert.equal(api.pickAnswer({}), '');
  assert.equal(api.unwrapAnswer('{"content":"内层"}'), '内层');
  assert.equal(api.unwrapAnswer('普通文本'), '普通文本');
});

test('画图句式只在明确要图时命中（用于放行判定）', () => {
  for (const t of ['画只狸花猫', '帮我画一张海报', '生成图片：海边日落', 'draw me a cat image']) {
    assert.equal(api.looksLikeImageRequest(t), true, t);
  }
  for (const t of ['今天天气怎么样', '这张图片里是什么', '帮我总结这段话', '']) {
    assert.equal(api.looksLikeImageRequest(t), false, t);
  }
});

test('接口地址只写到 /v1 甚至只写域名都能补全', () => {
  const chat = 'chat/completions';
  assert.equal(api.buildEndpoint('https://api.example.com', chat), 'https://api.example.com/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://api.example.com/', chat), 'https://api.example.com/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://api.example.com/v1', chat), 'https://api.example.com/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://api.example.com/v1/', chat), 'https://api.example.com/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://api.example.com/v1/chat/completions', chat), 'https://api.example.com/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://gw.example.com/openai', chat), 'https://gw.example.com/openai/v1/chat/completions');
  assert.equal(api.buildEndpoint('https://gw.example.com/openai/v1', chat), 'https://gw.example.com/openai/v1/chat/completions');
  assert.equal(api.buildEndpoint('http://192.168.1.10:8080', chat), 'http://192.168.1.10:8080/v1/chat/completions');
  // 带 query 视为完整地址
  assert.equal(api.buildEndpoint('https://x.example.com/v1/chat/completions?api-version=1', chat), 'https://x.example.com/v1/chat/completions?api-version=1');
  // 图像接口走同一套规则
  assert.equal(api.buildEndpoint('https://api.example.com/v1', 'images/generations'), 'https://api.example.com/v1/images/generations');
  assert.equal(api.buildEndpoint('', 'images/generations'), '');
});

test('配置默认值：不再包含出图字段', () => {
  const cfg = api.readConfig(ENV);
  assert.equal(cfg.providerUrl, PROVIDER_URL);
  assert.equal('temperature' in cfg, false);
  assert.equal('imageEnable' in cfg, false);
  assert.equal('imageUploadUrl' in cfg, false);
});

// 抓包 entry 14（视觉智能识别抽纸）的事件序列，含引用卡片那一段
const VISION_CAPTURED = [
  'session.response.created',
  'session.response.choices[].added',
  'session.response.choices[].items[].added',
  'session.response.choices[].items[].message.content[].added',
  'session.response.choices[].items[].message.content[].text.value.delta',
  'session.response.choices[].items[].message.content[].text.value.done',
  'session.response.choices[].items[].message.content[].text.annotations[].added',
  'session.response.choices[].items[].message.content[].done',
  'session.response.choices[].items[].done',
  'session.response.choices[].completed',
  'session.response.choices[].done',
  'session.response.done',
];

test('视觉智能请求：从 input 里取出图片，没有文字', () => {
  const parsed = plain(api.extractInput(VISION_BODY));
  assert.equal(parsed.text, '');
  assert.deepEqual(parsed.images, [IMG_URL]);
  // 纯文字请求不受影响
  const chat = plain(api.extractInput(BODY));
  assert.equal(chat.text, '问千问，你是什么模型');
  assert.deepEqual(chat.images, []);
});

test('视觉消息转成 OpenAI 格式，缺文字时补引导语', () => {
  const content = plain(api.buildUserContent({ text: '', images: [IMG_URL] }, '看图说话'));
  assert.equal(content.length, 2);
  assert.deepEqual(content[0], { type: 'text', text: '看图说话' });
  assert.deepEqual(content[1], { type: 'image_url', image_url: { url: IMG_URL } });

  const withText = plain(api.buildUserContent({ text: '这是什么', images: [IMG_URL] }, '看图说话'));
  assert.equal(withText[0].text, '这是什么');

  // 没有图片时保持字符串，和普通对话一致
  assert.equal(api.buildUserContent({ text: '你好', images: [] }, 'x'), '你好');
  assert.equal(api.buildUserContent({ text: '', images: [] }, 'x'), '(空输入)');
});

test('视觉请求走 VISION_MODEL 并带上图片', async () => {
  const env = { ...ENV, VISION_MODEL: 'vision-model' };
  const ctx = makeCtx({
    url: NEW_URL,
    body: VISION_BODY,
    env,
    route: () => chatText('这是一包心相印抽纸'),
  });
  const out = await api.main(ctx);
  const sent = ctx.calls[0].options.body;
  assert.equal(sent.model, 'vision-model');
  const user = sent.messages[1];
  assert.ok(Array.isArray(user.content));
  assert.equal(user.content[1].type, 'image_url');
  assert.equal(user.content[1].image_url.url, IMG_URL);
  assert.deepEqual(collapse(parseSSE(out.__responded.body).map(e => e.name).slice(1)), TEXT_CAPTURED);
});

test('视觉响应带引用时事件序列与抓包一致', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: VISION_BODY,
    env: ENV,
    route: () => ok({
      choices: [{
        message: {
          content: '这是一包抽纸',
          annotations: [{ type: 'url_citation', url_citation: { title: '来源标题', url: 'https://example.com/a' } }],
        },
      }],
    }),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), VISION_CAPTURED);

  const ann = events.find(e => e.name.endsWith('annotations[].added')).payload;
  assert.deepEqual(plain(ann.annotation), {
    type: 'url_citation',
    url_citation: { index: 0, title: '来源标题', url: 'https://example.com/a' },
  });
  assert.equal(ann.content_index, 0);

  const done = events.find(e => e.name.endsWith('content[].done')).payload;
  assert.equal(done.content.text.annotations.length, 1);
});

test('视觉请求失败时提示检查 VISION_MODEL', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: VISION_BODY,
    env: ENV,
    route: () => err(400, { error: { message: 'model does not support image input' } }),
  });
  const out = await api.main(ctx);
  const done = parseSSE(out.__responded.body).find(e => e.name.endsWith('text.value.done')).payload;
  assert.match(JSON.parse(done.value).content, /图片识别失败/);
  assert.match(JSON.parse(done.value).content, /VISION_MODEL/);
});

test('引用解析：支持 annotations 与 citations 两种来源', () => {
  const a = api.pickAnnotations({ choices: [{ message: { annotations: [{ type: 'url_citation', url_citation: { title: 't', url: 'https://a' } }] } }] });
  assert.equal(a.length, 1);
  assert.equal(a[0].url_citation.index, 0);

  const b = api.pickAnnotations({ citations: ['https://b', 'https://c'] });
  assert.equal(b.length, 2);
  assert.equal(b[1].url_citation.index, 1);

  assert.deepEqual(plain(api.pickAnnotations({})), []);
  assert.deepEqual(plain(api.pickAnnotations(null)), []);
});

test('长文本分片不超过 40 字符且可无损还原', () => {
  const inner = JSON.stringify({ content: 'x'.repeat(300), summary: 's', isRequestingUserInput: false });
  const chunks = api.chunkString(inner, 40);
  assert.ok(chunks.every(c => c.length <= 40));
  assert.equal(chunks.join(''), inner);
});

/* ------------------------------------------------- 写作工具（compose） */

// 抓包 entry（12:04）的真实报文：选中一段文本，要求「更优雅」
const COMPOSE_TEXT = JSON.stringify({ originalText: '# **我来一桥上，怀古轻吟风**\n', prompt: '更优雅' });
const COMPOSE_BODY = {
  configuration: {
    query: { locale: 'zh_CN', os_major_version: 27, os_minor_version: 3, os_patch_version: 0, platform: 'iOS' },
    response_configuration_group_id: 'compose_selectedAndAllText',
    template_variable_definition_overrides: [],
    template_variables: [],
  },
  input: [{ type: 'message', message: { role: 'user', content: [{ text: COMPOSE_TEXT, type: 'text' }] } }],
  response_format: { type: 'json_schema' },
  server_tools: [{ type: 'image_generator' }],
  stream: true,
};
const COMPOSE_REPLY = JSON.stringify({
  body: '登桥怀古，临风浅吟。',
  refinements: ['增加诗句的历史背景描述', '用更具体的意象替代浅吟', '调整句式以增强节奏感'],
});

test('写作工具识别：只看 configuration 的 compose_ 前缀', () => {
  assert.equal(api.isComposeRequest(COMPOSE_BODY), true);
  assert.equal(api.isComposeRequest(BODY), false);
  assert.equal(api.isComposeRequest(VISION_BODY), false);
  assert.equal(api.isComposeRequest({}), false);
  assert.equal(api.isComposeRequest(null), false);
});

test('写作工具入参解析：原文与要求，解析失败整段当原文', () => {
  const parsed = plain(api.parseComposeInput(COMPOSE_TEXT));
  assert.equal(parsed.originalText, '# **我来一桥上，怀古轻吟风**');
  assert.equal(parsed.prompt, '更优雅');

  const broken = plain(api.parseComposeInput('{不是 JSON'));
  assert.equal(broken.originalText, '{不是 JSON');
  assert.equal(broken.prompt, '');

  assert.deepEqual(plain(api.parseComposeInput('')), { originalText: '', prompt: '' });
});

test('写作工具走 WRITING_MODEL，SSE 事件序列与抓包一致', async () => {
  const env = { ...ENV, WRITING_MODEL: 'writing-model' };
  const ctx = makeCtx({ url: NEW_URL, body: COMPOSE_BODY, env, route: () => chatText(COMPOSE_REPLY) });
  const out = await api.main(ctx);

  const sent = ctx.calls[0].options.body;
  assert.equal(sent.model, 'writing-model');
  assert.equal(sent.tools, undefined);
  assert.match(sent.messages[1].content, /我来一桥上/);
  assert.match(sent.messages[1].content, /更优雅/);

  const events = parseSSE(out.__responded.body);
  assert.equal(events[0].name, 'session.created');
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), TEXT_CAPTURED);

  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.deepEqual(JSON.parse(done.value), {
    body: '登桥怀古，临风浅吟。',
    refinements: ['增加诗句的历史背景描述', '用更具体的意象替代浅吟', '调整句式以增强节奏感'],
  });
});

test('写作工具：deltas 还原后是 {body, refinements}，并忽略多余建议', async () => {
  const reply = '```json\n' + JSON.stringify({
    body: '登桥怀古，临风浅吟。',
    refinements: ['一', '二', '三', '四'],
  }) + '\n```';
  const ctx = makeCtx({ url: NEW_URL, body: COMPOSE_BODY, env: ENV, route: () => chatText(reply) });
  const events = parseSSE((await api.main(ctx)).__responded.body);

  let acc = '';
  for (const { name, payload } of events) if (name.endsWith('text.value.delta')) acc += payload.delta;
  const value = JSON.parse(acc);
  assert.equal(value.body, '登桥怀古，临风浅吟。');
  assert.deepEqual(value.refinements, ['一', '二', '三']);

  const completed = events.find(e => e.name === 'session.response.choices[].completed').payload.choice;
  assert.equal(completed.status, 'completed');
  assert.equal(completed.output[0].message.content[0].text.value, acc);
});

test('写作工具：模型不回 JSON 时降级为原文，不让 App 拿到裸文本', () => {
  const fallback = plain(api.parseComposeResult('抱歉，我无法完成', '原文'));
  assert.equal(fallback.body, '原文');
  assert.deepEqual(fallback.refinements, []);

  const wrapped = plain(api.parseComposeResult('好的：{"body":"改写后","refinements":["更简洁"]}（完）', '原文'));
  assert.equal(wrapped.body, '改写后');
  assert.deepEqual(wrapped.refinements, ['更简洁']);

  const value = api.buildComposeValue('改写后', ['更简洁']);
  assert.equal(value, '{"body":"改写后","refinements":["更简洁"]}');
});

test('写作工具：上游失败也回合法 JSON，且不写 Siri 会话历史', async () => {
  const storage = new Map();
  const ctx = makeCtx({
    url: NEW_URL,
    body: COMPOSE_BODY,
    env: ENV,
    storage,
    route: () => err(500, { error: { message: 'boom' } }),
  });
  const events = parseSSE((await api.main(ctx)).__responded.body);
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  const value = JSON.parse(done.value);
  assert.match(value.body, /写作后端不可用/);
  assert.match(value.body, /boom/);
  assert.deepEqual(value.refinements, []);
  assert.equal(storage.size, 0);
});


test('画图意图原样放行，不调用上游', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: DRAW_BODY, env: ENV, route: () => chatText('不该被调用') });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('普通提问不受放行逻辑影响', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('我是助理') });
  const out = await api.main(ctx);
  assert.ok(out && out.__responded);
  assert.equal(ctx.calls.length, 1);
});
