const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/BaiduImageSearch-Google.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math, Uint8Array });
vm.runInContext(
  source.replace('export default async function (ctx)', 'async function main(ctx)') +
    `\nglobalThis.api = { main, readConfig, parseRequestUrl, extractImageBase64, base64ToBytes, detectImage, toBaidu, pickGuessword, multipartImage, asciiBytes };`,
  context,
);
const api = context.api;
const plain = (v) => JSON.parse(JSON.stringify(v));

const TARGET = 'https://qianfan.baidubce.com/v1/images/search';
// 1x1 的 PNG
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const FORM = 'image=' + encodeURIComponent(PNG_B64);

const LENS_RESPONSE = {
  search_metadata: { id: 'abc123', status: 'Success' },
  related_content: [{ query: '心相印抽纸', link: 'https://www.google.com/search?q=x' }],
  visual_matches: [
    {
      position: 1,
      title: '心相印抽纸 3层100抽',
      link: 'https://item.example.com/1',
      source: '得物',
      thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:AAA',
      image: 'https://img.example.com/1.jpg',
      image_width: 800,
      image_height: 600,
    },
    {
      title: '抽纸对比测评',
      link: 'https://post.example.com/2',
      source: '什么值得买',
      thumbnail: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:BBB',
      thumbnail_width: 200,
      thumbnail_height: 150,
    },
  ],
  exact_matches: [
    { title: '同款商品页', link: 'https://shop.example.com/3', thumbnail: 'https://encrypted-tbn1.gstatic.com/x' },
  ],
  organic_results: [
    { title: '心相印官网', link: 'https://www.example-brand.com', thumbnail: 'https://encrypted-tbn3.gstatic.com/y' },
  ],
};

function makeCtx({ url = TARGET, body = FORM, env = { SERPAPI_KEY: 'sk-test' }, route }) {
  const calls = [];
  const notices = [];
  return {
    env,
    calls,
    notices,
    request: {
      url,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      text: async () => body,
    },
    http: {
      post: async (target, options) => {
        calls.push({ method: 'POST', target, options });
        return route({ method: 'POST', target, options });
      },
      get: async (target, options) => {
        calls.push({ method: 'GET', target, options });
        return route({ method: 'GET', target, options });
      },
    },
    notify: (payload) => notices.push(payload),
    respond: (payload) => ({ __responded: payload }),
  };
}

function ok(json) {
  return { status: 200, text: async () => JSON.stringify(json) };
}

