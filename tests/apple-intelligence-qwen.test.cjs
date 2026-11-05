const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/AppleIntelligence-Qwen.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math });
vm.runInContext(
  source.replace('export default async function (ctx)', 'async function main(ctx)') +
    `\nglobalThis.api = { main, readConfig, buildEndpoint, parseRequestPath, extractInput, extractUserText, buildUserContent, pickAnnotations, buildTextSSE, makeSummary, pickAnswer, unwrapAnswer, chunkString, looksLikeImageRequest, isComposeRequest, parseComposeInput, composeUserMessage, parseComposeResult, buildComposeValue, isBaiduImageRequest, extractImageBase64, base64ToBytes, detectImage, toBaidu, pickGuessword, multipartImage, readLensConfig, buildReasoningParams, parseExtraBody };`,
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

test('内置默认提示词换成中性口语版', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('ok') });
  await api.main(ctx);
  assert.equal(
    ctx.calls[0].options.body.messages[0].content,
    'Your answer must remain neutral, be accurate, and sound natural in spoken language. Output only the final answer.',
  );
});

test('默认不发送任何思考字段，请求体与旧版一致', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('ok') });
  await api.main(ctx);
  const body = ctx.calls[0].options.body;
  assert.deepEqual(Object.keys(body).sort(), ['messages', 'model', 'stream']);
});

test('openai 写法发 reasoning_effort，off 映射 none', async () => {
  assert.deepEqual(plain(api.buildReasoningParams('openai', 'high', '')), { reasoning_effort: 'high' });
  assert.deepEqual(plain(api.buildReasoningParams('openai', 'off', '')), { reasoning_effort: 'none' });
  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: { ...ENV, EFFORT_PROTOCOL: 'openai', EFFORT: 'medium' },
    route: () => chatText('ok'),
  });
  await api.main(ctx);
  assert.equal(ctx.calls[0].options.body.reasoning_effort, 'medium');
});

test('openrouter 写法发 reasoning.effort', () => {
  assert.deepEqual(plain(api.buildReasoningParams('openrouter', 'max', '')), {
    reasoning: { effort: 'max', exclude: false },
  });
  assert.deepEqual(plain(api.buildReasoningParams('openrouter', 'off', '')), {
    reasoning: { effort: 'none', exclude: false },
  });
});

test('qwen 写法发 enable_thinking 与 thinking_budget', async () => {
  assert.deepEqual(plain(api.buildReasoningParams('qwen', 'medium', '8192')), {
    enable_thinking: true,
    thinking_budget: 8192,
  });
  assert.deepEqual(plain(api.buildReasoningParams('qwen', 'off', '8192')), { enable_thinking: false });
  assert.deepEqual(plain(api.buildReasoningParams('qwen', 'medium', '')), { enable_thinking: true });

  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: { ...ENV, EFFORT_PROTOCOL: 'qwen', EFFORT: 'low', EFFORT_BUDGET: '4096' },
    route: () => chatText('ok'),
  });
  await api.main(ctx);
  const body = ctx.calls[0].options.body;
  assert.equal(body.enable_thinking, true);
  assert.equal(body.thinking_budget, 4096);
});

test('vllm 写法走 chat_template_kwargs', () => {
  assert.deepEqual(plain(api.buildReasoningParams('vllm', 'high', '')), {
    chat_template_kwargs: { enable_thinking: true },
  });
  assert.deepEqual(plain(api.buildReasoningParams('vllm', 'off', '')), {
    chat_template_kwargs: { enable_thinking: false },
  });
});

test('EXTRA_BODY 并入请求体但不能覆盖核心字段', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: { ...ENV, EXTRA_BODY: '{"top_k":20,"model":"hijack","messages":[],"stream":true}' },
    route: () => chatText('ok'),
  });
  await api.main(ctx);
  const body = ctx.calls[0].options.body;
  assert.equal(body.top_k, 20);
  assert.equal(body.model, 'test-model');
  assert.equal(body.stream, false);
  assert.equal(body.messages[0].role, 'system');
});

test('EXTRA_BODY 非法 JSON 给配置错误，不请求上游', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: { ...ENV, EXTRA_BODY: '{oops' },
    route: () => chatText('ok'),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.match(JSON.parse(done.value).content, /EXTRA_BODY/);
  assert.equal(ctx.calls.length, 0);
});

