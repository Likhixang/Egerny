/* 服务可达监测 — Egern 原生 Widget DSL
 * 并发探测所选服务，展示 HTTP 状态分类与响应延迟；无演示数据，探测失败即如实标注。
 */

const SERVICES = [
  { key: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/generate_204' },
  { key: 'netflix', name: 'Netflix', url: 'https://www.netflix.com/robots.txt' },
  { key: 'disney', name: 'Disney+', url: 'https://www.disneyplus.com/robots.txt' },
  { key: 'spotify', name: 'Spotify', url: 'https://open.spotify.com/robots.txt' },
  { key: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/robots.txt' },
  { key: 'claude', name: 'Claude', url: 'https://claude.ai/robots.txt' },
  { key: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/robots.txt' },
  { key: 'grok', name: 'Grok', url: 'https://grok.com/robots.txt' },
];

const PROBE_TIMEOUT = 4000;
const REFRESH_MINUTES = 15;
const BAR_MAX_MS = 2000;
const SLOW_MS = 800;

const TONE = {
  text: { light: '#0B0B0F', dark: '#FFFFFF' },
  dim: { light: 'rgba(60,60,67,0.62)', dark: 'rgba(235,235,245,0.62)' },
  faint: { light: 'rgba(60,60,67,0.40)', dark: 'rgba(235,235,245,0.36)' },
  glass: { light: 'rgba(255,255,255,0.74)', dark: 'rgba(255,255,255,0.085)' },
  hairline: { light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.10)' },
  good: { light: '#0B7A3E', dark: '#3DDC84' },
  warn: { light: '#A65900', dark: '#FFB340' },
  fail: { light: '#B81E16', dark: '#FF6B63' },
};

// SVG 一次性光栅化，无法跟随深浅色：统一使用明亮系统色，两种模式都可辨。
const BAR = { good: '#30D158', warn: '#FF9F0A', fail: '#FF453A', track: '#8E8E93' };

const STATE = {
  ok: { label: '正常', tone: TONE.good, bar: BAR.good },
  limited: { label: '受限', tone: TONE.warn, bar: BAR.warn },
  bad: { label: '异常', tone: TONE.fail, bar: BAR.fail },
  down: { label: '不可达', tone: TONE.fail, bar: BAR.fail },
};

const FAMILIES = ['systemSmall', 'systemMedium', 'systemLarge', 'systemExtraLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'Accept': '*/*',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
};

function text(value, size, color, weight, extra) {
  return Object.assign({
    type: 'text',
    text: String(value),
    font: { size: size || 12, weight: weight || 'regular' },
    textColor: color || TONE.text,
    maxLines: 1,
    minScale: 0.65,
  }, extra || {});
}

function mono(value, size, color, weight, extra) {
  return text(value, size, color, weight, Object.assign({ font: { size: size || 12, weight: weight || 'medium', family: 'Menlo' } }, extra || {}));
}

function stack(direction, children, extra) {
  return Object.assign({
    type: 'stack',
    direction: direction || 'column',
    alignItems: direction === 'row' ? 'center' : 'start',
    gap: 4,
    children: children.filter(Boolean),
  }, extra || {});
}

function icon(name, color, size) {
  const s = size || 12;
  return { type: 'image', src: 'sf-symbol:' + name, width: s, height: s, color: color };
}

function dot(size, color) {
  const s = size || 5;
  return { type: 'stack', width: s, height: s, borderRadius: s / 2, backgroundColor: color, children: [] };
}

function spacer(length) {
  return length ? { type: 'spacer', length: length } : { type: 'spacer' };
}

function svgUri(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function barImage(fraction, color, width, height) {
  const w = Math.max(20, Math.round(width));
  const h = Math.max(3, Math.round(height || 4));
  const r = h / 2;
  const p = Math.max(0, Math.min(1, Number(fraction) || 0));
  const filled = p > 0 ? Math.max(h, w * p) : 0;
  const body =
    "<rect width='" + w + "' height='" + h + "' rx='" + r + "' fill='" + BAR.track + "' fill-opacity='0.24'/>" +
    (filled ? "<rect width='" + filled.toFixed(1) + "' height='" + h + "' rx='" + r + "' fill='" + color + "'/>" : '');
  return { type: 'image', src: svgUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + ' ' + h + "'>" + body + '</svg>'), width: w, height: h };
}

function ringImage(fraction, color, size, stroke) {
  const s = Math.max(16, Math.round(size));
  const sw = Math.max(2, Math.round(stroke || 3));
  const c = s / 2;
  const r = c - sw / 2;
  const p = Math.max(0, Math.min(1, Number(fraction) || 0));
  let body = "<circle cx='" + c + "' cy='" + c + "' r='" + r + "' fill='none' stroke='" + color + "' stroke-opacity='0.22' stroke-width='" + sw + "'/>";
  if (p >= 0.999) {
    body += "<circle cx='" + c + "' cy='" + c + "' r='" + r + "' fill='none' stroke='" + color + "' stroke-width='" + sw + "'/>";
  } else if (p > 0) {
    const a = p * 2 * Math.PI;
    const x = (c + r * Math.sin(a)).toFixed(2);
    const y = (c - r * Math.cos(a)).toFixed(2);
    body += "<path d='M " + c + ' ' + (c - r).toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + (p > 0.5 ? 1 : 0) + ' 1 ' + x + ' ' + y + "' fill='none' stroke='" + color + "' stroke-width='" + sw + "' stroke-linecap='round'/>";
  }
  return { type: 'image', src: svgUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + s + ' ' + s + "'>" + body + '</svg>'), width: s, height: s };
}

function background() {
  return {
    type: 'linear',
    colors: [
      { light: '#F4F7FF', dark: '#141D31' },
      { light: '#EDF1FF', dark: '#0C1425' },
      { light: '#F0FAF5', dark: '#091511' },
    ],
    stops: [0, 0.6, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function flag(cc) {
  const code = String(cc || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return '🌐';
  return String.fromCodePoint(code.charCodeAt(0) + 127397, code.charCodeAt(1) + 127397);
}

function envOn(env, key) {
  const raw = env[key];
  if (raw === null || raw === undefined || String(raw).trim() === '') return true;
  const value = String(raw).trim().toLowerCase();
  return value !== 'false' && value !== '0' && value !== 'off' && value !== 'no';
}

function selectedServices(env) {
  return SERVICES.filter(service => envOn(env, 'SHOW_' + service.key.toUpperCase()));
}

function classify(response) {
  const status = Number(response && response.status) || 0;
  if (!status) return 'down';
  if (status >= 200 && status < 400) return 'ok';
  if (status === 401 || status === 403 || status === 407 || status === 429 || status === 451) return 'limited';
  return 'bad';
}

function withTimeout(promise, ms) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, guard]).then(
    value => { clearTimeout(timer); return value; },
    error => { clearTimeout(timer); throw error; }
  );
}

async function probe(ctx, service) {
  const started = Date.now();
  const separator = service.url.indexOf('?') === -1 ? '?' : '&';
  try {
    const response = await withTimeout(
      ctx.http.get(service.url + separator + '_=' + started, {
        timeout: PROBE_TIMEOUT,
        headers: HEADERS,
        followRedirect: true,
      }),
      PROBE_TIMEOUT + 800
    );
    return { state: classify(response), ms: Date.now() - started };
  } catch (error) {
    const status = Number(error && (error.status || error.statusCode));
    return { state: status ? classify({ status: status }) : 'down', ms: Date.now() - started };
  }
}

async function fetchRegion(ctx) {
  try {
    const response = await withTimeout(
      ctx.http.get('http://ip-api.com/json/?fields=status,countryCode,lang=zh-CN&_=' + Date.now(), { timeout: 3000 }),
      3800
    );
    const data = JSON.parse(await response.text());
    const code = String(data && data.countryCode || '').toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? { cc: code } : null;
  } catch (_) {
    return null;
  }
}

function toneOf(entry) {
  const state = STATE[entry.state] || STATE.down;
  if (entry.state !== 'ok') return { tone: state.tone, bar: state.bar };
  return entry.ms <= SLOW_MS ? { tone: TONE.good, bar: BAR.good } : { tone: TONE.warn, bar: BAR.warn };
}

function fractionOf(entry) {
  if (entry.state === 'down') return 0;
  if (entry.state === 'limited') return 1;
  if (entry.state === 'bad') return 1;
  return Math.sqrt(Math.min(entry.ms, BAR_MAX_MS) / BAR_MAX_MS);
}

function valueText(entry) {
  return entry.state === 'ok' ? String(entry.ms) : (STATE[entry.state] || STATE.down).label;
}

function tallyOf(rows) {
  const ok = rows.filter(row => row.entry.state === 'ok').length;
  return { ok: ok, total: rows.length };
}

function headlineTone(tally) {
  if (!tally.total) return TONE.faint;
  if (tally.ok === tally.total) return TONE.good;
  if (tally.ok === 0) return TONE.fail;
  return TONE.warn;
}

function worstRow(rows) {
  const ok = rows.filter(row => row.entry.state === 'ok');
  if (!ok.length) return null;
  return ok.reduce((a, b) => (b.entry.ms > a.entry.ms ? b : a));
}

function header(tally, region, options) {
  const opts = options || {};
  const tone = headlineTone(tally);
  const children = [
    icon('antenna.radiowaves.left.and.right', tone, opts.small ? 11 : 13),
    text('服务可达', opts.small ? 11 : 13, TONE.text, 'semibold'),
    spacer(),
  ];
  if (region) children.push(mono(flag(region.cc) + ' ' + region.cc, opts.small ? 9 : 9.5, TONE.dim, 'medium'));
  if (opts.ring) children.push(ringImage(tally.ok / Math.max(1, tally.total), typeof tone === 'object' ? tone.light : tone, opts.small ? 16 : 18, 3));
  children.push(mono(tally.ok + '/' + tally.total, opts.small ? 10 : 10.5, tone, 'bold'));
  return stack('row', children, { alignItems: 'center', gap: opts.small ? 4 : 5 });
}

function emptyState(message, detail) {
  return {
    type: 'widget',
    padding: 16,
    gap: 6,
    backgroundGradient: background(),
    refreshAfter: new Date(Date.now() + REFRESH_MINUTES * 60000).toISOString(),
    children: [
      stack('row', [icon('antenna.radiowaves.left.and.right', TONE.faint, 13), text('服务可达', 13, TONE.text, 'semibold')], { alignItems: 'center', gap: 5 }),
      spacer(),
      icon('slider.horizontal.3', TONE.faint, 20),
      text(message, 14, TONE.text, 'semibold', { maxLines: 2 }),
      text(detail, 10.5, TONE.dim, 'regular', { maxLines: 3 }),
      spacer(),
    ],
  };
}

function compactCard(row, innerWidth) {
  const entry = row.entry;
  const state = STATE[entry.state] || STATE.down;
  const tone = toneOf(entry);
  return stack('column', [
    stack('row', [
      text(row.service.name, 9.5, TONE.text, 'semibold', { maxLines: 1, minScale: 0.7 }),
      spacer(),
      dot(4.5, state.tone),
    ], { alignItems: 'center', gap: 3 }),
    spacer(),
    stack('row', [
      entry.state === 'ok'
        ? mono(entry.ms, 12.5, tone.tone, 'bold')
        : text(state.label, 11.5, state.tone, 'semibold'),
      entry.state === 'ok' ? mono('ms', 8, TONE.faint, 'medium') : null,
    ], { alignItems: 'end', gap: 1 }),
    barImage(fractionOf(entry), tone.bar, innerWidth, 3),
  ], {
    padding: [5, 7, 5, 7],
    borderRadius: 13,
    backgroundColor: TONE.glass,
    borderWidth: 0.5,
    borderColor: TONE.hairline,
    gap: 2,
    flex: 1,
  });
}

function rowCard(row, innerWidth) {
  const entry = row.entry;
  const state = STATE[entry.state] || STATE.down;
  const tone = toneOf(entry);
  return stack('column', [
    stack('row', [
      text(row.service.name, 11.5, TONE.text, 'semibold', { maxLines: 1, minScale: 0.75 }),
      spacer(),
      dot(5.5, state.tone),
    ], { alignItems: 'center', gap: 4 }),
    stack('row', [
      mono(entry.state === 'ok' ? entry.ms : '—', 16, tone.tone, 'bold'),
      mono('ms', 8.5, TONE.faint, 'medium'),
      spacer(),
      text(state.label, 9.5, state.tone, 'semibold'),
    ], { alignItems: 'end', gap: 2 }),
    barImage(fractionOf(entry), tone.bar, innerWidth, 4),
  ], {
    padding: [8, 9, 8, 9],
    borderRadius: 15,
    backgroundColor: TONE.glass,
    borderWidth: 0.5,
    borderColor: TONE.hairline,
    gap: 4,
    flex: 1,
  });
}

function grid(rows, columns, cardOf, innerWidth, rowGap) {
  const lines = [];
  for (let index = 0; index < rows.length; index += columns) {
    const slice = rows.slice(index, index + columns).map(row => cardOf(row, innerWidth));
    while (slice.length < columns && rows.length > columns) slice.push({ type: 'spacer' });
    lines.push(stack('row', slice, { gap: 6, flex: 1, alignItems: 'start' }));
  }
  return stack('column', lines, { gap: rowGap || 6, flex: 1 });
}

function footer(rows, small) {
  const worst = worstRow(rows);
  if (!worst) return mono('探测未返回可用响应', small ? 9 : 9.5, TONE.fail, 'medium');
  const good = rows.filter(row => row.entry.state === 'ok').length;
  const label = good === rows.length ? '全部可用' : worst.service.name + ' 最慢';
  return stack('row', [
    mono(label, small ? 9 : 9.5, TONE.dim, 'medium'),
    spacer(),
    mono(worst.entry.ms + 'ms', small ? 9 : 9.5, TONE.dim, 'bold'),
    { type: 'date', date: new Date().toISOString(), format: 'time', font: { size: small ? 9 : 9.5, weight: 'medium', family: 'Menlo' }, textColor: TONE.faint, maxLines: 1 },
  ], { alignItems: 'center', gap: 4 });
}

function renderSmall(rows, tally, region) {
  return {
    type: 'widget',
    padding: [10, 11, 10, 11],
    gap: 4,
    backgroundGradient: background(),
    refreshAfter: new Date(Date.now() + REFRESH_MINUTES * 60000).toISOString(),
    children: [
      header(tally, region, { small: true }),
      stack('column', rows.map(row => {
        const entry = row.entry;
        const state = STATE[entry.state] || STATE.down;
        return stack('row', [
          dot(4.5, state.tone),
          text(row.service.name, 9.5, TONE.text, 'semibold', { maxLines: 1, minScale: 0.75 }),
          spacer(),
          mono(valueText(entry), 9, entry.state === 'ok' ? toneOf(entry).tone : state.tone, 'medium'),
        ], { alignItems: 'center', gap: 4 });
      }), { gap: 2, flex: 1, alignItems: 'start' }),
    ],
  };
}

function renderMedium(rows, tally, region) {
  const columns = rows.length <= 4 ? Math.max(1, rows.length) : 4;
  const cardWidth = Math.floor((312 - 6 * (columns - 1)) / columns) - 20;
  return {
    type: 'widget',
    padding: [10, 12, 8, 12],
    gap: 5,
    backgroundGradient: background(),
    refreshAfter: new Date(Date.now() + REFRESH_MINUTES * 60000).toISOString(),
    children: [
      header(tally, region, {}),
      grid(rows, columns, compactCard, cardWidth, 6),
      footer(rows, true),
    ],
  };
}

function renderLarge(rows, tally, region, extraLarge) {
  const columns = extraLarge ? 4 : 2;
  const width = extraLarge ? 726 : 338;
  const cardWidth = Math.floor((width - 26 - 6 * (columns - 1)) / columns) - 20;
  return {
    type: 'widget',
    padding: [13, 13, 12, 13],
    gap: 8,
    backgroundGradient: background(),
    refreshAfter: new Date(Date.now() + REFRESH_MINUTES * 60000).toISOString(),
    children: [
      header(tally, region, { ring: true }),
      grid(rows, columns, rowCard, cardWidth, 7),
      footer(rows, false),
    ],
  };
}

function renderLock(rows, tally, family) {
  const tone = headlineTone(tally);
  const worst = worstRow(rows);
  const summary = worst ? worst.service.name + ' ' + worst.entry.ms + 'ms' : '无可用响应';
  if (family === 'accessoryInline') {
    return {
      type: 'widget',
      children: [text('服务 ' + tally.ok + '/' + tally.total + ' · ' + summary, 11, tone, 'semibold', { maxLines: 1, minScale: 0.7 })],
    };
  }
  if (family === 'accessoryCircular') {
    return {
      type: 'widget',
      padding: 3,
      backgroundImage: ringImage(tally.ok / Math.max(1, tally.total), worst ? '#30D158' : '#FF453A', 60, 6).src,
      children: [
        stack('column', [
          mono(tally.ok + '/' + tally.total, 14, tone, 'bold'),
          text('可用', 8, TONE.dim, 'medium'),
        ], { alignItems: 'center', gap: 0 }),
      ],
    };
  }
  return {
    type: 'widget',
    padding: [3, 4, 3, 4],
    gap: 2,
    children: [
      stack('row', [
        icon('antenna.radiowaves.left.and.right', tone, 10),
        text('服务可达', 10, TONE.text, 'semibold'),
        spacer(),
        mono(tally.ok + '/' + tally.total, 10, tone, 'bold'),
      ], { alignItems: 'center', gap: 4 }),
      mono(summary, 9.5, TONE.dim, 'medium'),
    ],
  };
}

export default async function (ctx) {
  const env = (ctx && ctx.env) || {};
  const family = FAMILIES.indexOf(ctx.widgetFamily) === -1 ? 'systemMedium' : ctx.widgetFamily;
  const services = selectedServices(env);

  if (!services.length) {
    return emptyState('未选择服务', '在模块设置里打开至少一个服务开关');
  }

  const probes = services.map(service => probe(ctx, service));
  const regionTask = fetchRegion(ctx);
  const settled = await Promise.all(probes);
  const region = await regionTask;

  const rows = services.map((service, index) => ({ service: service, entry: settled[index] || { state: 'down', ms: 0 } }));
  const tally = tallyOf(rows);

  if (family === 'accessoryInline' || family === 'accessoryCircular' || family === 'accessoryRectangular') {
    return renderLock(rows, tally, family);
  }
  if (family === 'systemSmall') return renderSmall(rows, tally, region);
  if (family === 'systemLarge') return renderLarge(rows, tally, region, false);
  if (family === 'systemExtraLarge') return renderLarge(rows, tally, region, true);
  return renderMedium(rows, tally, region);
}