test('非目标请求原样透传', async () => {
  const ctx = makeCtx({ url: 'https://qianfan.baidubce.com/v1/other' });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('没填 SERPAPI_KEY 时继续走百度', async () => {
  const ctx = makeCtx({ env: {} });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('解析 form body：百分号编码、加号、data URL 都不出错', () => {
  assert.equal(api.extractImageBase64(FORM), PNG_B64);
  assert.equal(api.extractImageBase64('image=abc%2Bdef%2F'), 'abc+def/');
  assert.equal(api.extractImageBase64('image=abc+def'), 'abc+def');
  assert.equal(api.extractImageBase64('image=%2F9j%2F4Q'), '/9j/4Q');
  assert.equal(api.extractImageBase64(''), '');
  assert.equal(api.extractImageBase64('other=1'), '');
});

test('base64 解码得到真实 PNG 字节', () => {
  const bytes = api.base64ToBytes(PNG_B64);
  assert.equal(bytes.length, 70);
  assert.deepEqual(Array.from(bytes.slice(0, 8)), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(plain(api.detectImage(bytes)), { ext: 'png', mime: 'image/png' });
  // URL-safe 与缺省 padding 也要能解
  assert.equal(api.base64ToBytes(PNG_B64.replace(/=+$/, '')).length, 70);
});

test('multipart 里带 filename、Content-Type 和结束边界', () => {
  const bytes = api.base64ToBytes(PNG_B64);
  const { boundary, body } = api.multipartImage(bytes, api.detectImage(bytes));
  const text = Buffer.from(body).toString('latin1');
  assert.ok(text.includes('name="image"; filename="image.png"'));
  assert.ok(text.includes('Content-Type: image/png'));
  assert.ok(text.includes('--' + boundary + '--\r\n'));
  assert.ok(body.length > bytes.length);
});

test('完整链路：上传拿 image_id → 搜索 → 映射成百度 schema', async () => {
  const ctx = makeCtx({
    route: ({ method, target }) => {
      if (method === 'POST') return ok({ image_id: 'img_123' });
      assert.match(target, /engine=google_lens/);
      assert.match(target, /image_id=img_123/);
      return ok(LENS_RESPONSE);
    },
  });
  const out = await api.main(ctx);
  assert.ok(out && out.__responded);
  assert.equal(out.__responded.status, 200);
  assert.equal(out.__responded.headers['Content-Type'], 'text/plain; charset=utf-8');

  const json = JSON.parse(out.__responded.body);
  assert.equal(json.error_code, 0);
  assert.equal(json.result.err_code, 0);
  assert.equal(json.result.guessword_res[0].word, '心相印抽纸');
  assert.equal(json.result.guessword_res[0].type, 'TYPE_MLLM_GUESSWORD');

  const { res_items: res, sim_items: sim } = json.result.res_data;
  assert.equal(res.length, 2);
  assert.equal(res[0].title, '心相印抽纸 3层100抽');
  assert.equal(res[0].fromurl, 'https://item.example.com/1');
  assert.equal(res[0].site_name, '得物');
  assert.equal(res[0].width, 800);
  assert.equal(res[0].height, 600);
  assert.equal(res[0].thumburl, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:AAA');
  // 第二条只有缩略图尺寸时退回缩略图尺寸
  assert.equal(res[1].width, 200);
  assert.equal(res[1].height, 150);

  assert.equal(sim.length, 2);
  assert.equal(sim[0].title, '同款商品页');
  assert.equal(sim[1].title, '心相印官网');
});

test('搜索请求带 hl / country / type', async () => {
  let target = '';
  const ctx = makeCtx({
    env: { SERPAPI_KEY: 'k', HL: 'zh-tw', COUNTRY: 'us', LENS_TYPE: 'visual_matches' },
    route: ({ method, target: t }) => {
      if (method === 'POST') return ok({ image_id: 'i1' });
      target = t;
      return ok({ visual_matches: [] });
    },
  });
  await api.main(ctx);
  assert.match(target, /hl=zh-tw/);
  assert.match(target, /country=us/);
  assert.match(target, /type=visual_matches/);
});

test('配置了 THUMB_PROXY 时缩略图走代理前缀', async () => {
  const ctx = makeCtx({
    env: { SERPAPI_KEY: 'k', THUMB_PROXY: 'https://wsrv.nl/?url=' },
    route: ({ method }) => (method === 'POST' ? ok({ image_id: 'i1' }) : ok(LENS_RESPONSE)),
  });
  const out = await api.main(ctx);
  const json = JSON.parse(out.__responded.body);
  const thumb = json.result.res_data.res_items[0].thumburl;
  assert.equal(thumb, 'https://wsrv.nl/?url=' + encodeURIComponent(LENS_RESPONSE.visual_matches[0].thumbnail));
});

test('上传失败时回退百度，并发出通知', async () => {
  const ctx = makeCtx({
    route: () => ({ status: 401, text: async () => JSON.stringify({ error: 'Invalid API key' }) }),
  });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.notices.length, 1);
  assert.match(ctx.notices[0].body, /Invalid API key/);
  assert.match(ctx.notices[0].body, /回退百度/);
});

test('搜索失败时也回退百度', async () => {
  const ctx = makeCtx({
    route: ({ method }) => (method === 'POST' ? ok({ image_id: 'i1' }) : { status: 500, text: async () => '{"error":"boom"}' }),
  });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.notices.length, 1);
});

test('图片超过 SerpAPI 500KB 上限时直接放行', async () => {
  const big = 'A'.repeat(Math.ceil((800 * 1024 * 4) / 3));
  const ctx = makeCtx({ body: 'image=' + big });
  assert.equal(await api.main(ctx), undefined);
  assert.equal(ctx.calls.length, 0);
});

test('没有匹配结果也返回合法 schema，不让 App 拿到错误', async () => {
  const ctx = makeCtx({
    route: ({ method }) => (method === 'POST' ? ok({ image_id: 'i1' }) : ok({ visual_matches: [] })),
  });
  const out = await api.main(ctx);
  const json = JSON.parse(out.__responded.body);
  assert.equal(json.error_code, 0);
  assert.equal(json.result.guessword_res[0].word, '图片搜索');
  assert.deepEqual(json.result.res_data.res_items, []);
  assert.deepEqual(json.result.res_data.sim_items, []);
});