test('思考写法与档位做白名单校验', () => {
  assert.throws(() => api.buildReasoningParams('nope', 'low', ''), /EFFORT_PROTOCOL/);
  assert.throws(() => api.buildReasoningParams('openai', 'insane', ''), /EFFORT/);
  assert.deepEqual(plain(api.buildReasoningParams('openai', 'default', '')), {});
  assert.deepEqual(plain(api.buildReasoningParams('openai', '', '')), {});
  assert.deepEqual(plain(api.buildReasoningParams('none', 'high', '')), {});
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


test('画图意图原样放行，带回原始 body（脚本已读过流）', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: DRAW_BODY, env: ENV, route: () => chatText('不该被调用') });
  const out = await api.main(ctx);
  assert.deepEqual(plain(out), { body: JSON.stringify(DRAW_BODY) });
  assert.equal(ctx.calls.length, 0);
});

test('写作工具里出现「生成图片」也不会被画图放行误伤', async () => {
  const body = {
    configuration: { response_configuration_group_id: 'compose_selectedAndAllText' },
    input: [{
      type: 'message',
      message: { role: 'user', content: [{ type: 'text', text: JSON.stringify({ originalText: '帮我生成图片宣传文案', prompt: '更优雅' }) }] },
    }],
  };
  const ctx = makeCtx({ url: NEW_URL, body, env: ENV, route: () => chatText(JSON.stringify({ body: '改写后', refinements: [] })) });
  const out = await api.main(ctx);
  assert.ok(out && out.__responded, '应走写作链路而不是放行');
  assert.equal(ctx.calls.length, 1);
});

test('普通提问不受放行逻辑影响', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('我是助理') });
  const out = await api.main(ctx);
  assert.ok(out && out.__responded);
  assert.equal(ctx.calls.length, 1);
});

/* ------------------------------------------- 视觉搜索：百度识图 → Google Lens */

const BAIDU_URL = 'https://qianfan.baidubce.com/v1/images/search';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const FORM = 'image=' + encodeURIComponent(PNG_B64);
const LENS_RESPONSE = {
  search_metadata: { id: 'abc123', status: 'Success' },
  related_content: [{ query: '心相印抽纸' }],
  visual_matches: [
    {
      title: '心相印抽纸 3层100抽', link: 'https://item.example.com/1', source: '得物',
      thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:AAA',
      image: 'https://img.example.com/1.jpg', image_width: 800, image_height: 600,
    },
    {
      title: '抽纸对比测评', link: 'https://post.example.com/2', source: '什么值得买',
      thumbnail: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:BBB',
      thumbnail_width: 200, thumbnail_height: 150,
    },
  ],
  exact_matches: [{ title: '同款商品页', link: 'https://shop.example.com/3', thumbnail: 'https://encrypted-tbn1.gstatic.com/x' }],
  organic_results: [{ title: '心相印官网', link: 'https://www.example-brand.com', thumbnail: 'https://encrypted-tbn3.gstatic.com/y' }],
};

function makeImgCtx({ url = BAIDU_URL, body = FORM, env = { SERPAPI_KEY: 'sk-test' }, route }) {
  const calls = [];
  const notices = [];
  return {
    env, calls, notices,
    request: { url, method: 'POST', headers: {}, text: async () => body },
    http: {
      post: async (target, options) => { calls.push({ method: 'POST', target, options }); return route({ method: 'POST', target, options }); },
      get: async (target, options) => { calls.push({ method: 'GET', target, options }); return route({ method: 'GET', target, options }); },
    },
    notify: (payload) => notices.push(payload),
    respond: (payload) => ({ __responded: payload }),
  };
}

function okJson(json) {
  return { status: 200, text: async () => JSON.stringify(json) };
}

