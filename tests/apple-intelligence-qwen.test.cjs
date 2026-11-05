const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/AppleIntelligence-Qwen.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math });
vm.runInContext(
  source.replace('export default async function (ctx)', 'async function main(ctx)') +
    `\nglobalThis.api = { main, readConfig, parseRequestPath, extractUserText, buildSSE, makeSummary, pickAnswer, unwrapAnswer, chunkString };`,
  context,
);
const api = context.api;

// 抓包里真实观察到的事件序列（新会话会多一个 session.created）
const CAPTURED = [
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

function makeCtx({ url, body, env, post, storage = new Map() }) {
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
        if (post) return post(target, options, calls.length);
        return { status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: '默认回答' } }] }) };
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

const ENV = { PROVIDER_URL: 'https://unit.invalid/v1/chat/completions', API_KEY: 'sk-test', MODEL: 'test-model' };
const NEW_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/responses';
const CONT_URL = 'https://prod-yabuli.qianwen.com/v1/sessions/sess_616a864d-6c8b-4d94-914b-262f04a9c3d9/responses';
const BODY = {
  input: [{ message: { role: 'user', content: [{ text: '问千问，你是什么模型', type: 'text' }] }, type: 'message' }],
  stream: true,
  input_hint: 'knowledge',
};

test('路径解析：新会话 / 续轮 / 非目标', () => {
  const plain = value => JSON.parse(JSON.stringify(value));
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

test('SSE 事件序列与抓包一致', () => {
  const text = api.buildSSE('sess_unit', '我是千问', { isNew: true });
  const names = parseSSE(text).map(e => e.name);
  assert.equal(names[0], 'session.created');
  assert.deepEqual(collapse(names.slice(1)), CAPTURED);
});

test('deltas 拼接等于 done.value，内层是合法 JSON', () => {
  const answer = '杭州是浙江省省会，西湖就在城西。';
  const events = parseSSE(api.buildSSE('sess_unit', answer, { isNew: false }));
  let acc = '';
  let doneValue = null;
  for (const { name, payload } of events) {
    if (name.endsWith('text.value.delta')) acc += payload.delta;
    if (name.endsWith('text.value.done')) doneValue = payload.value;
  }
  assert.ok(doneValue, '缺少 done 事件');
  assert.equal(acc, doneValue);

  const inner = JSON.parse(doneValue);
  assert.equal(inner.content, answer);
  assert.equal(inner.isRequestingUserInput, false);
  assert.ok(inner.summary.length > 0);

  const completed = events.find(e => e.name === 'session.response.choices[].completed');
  assert.equal(completed.payload.choice.status, 'completed');
  assert.equal(completed.payload.choice.output[0].message.content[0].text.value, doneValue);
});

test('session_id 贯穿整个响应', () => {
  const events = parseSSE(api.buildSSE('sess_abc', 'hi', { isNew: true }));
  const created = events.find(e => e.name === 'session.response.created').payload;
  const done = events.find(e => e.name === 'session.response.done').payload;
  assert.equal(created.session_id, 'sess_abc');
  assert.equal(done.session_id, 'sess_abc');
  assert.equal(created.id, done.id);
});

test('多轮对话把历史带上，并写入存储', async () => {
  const storage = new Map();
  const first = makeCtx({ url: NEW_URL, body: BODY, env: ENV, storage, post: async () => ({ status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: '第一轮回答' } }] }) }) });
  await api.main(first);
  const sessionId = [...storage.keys()][0].replace('AIQ:hist:', '');
  assert.ok(sessionId.startsWith('sess_'), '应写入 session 历史');

  const second = makeCtx({
    url: `https://prod-yabuli.qianwen.com/v1/sessions/${sessionId}/responses`,
    body: { input: [{ message: { role: 'user', content: [{ text: '再说一句', type: 'text' }] } }] },
    env: ENV,
    storage,
    post: async () => ({ status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: '第二轮回答' } }] }) }),
  });
  await api.main(second);

  const sent = second.calls[0].options.body.messages;
  assert.equal(sent[0].role, 'system');
  assert.equal(sent[1].content, '问千问，你是什么模型');
  assert.equal(sent[2].content, '第一轮回答');
  assert.equal(sent[3].content, '再说一句');
  assert.equal(second.calls[0].options.body.model, 'test-model');
  assert.equal(second.calls[0].options.headers.Authorization, 'Bearer sk-test');
});

test('上游失败也返回合法 SSE，而不是挂起', async () => {
  const ctx = makeCtx({
    url: NEW_URL,
    body: BODY,
    env: ENV,
    post: async () => ({ status: 500, text: async () => JSON.stringify({ error: { message: 'boom' } }) }),
  });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  assert.deepEqual(collapse(events.map(e => e.name).slice(1)), CAPTURED);
  const doneValue = events.find(e => e.name.endsWith('text.value.done')).payload.value;
  assert.match(JSON.parse(doneValue).content, /后端不可用/);
  assert.match(JSON.parse(doneValue).content, /boom/);
});

test('未配置时给出可读错误，不抛异常', async () => {
  const ctx = makeCtx({ url: NEW_URL, body: BODY, env: {} });
  const out = await api.main(ctx);
  const events = parseSSE(out.__responded.body);
  const doneValue = events.find(e => e.name.endsWith('text.value.done')).payload.value;
  assert.match(JSON.parse(doneValue).content, /配置错误/);
  assert.match(JSON.parse(doneValue).content, /PROVIDER_URL/);
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

test('长文本分片不超过 40 字符且可无损还原', () => {
  const inner = JSON.stringify({ content: 'x'.repeat(300), summary: 's', isRequestingUserInput: false });
  const chunks = api.chunkString(inner, 40);
  assert.ok(chunks.every(c => c.length <= 40));
  assert.equal(chunks.join(''), inner);
});
