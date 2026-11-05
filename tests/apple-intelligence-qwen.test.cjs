const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/AppleIntelligence-Qwen.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math });
vm.runInContext(
  source.replace('export default async function (ctx)', 'async function main(ctx)') +
    `\nglobalThis.api = { main, readConfig, parseRequestPath, extractUserText, buildTextSSE, buildImageSSE, makeSummary, pickAnswer, parseToolCall, unwrapAnswer, chunkString, looksLikeImageRequest };`,
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

// 抓包 entry 22（画只狸花猫）的 20 个事件
const IMAGE_CAPTURED = [
  'session.response.created',
  'session.response.choices[].added',
  'session.response.choices[].items[].added',
  'session.response.choices[].items[].image_generator_call.in_progress',
  'session.response.choices[].items[].image_generator_call.prompt.done',
  'session.response.choices[].items[].image_generator_call.generating',
  'session.response.choices[].items[].image_generator_call.images[].added',
  'session.response.choices[].items[].image_generator_call.completed',
  'session.response.choices[].items[].done',
  'session.response.choices[].items[].added',
  'session.response.choices[].items[].message.content[].added',
  'session.response.choices[].items[].message.content[].done',
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

function chatToolCall(prompt) {
  return ok({
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'image_generator', arguments: JSON.stringify({ prompt }) } }],
        },
      },
    ],
  });
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

const ENV = {
  PROVIDER_URL: 'https://unit.invalid/v1/chat/completions',
  API_KEY: 'sk-test',
  MODEL: 'test-model',
  IMAGE_URL: 'https://unit.invalid/v1/images/generations',
  IMAGE_MODEL: 'test-image',
};
const NEW_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/responses';
const CONT_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/sess_616a864d-6c8b-4d94-914b-262f04a9c3d9/responses';
const BODY = {
  input: [{ message: { role: 'user', content: [{ text: '问千问，你是什么模型', type: 'text' }] }, type: 'message' }],
  stream: true,
  input_hint: 'knowledge',
};
const DRAW_BODY = {
  input: [{ message: { role: 'user', content: [{ text: '问千问，画只狸花猫', type: 'text' }] }, type: 'message' }],
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

test('图片 SSE 事件序列与抓包一致', () => {
  const names = parseSSE(api.buildImageSSE('sess_unit', {
    prompt: '一只狸花猫', url: 'https://img.example/cat.png', answer: '图片已生成。',
  }, { isNew: true })).map(e => e.name);
  assert.equal(names[0], 'session.created');
  assert.deepEqual(collapse(names.slice(1)), IMAGE_CAPTURED);
});

test('图片 SSE：call 项与 message 项结构正确', () => {
  const url = 'https://img.example/cat.png';
  const events = parseSSE(api.buildImageSSE('sess_unit', {
    prompt: '一只狸花猫', url, width: 1024, height: 1024, answer: '图片已生成。',
  }, { isNew: false }));

  const completed = events.find(e => e.name === 'session.response.choices[].completed').payload.choice;
  assert.equal(completed.output.length, 2);

  const [call, message] = completed.output;
  assert.equal(call.type, 'image_generator_call');
  assert.equal(call.image_generator_call.tool_name, 'image_generator');
  assert.equal(call.image_generator_call.status, 'completed');
  assert.deepEqual(plain(call.image_generator_call.images), [{ url }]);

  assert.equal(message.type, 'message');
  assert.equal(message.message.content.length, 2);
  assert.equal(message.message.content[0].type, 'image_generator_image');
  assert.deepEqual(plain(message.message.content[0].image_generator_image), {
    width: 1024, prompt: '一只狸花猫', url, height: 1024,
  });
  assert.equal(message.message.content[1].type, 'text');
  assert.equal(JSON.parse(message.message.content[1].text.value).content, '图片已生成。');

  const imagesAdded = events.find(e => e.name.endsWith('images[].added')).payload;
  assert.deepEqual(plain(imagesAdded.image), { url });
  assert.equal(imagesAdded.item_index, 0);
});

test('图片 SSE：文本 content 在 index 1，delta 可还原', () => {
  const events = parseSSE(api.buildImageSSE('sess_unit', {
    prompt: 'p', url: 'https://img.example/x.png', answer: '一段描述',
  }, { isNew: false }));
  const deltas = events.filter(e => e.name.endsWith('text.value.delta'));
  assert.ok(deltas.every(d => d.payload.item_index === 1 && d.payload.content_index === 1));
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.equal(deltas.map(d => d.payload.delta).join(''), done.value);
  assert.equal(JSON.parse(done.value).content, '一段描述');
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

test('模型调用 image_generator 时走图片链路', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: DRAW_BODY,
    env: ENV,
    route: target => (target === ENV.IMAGE_URL
      ? ok({ data: [{ url: 'https://img.example/cat.png' }] })
      : chatToolCall('一只成年狸花猫，蹲坐在深色实木地板上')),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);

  // 第一次请求带 tools，第二次打图片接口
  assert.equal(ctx.calls.length, 2);
  assert.ok(Array.isArray(ctx.calls[0].options.body.tools));
  assert.equal(ctx.calls[0].options.body.tools[0].function.name, 'image_generator');
  assert.equal(ctx.calls[1].target, ENV.IMAGE_URL);
  assert.equal(ctx.calls[1].options.body.prompt, '一只成年狸花猫，蹲坐在深色实木地板上');
  assert.equal(ctx.calls[1].options.body.size, '1024x1024');

  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), IMAGE_CAPTURED);
});