test('识图：非目标请求透传', async () => {
  const ctx = makeImgCtx({ url: 'https://qianfan.baidubce.com/v1/other' });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('识图：没填 SERPAPI_KEY 时继续走百度', async () => {
  const ctx = makeImgCtx({ env: {} });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('识图：解析 form body，百分号编码与加号都正确', () => {
  assert.equal(api.extractImageBase64(FORM), PNG_B64);
  assert.equal(api.extractImageBase64('image=abc%2Bdef%2F'), 'abc+def/');
  assert.equal(api.extractImageBase64('image=abc+def'), 'abc+def');
  assert.equal(api.extractImageBase64(''), '');
  assert.equal(api.extractImageBase64('other=1'), '');
});

test('识图：base64 解码与 PNG 魔数', () => {
  const bytes = api.base64ToBytes(PNG_B64);
  assert.equal(bytes.length, 70);
  assert.deepEqual(Array.from(bytes.slice(0, 8)), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(plain(api.detectImage(bytes)), { ext: 'png', mime: 'image/png' });
  assert.equal(api.base64ToBytes(PNG_B64.replace(/=+$/, '')).length, 70);
});

test('识图：multipart 结构正确', () => {
  const bytes = api.base64ToBytes(PNG_B64);
  const { boundary, body } = api.multipartImage(bytes, api.detectImage(bytes));
  const text = Buffer.from(body).toString('latin1');
  assert.ok(text.includes('name="image"; filename="image.png"'));
  assert.ok(text.includes('Content-Type: image/png'));
  assert.ok(text.includes('--' + boundary + '--\r\n'));
});

test('识图：上传 → 搜索 → 映射成百度 schema', async () => {
  const ctx = makeImgCtx({
    route: ({ method, target }) => {
      if (method === 'POST') return okJson({ image_id: 'img_123' });
      assert.match(target, /engine=google_lens/);
      assert.match(target, /image_id=img_123/);
      return okJson(LENS_RESPONSE);
    },
  });
  const out = await api.main(ctx);
  assert.ok(out && out.__responded);
  assert.equal(out.__responded.headers['Content-Type'], 'text/plain; charset=utf-8');

  const json = JSON.parse(out.__responded.body);
  assert.equal(json.error_code, 0);
  assert.equal(json.result.guessword_res[0].word, '心相印抽纸');

  const { res_items: res, sim_items: sim } = json.result.res_data;
  assert.equal(res.length, 2);
  assert.equal(res[0].title, '心相印抽纸 3层100抽');
  assert.equal(res[0].fromurl, 'https://item.example.com/1');
  assert.equal(res[0].site_name, '得物');
  assert.equal(res[0].width, 800);
  assert.equal(res[1].width, 200);
  assert.equal(sim.length, 2);
});

test('识图：hl / country / type 传给 SerpAPI', async () => {
  let target = '';
  const ctx = makeImgCtx({
    env: { SERPAPI_KEY: 'k', HL: 'zh-tw', COUNTRY: 'us', LENS_TYPE: 'visual_matches' },
    route: ({ method, target: t }) => {
      if (method === 'POST') return okJson({ image_id: 'i1' });
      target = t;
      return okJson({ visual_matches: [] });
    },
  });
  await api.main(ctx);
  assert.match(target, /hl=zh-tw/);
  assert.match(target, /country=us/);
  assert.match(target, /type=visual_matches/);
});

test('识图：上传失败回退百度并通知', async () => {
  const ctx = makeImgCtx({ route: () => ({ status: 401, text: async () => JSON.stringify({ error: 'Invalid API key' }) }) });
  assert.deepEqual(plain(await api.main(ctx)), { body: FORM });
  assert.equal(ctx.notices.length, 1);
  assert.match(ctx.notices[0].body, /Invalid API key/);
});

test('识图：搜索失败也回退百度', async () => {
  const ctx = makeImgCtx({
    route: ({ method }) => (method === 'POST' ? okJson({ image_id: 'i1' }) : { status: 500, text: async () => '{"error":"boom"}' }),
  });
  assert.deepEqual(plain(await api.main(ctx)), { body: FORM });
  assert.equal(ctx.notices.length, 1);
});

test('识图：超过 500KB 直接放行', async () => {
  const big = 'A'.repeat(Math.ceil((800 * 1024 * 4) / 3));
  const ctx = makeImgCtx({ body: 'image=' + big });
  assert.deepEqual(plain(await api.main(ctx)), { body: 'image=' + big });
  assert.equal(ctx.calls.length, 0);
});

test('识图：空结果也返回合法 schema', async () => {
  const ctx = makeImgCtx({
    route: ({ method }) => (method === 'POST' ? okJson({ image_id: 'i1' }) : okJson({ visual_matches: [] })),
  });
  const json = JSON.parse((await api.main(ctx)).__responded.body);
  assert.equal(json.error_code, 0);
  assert.equal(json.result.guessword_res[0].word, '图片搜索');
  assert.deepEqual(json.result.res_data.res_items, []);
});