test('上游拒绝 tools 参数时自动重试，并用句式兜底出图', async () => {
  let n = 0;
  const ctx = makeCtx({
    url: NEW_URL,
    body: DRAW_BODY,
    env: ENV,
    route: target => {
      if (target === ENV.IMAGE_URL) return ok({ data: [{ url: 'https://img.example/cat.png' }] });
      n += 1;
      if (n === 1) return err(400, { error: { message: 'tools is not supported by this model' } });
      return chatText('我画不了');
    },
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.equal(ctx.calls[0].options.body.tools.length, 1);
  assert.equal(ctx.calls[1].options.body.tools, undefined);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), IMAGE_CAPTURED);
});

test('普通提问不会触发出图', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: ENV, route: () => chatText('我是你的助理') });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), TEXT_CAPTURED);
  assert.equal(ctx.calls.length, 1);
});

test('图片接口只回 base64 且没配转存时降级为文本', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: DRAW_BODY,
    env: ENV,
    route: target => (target === ENV.IMAGE_URL
      ? ok({ data: [{ b64_json: 'AAAA' }] })
      : chatToolCall('一只狸花猫')),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), TEXT_CAPTURED);
  const done = events.find(e => e.name.endsWith('text.value.done')).payload;
  assert.match(JSON.parse(done.value).content, /图片生成失败/);
  assert.match(JSON.parse(done.value).content, /IMAGE_UPLOAD_URL/);
});

test('配置了转存接口时 base64 也能出图', async () => {
  const env = { ...ENV, IMAGE_UPLOAD_URL: 'https://unit.invalid/upload' };
  const ctx = makeCtx({
    url: NEW_URL,
    body: DRAW_BODY,
    env,
    route: target => {
      if (target === ENV.IMAGE_URL) return ok({ data: [{ b64_json: 'AAAA' }] });
      if (target === env.IMAGE_UPLOAD_URL) return ok({ url: 'https://cdn.example/a.png' });
      return chatToolCall('一只狸花猫');
    },
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), IMAGE_CAPTURED);
  const added = events.find(e => e.name.endsWith('images[].added')).payload;
  assert.equal(added.image.url, 'https://cdn.example/a.png');
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

test('tool_calls 解析：只认 image_generator 且要求 prompt', () => {
  const data = {
    choices: [{
      message: {
        tool_calls: [
          { function: { name: 'other', arguments: '{}' } },
          { function: { name: 'image_generator', arguments: '{"prompt":"猫"}' } },
        ],
      },
    }],
  };
  assert.deepEqual(plain(api.parseToolCall(data)), { prompt: '猫' });
  assert.equal(api.parseToolCall({ choices: [{ message: {} }] }), null);
  assert.equal(api.parseToolCall({ choices: [{ message: { tool_calls: [{ function: { name: 'image_generator', arguments: '{}' } }] } }] }), null);
});

test('句式兜底只在明确要图时命中', () => {
  for (const t of ['画只狸花猫', '帮我画一张海报', '生成图片：海边日落', 'draw me a cat image']) {
    assert.equal(api.looksLikeImageRequest(t), true, t);
  }
  for (const t of ['今天天气怎么样', '这张图片里是什么', '帮我总结这段话', '']) {
    assert.equal(api.looksLikeImageRequest(t), false, t);
  }
});

test('配置默认值：图片开关打开、尺寸解析', () => {
  const cfg = api.readConfig(ENV);
  assert.equal(cfg.imageEnable, true);
  assert.equal(cfg.imageWidth, 1024);
  assert.equal(cfg.imageHeight, 1024);
  const wide = api.readConfig({ ...ENV, IMAGE_SIZE: '1792x1024', IMAGE_ENABLE: 'false' });
  assert.equal(wide.imageWidth, 1792);
  assert.equal(wide.imageHeight, 1024);
  assert.equal(wide.imageEnable, false);
});

test('长文本分片不超过 40 字符且可无损还原', () => {
  const inner = JSON.stringify({ content: 'x'.repeat(300), summary: 's', isRequestingUserInput: false });
  const chunks = api.chunkString(inner, 40);
  assert.ok(chunks.every(c => c.length <= 40));
  assert.equal(chunks.join(''), inner);
});
