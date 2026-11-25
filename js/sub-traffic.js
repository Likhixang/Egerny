/**
 * Egern 小组件：订阅流量监控 v1（iOS 液态玻璃风格 · 多订阅）
 *
 * 功能：
 *   - 同时读取最多 10 个机场 / 代理订阅（并行请求，各自独立缓存）
 *   - 本地生成 SVG 圆环 / 半圆仪表 / 柱状图，不依赖外部图片服务，离线可用
 *   - 剩余流量、已用 / 总量、今日已用、近 7 天用量、日均可用、用完预测、到期与重置倒计时
 *   - 订阅只返回剩余流量时，用套餐总量（SUBn_TOTAL_GB）估算总量
 *   - 1 个订阅：小 / 中 / 大三套布局；2~4 个：卡片网格；5~10 个：紧凑双列网格
 *   - 支持锁屏圆形 / 矩形 / 内联
 *
 * Env：
 *   SUB1_URL / SUB1_NAME / SUB1_RESET_DAY … SUB10_*（机场正常会返回套餐总量，无需填写）
 *   SUBn_TOTAL_GB：仅当机场不返回 total 时才需要，模块 UI 未列出，可在 Env 里手动添加
 *   WIDGET_TITLE（多订阅标题）、REFRESH_HOURS、SUBSCRIPTION_USER_AGENT
 *   兼容按 | 或换行分隔的 SUBSCRIPTION_URL / SUBSCRIPTION_NAME / RESET_DAY / PLAN_TOTAL_GB
 */

function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

const STORE_NS = 'egern.sub-traffic.v1';

function storageKey(url) {
  return `${STORE_NS}.${hashString(url)}`;
}

function readHeader(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const target = String(name).toLowerCase();
  const matchedKey = Object.keys(headers).find(key => key.toLowerCase() === target);
  return matchedKey ? headers[matchedKey] : '';
}

function parseUserInfo(raw) {
  const values = {};
  String(raw || '').split(';').forEach(part => {
    const index = part.indexOf('=');
    if (index < 1) return;
    const key = part.slice(0, index).trim().toLowerCase();
    const value = Number(part.slice(index + 1).trim());
    if (Number.isFinite(value)) values[key] = value;
  });

  if (!Number.isFinite(values.upload) || !Number.isFinite(values.download)) {
    return null;
  }

  const upload = Math.max(0, values.upload);
  const download = Math.max(0, values.download);
  // 机场一般都会返回 total；缺失时如实标成未知，不编造套餐总量
  const hasTotal = Number.isFinite(values.total);
  const total = hasTotal ? Math.max(0, values.total) : null;
  const used = upload + download;
  const unlimited = hasTotal && total === 0;
  const remaining = !hasTotal ? null : unlimited ? Infinity : Math.max(0, total - used);
  const expireValue = Number(values.expire) || 0;
  const expireAt = expireValue > 1000000000000 ? expireValue : expireValue * 1000;

  return { upload, download, total, used, remaining, unlimited, totalUnknown: !hasTotal, expireAt };
}

function unitBytes(value, unit) {
  const powers = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4, PB: 5 };
  const power = powers[String(unit || '').toUpperCase()];
  if (power == null) return null;
  return Number(value) * (1024 ** power);
}

function parseBodyInfo(body) {
  const source = String(body || '').replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  const expireMatch = source.match(/(?:有效期|到期(?:时间)?|过期(?:时间)?)[：:\s]*([12]\d{3}[-/.]\d{1,2}[-/.]\d{1,2})/i);
  const remainingMatch = source.match(/剩余(?:流量)?[：:\s]*([0-9]+(?:\.[0-9]+)?)\s*(PB|TB|GB|MB|KB|B)/i);
  if (!remainingMatch) return null;

  const remaining = unitBytes(remainingMatch[1], remainingMatch[2]);
  if (!Number.isFinite(remaining)) return null;

  const totalMatch = source.match(/(?:总(?:流量|量)|套餐流量)[：:\s]*([0-9]+(?:\.[0-9]+)?)\s*(PB|TB|GB|MB|KB|B)/i);
  const usedMatch = source.match(/已用(?:流量)?[：:\s]*([0-9]+(?:\.[0-9]+)?)\s*(PB|TB|GB|MB|KB|B)/i);
  const total = totalMatch ? unitBytes(totalMatch[1], totalMatch[2]) : null;
  const explicitUsed = usedMatch ? unitBytes(usedMatch[1], usedMatch[2]) : null;
  const used = Number.isFinite(explicitUsed)
    ? explicitUsed
    : Number.isFinite(total)
      ? Math.max(0, total - remaining)
      : null;

  let expireAt = 0;
  if (expireMatch) {
    const normalized = expireMatch[1].replace(/[/.]/g, '-');
    const parsed = new Date(`${normalized}T23:59:59`);
    if (!Number.isNaN(parsed.getTime())) expireAt = parsed.getTime();
  }

  return {
    upload: null,
    download: null,
    total,
    used,
    remaining,
    unlimited: false,
    totalUnknown: !Number.isFinite(total),
    expireAt,
    partial: !Number.isFinite(total),
    source: 'body'
  };
}

// ---------------------------------------------------------------------------
// 节点数量识别（订阅正文为节点列表时用于展示「N 节点」）
// ---------------------------------------------------------------------------

function base64ToString(base64) {
  const cleaned = String(base64).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/=]/g, '');
  if (!cleaned) return '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xFF);
    }
  }
  return output;
}

const NODE_PROTOCOLS = [
  'vmess://', 'vless://', 'trojan://', 'hysteria2://', 'hysteria://',
  'hy2://', 'tuic://', 'ssr://', 'ss://', 'snell://', 'anytls://', 'wireguard://', 'wg://', 'socks5://', 'socks://', 'http://', 'https://'
];

function countProtocolLinks(text) {
  if (!text) return 0;
  let total = 0;
  for (const protocol of NODE_PROTOCOLS) {
    const re = protocol.startsWith('http') || protocol.startsWith('socks') ? new RegExp(`^\\s*${protocol}`, 'gm') : new RegExp(`(^|[^A-Za-z])${protocol}`, 'g');
    const matches = text.match(re);
    if (matches) total += matches.length;
  }
  return total;
}

function countClashProxies(text) {
  const flow = text.match(/^proxies:\s*\[([\s\S]*?)\]\s*$/m);
  if (flow) { const m = flow[1].match(/name:/g); return m ? m.length : 0; }
  const startMatch = text.match(/^proxies:[ \t]*(#.*)?$/m);
  if (!startMatch) return 0;
  const rest = text.slice(startMatch.index + startMatch[0].length);
  // 顶格 "- name:" 也属于 proxies 列表，只在遇到下一个顶级键时结束
  const endMatch = rest.match(/\n[^\s#\-][^\n]*:/);
  const section = endMatch ? rest.slice(0, endMatch.index) : rest;
  const nameMatches = section.match(/(^|\n)\s*-\s*(\{\s*)?['"]?name['"]?\s*:/g);
  return nameMatches ? nameMatches.length : 0;
}

// Surge / Loon / Quantumult X 等文本格式
function countSurgeLike(text) {
  let n = 0;
  const surge = text.match(/^\s*[^#;\n=]+=\s*(ss|ssr|vmess|vless|trojan|snell|tuic|hysteria2?|wireguard|anytls|socks5(-tls)?|https?)\s*,/gim);
  if (surge) n += surge.length;
  const qx = text.match(/^\s*(shadowsocks|vmess|vless|trojan|http|socks5)\s*=\s*[^,\n]+,/gim);
  if (qx) n += qx.length;
  return n;
}

function countNodes(bodyText) {
  if (!bodyText) return 0;
  const raw = String(bodyText);

  const direct = countProtocolLinks(raw);
  if (direct > 0) return direct;

  const clash = countClashProxies(raw);
  if (clash > 0) return clash;

  const surge = countSurgeLike(raw);
  if (surge > 0) return surge;

  const trimmed = raw.trim();
  if (trimmed.length > 20 && /^[A-Za-z0-9+/=_\-\s]+$/.test(trimmed)) {
    const decoded = base64ToString(trimmed);
    const decodedCount = countProtocolLinks(decoded) || countSurgeLike(decoded);
    if (decodedCount > 0) return decodedCount;
  }

  return 0;
}

async function fetchSubscription(ctx, url, customUA) {
  const userAgents = [...new Set([
    customUA,
    'clash.meta',
    'clash-verge/v2.2.3',
    'v2rayN/6.42',
    'Surge/5.0',
    'Quantumult%20X/1.5.0',
    'mihomo/1.18.10',
    'Shadowrocket/2070'
  ].filter(Boolean))];

  let denied = '';

  const extract = async response => {
    const headerData = parseUserInfo(readHeader(response?.headers, 'subscription-userinfo'));
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }
    const status = Number(response?.status || 0);
    if (!headerData && (status >= 400 || /访问被拒绝|IP\s*未授权|信任\s*IP/.test(bodyText))) {
      const m = bodyText.match(/当前\s*IP[：:]\s*(?:<[^>]+>\s*)*([0-9a-fA-F.:]+)/);
      denied = /IP\s*未授权|信任\s*IP/.test(bodyText)
        ? `机场拒绝：当前 IP${m ? ' ' + m[1] : ''} 未授权，去机场用户中心添加信任 IP`
        : `机场拒绝访问（HTTP ${status}），检查订阅链接是否失效`;
      return { traffic: null, nodeCount: 0 };
    }
    return {
      traffic: headerData || parseBodyInfo(bodyText),
      nodeCount: countNodes(bodyText)
    };
  };

  let bestNodeCount = 0;
  let succeeded = false;
  let foundTraffic = null;

  const deadline = Date.now() + 20000; // 总时长上限，避免超过脚本超时
  for (const userAgent of userAgents) {
    if (Date.now() > deadline) break;
    try {
      const response = await ctx.http.get(url, {
        timeout: 8000,
        redirect: 'manual',
        headers: { 'User-Agent': userAgent }
      });
      succeeded = true;

      if (foundTraffic && bestNodeCount > 0) break;
      const direct = await extract(response);
      bestNodeCount = Math.max(bestNodeCount, direct.nodeCount);
      if (direct.traffic && !foundTraffic) foundTraffic = direct.traffic;
      if (foundTraffic && bestNodeCount > 0) return { traffic: foundTraffic, nodeCount: bestNodeCount };
      if (foundTraffic) continue; // 有流量但没数出节点：换个客户端 UA 再取一次正文

      const location = readHeader(response.headers, 'location');
      if (location && response.status >= 300 && response.status < 400) {
        const target = new URL(location, url).toString();
        const redirected = await ctx.http.get(target, {
          timeout: 8000,
          redirect: 'follow',
          headers: { 'User-Agent': userAgent }
        });
        const final = await extract(redirected);
        bestNodeCount = Math.max(bestNodeCount, final.nodeCount);
        if (final.traffic && !foundTraffic) foundTraffic = final.traffic;
        if (foundTraffic && bestNodeCount > 0) return { traffic: foundTraffic, nodeCount: bestNodeCount };
      }
    } catch {
      // 换下一个常见客户端标识继续尝试
    }
  }

  if (!succeeded) throw new Error('订阅请求失败，请检查链接或网络');
  if (!foundTraffic && !bestNodeCount && denied) throw new Error(denied);
  return { traffic: foundTraffic, nodeCount: bestNodeCount };
}

// ---------------------------------------------------------------------------
// 订阅配置
// ---------------------------------------------------------------------------

const MAX_SUBS = 10;

function splitList(v) {
  return String(v || '').split(/\s*[|\n]\s*/).map(s => s.trim()).filter(Boolean);
}

function readSubs(ctx) {
  const env = ctx.env || {};
  const subs = [];
  // 方式一：SUB1_URL … SUB10_URL，各自可配名称 / 总量 / 重置日
  for (let i = 1; i <= MAX_SUBS; i += 1) {
    const url = String(env[`SUB${i}_URL`] || '').trim();
    if (!url) continue;
    subs.push({
      url,
      name: String(env[`SUB${i}_NAME`] || '').trim() || `订阅 ${i}`,
      planGB: String(env[`SUB${i}_TOTAL_GB`] || '').trim(),
      resetDay: String(env[`SUB${i}_RESET_DAY`] || '').trim(),
    });
  }
  // 方式二：SUBSCRIPTION_URL 用 | 或换行分隔多个地址，名称 / 重置日 / 总量同样用 | 对应
  const urls = splitList(env.SUBSCRIPTION_URL);
  const names = splitList(env.SUBSCRIPTION_NAME);
  const resets = splitList(env.RESET_DAY);
  const totals = splitList(env.PLAN_TOTAL_GB);
  urls.forEach((url, i) => {
    if (subs.some(s => s.url === url)) return;
    subs.push({
      url,
      name: names[i] || (urls.length === 1 && names[0]) || `订阅 ${subs.length + 1}`,
      planGB: totals[i] || totals[0] || '',
      resetDay: resets[i] || (urls.length === 1 ? resets[0] : '') || '',
    });
  });
  return subs.slice(0, MAX_SUBS);
}

// 仅在「机场没返回套餐总量 + 用户显式填了 SUBn_TOTAL_GB」时估算，绝不默认一个假的 100GB
function applyPlanTotal(sub, traffic) {
  const planGB = sub.planGB ? Number(sub.planGB) : NaN;
  if (!traffic || traffic.unlimited) return traffic;
  if (Number.isFinite(traffic.total) || !Number.isFinite(traffic.remaining)) return traffic;
  if (!Number.isFinite(planGB) || planGB <= 0) return traffic;
  const total = planGB * (1024 ** 3);
  return { ...traffic, total, used: Math.max(0, total - traffic.remaining), totalUnknown: false, partial: false, totalEstimated: true };
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// 今日已用：每天第一次刷新记下剩余量作为起点
function todayUsed(ctx, key, traffic) {
  if (!traffic || traffic.unlimited || !Number.isFinite(traffic.remaining)) return null;
  const k = `${key}.day`;
  const today = dayKey(new Date());
  let snap = null;
  try { snap = ctx.storage?.getJSON(k); } catch {}
  if (!snap || snap.date !== today || traffic.remaining > snap.start + 1048576) {
    snap = { date: today, start: traffic.remaining };
    try { ctx.storage?.setJSON(k, snap); } catch {}
  }
  const used = Math.max(0, snap.start - traffic.remaining);
  // 近 7 天每日用量历史
  const hk = `${key}.hist`;
  let hist = {};
  try { hist = ctx.storage?.getJSON(hk) || {}; } catch {}
  hist[today] = used;
  const keep = {};
  for (let i = 0; i < 8; i++) { const d = dayKey(new Date(Date.now() - i * 86400000)); if (hist[d] != null) keep[d] = hist[d]; }
  try { ctx.storage?.setJSON(hk, keep); } catch {}
  return used;
}

function readHist(ctx, key) {
  let hist = {};
  try { hist = ctx.storage?.getJSON(`${key}.hist`) || {}; } catch {}
  const arr = [];
  for (let i = 6; i >= 0; i--) { const d = dayKey(new Date(Date.now() - i * 86400000)); arr.push(hist[d] == null ? null : hist[d]); }
  return arr; // 旧 → 今天
}

async function loadOne(ctx, sub) {
  const key = storageKey(sub.url);
  const ua = String(ctx.env?.SUBSCRIPTION_USER_AGENT || '').trim();
  try {
    const fetched = await fetchSubscription(ctx, sub.url, ua);
    let prev = null;
    try { prev = ctx.storage?.getJSON(key); } catch {}
    // 本次没数到节点时沿用上次成功数到的节点数
    if (!(fetched.nodeCount > 0) && prev?.nodeCount > 0) fetched.nodeCount = prev.nodeCount;
    // 上次有流量、这次没拿到：别用「仅节点」覆盖，走缓存并提示
    if (!fetched.traffic && prev?.traffic) throw new Error('本次机场未返回用量，显示上次数据');
    if (fetched.traffic) {
      const result = { mode: 'live', traffic: applyPlanTotal(sub, fetched.traffic), nodeCount: fetched.nodeCount, updatedAt: Date.now() };
      ctx.storage?.setJSON(key, result);
      const today = todayUsed(ctx, key, result.traffic);
      return { ...sub, ...result, today, hist: readHist(ctx, key) };
    }
    if (fetched.nodeCount > 0) {
      const result = { mode: 'nodesOnly', nodeCount: fetched.nodeCount, updatedAt: Date.now() };
      ctx.storage?.setJSON(key, result);
      return { ...sub, ...result };
    }
    throw new Error('订阅未返回可识别的流量信息');
  } catch (error) {
    const msg = String(error?.message || error || '加载失败');
    const cached = ctx.storage?.getJSON(key);
    if (cached && (cached.traffic || cached.nodeCount)) {
      const today = cached.traffic ? todayUsed(ctx, key, cached.traffic) : null;
      return { ...sub, ...cached, mode: 'stale', error: msg, today, hist: readHist(ctx, key) };
    }
    return { ...sub, mode: 'error', error: msg };
  }
}

async function loadAll(ctx) {
  const subs = readSubs(ctx);
  if (!subs.length) return [];
  return Promise.all(subs.map(s => loadOne(ctx, s)));
}

// ---------------------------------------------------------------------------
// 计算
// ---------------------------------------------------------------------------

function daysUntil(ts) {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / 86400000);
}

function nextReset(resetDayStr) {
  const resetDay = Number(resetDayStr);
  if (!resetDayStr || !Number.isFinite(resetDay) || resetDay < 1 || resetDay > 31) return null;
  const now = new Date();
  const last = (y, m) => new Date(y, m + 1, 0).getDate();
  let y = now.getFullYear(), m = now.getMonth();
  let d = Math.min(resetDay, last(y, m));
  if (now.getDate() > d) { m += 1; if (m > 11) { m = 0; y += 1; } d = Math.min(resetDay, last(y, m)); }
  const target = new Date(y, m, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { days: Math.max(0, Math.round((target - today) / 86400000)), date: target.getTime() };
}

function pctLeft(t) {
  if (!t || t.unlimited || !Number.isFinite(t.total) || t.total <= 0) return null;
  if (!Number.isFinite(t.remaining)) return null;
  return Math.max(0, Math.min(1, t.remaining / t.total));
}

// 剩余量是否已知（不限量、总量未知都不算「已知剩余」）
function remainKnown(t) {
  return !!t && (t.unlimited === true || Number.isFinite(t.remaining));
}

// 圆环 / 进度条比例：不限量画满，未知画空，不用假的 100% 冒充
function ringPct(t) {
  if (!t) return 0;
  if (t.unlimited) return 1;
  const p = pctLeft(t);
  return p == null ? 0 : p;
}

function pctLabel(t) {
  if (!t) return '--';
  if (t.unlimited) return '∞';
  const p = pctLeft(t);
  return p == null ? '未知' : `${Math.round(p * 100)}%`;
}

// 主数值标题：剩余量已知显示「剩余流量」，只有已用量时退回「已用流量」
function valueTitle(t) {
  return remainKnown(t) ? '剩余流量' : '已用流量';
}

function totalLabel(t) {
  if (!t) return '--';
  if (t.unlimited) return '不限量';
  if (!Number.isFinite(t.total)) return '未知';
  return `${t.totalEstimated ? '≈' : ''}${fmtBytes(t.total)}`;
}

function fmtBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes)) return '--';
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / (1024 ** i);
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? Math.min(1, decimals) : decimals)} ${units[i]}`;
}

function splitBytes(bytes) {
  const s = fmtBytes(bytes);
  const k = s.lastIndexOf(' ');
  return k > 0 ? { n: s.slice(0, k), u: s.slice(k + 1) } : { n: s, u: '' };
}

function fmtDate(ts) {
  if (!ts) return '长期有效';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(ts) {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 月底 / 重置 / 到期 中最近的一个，用于算「日均可用」
function dailyBudget(s) {
  const t = s.traffic;
  if (!t || t.unlimited || !Number.isFinite(t.remaining)) return null;
  const cands = [];
  const r = nextReset(s.resetDay);
  if (r) cands.push(Math.max(1, r.days));
  const e = daysUntil(t.expireAt);
  if (e != null && e > 0) cands.push(e);
  if (!cands.length) return null;
  return t.remaining / Math.min(...cands);
}

// 按近 7 天（不含今天）平均用量预测还能用多少天
function forecast(s) {
  const t = s.traffic;
  if (!t) return { text: '--', color: C.dim };
  if (t.unlimited) return { text: '不限量', color: C.ok };
  if (!Number.isFinite(t.remaining)) return { text: '剩余未知', color: C.dim };
  const past = (s.hist || []).slice(0, 6).filter(v => v != null && v > 0);
  const vals = past.length ? past : (s.today > 0 ? [s.today] : []);
  if (!vals.length) return { text: '用量统计中…', color: C.dim };
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const days = Math.floor(t.remaining / avg);
  const r = nextReset(s.resetDay);
  const e = daysUntil(t.expireAt);
  const limit = Math.min(...[r ? r.days : Infinity, e != null ? e : Infinity]);
  if (days > 999) return { text: '按近期速度 充足', color: C.ok };
  if (Number.isFinite(limit) && days >= limit) return { text: `预计够用 ${days} 天 ✓`, color: C.ok };
  if (Number.isFinite(limit)) return { text: `约 ${days} 天用完 · 早于重置`, color: C.warn };
  return { text: `预计还能用 ${days} 天`, color: days <= 7 ? C.warn : C.ok };
}

function status(s) {
  if (s.mode === 'error') return { label: '失败', color: C.fail };
  if (s.mode === 'stale') return { label: '缓存', color: C.warn };
  if (s.mode === 'nodesOnly') return { label: '节点', color: C.accent };
  const t = s.traffic;
  const days = daysUntil(t.expireAt);
  const p = pctLeft(t);
  if ((Number.isFinite(t.remaining) && t.remaining <= 0) || (days != null && days <= 0)) return { label: '已到期', color: C.fail };
  if ((p != null && p <= 0.2) || (days != null && days <= 7)) return { label: '偏低', color: C.warn };
  return { label: '正常', color: C.ok };
}

// ---------------------------------------------------------------------------
// 视觉：iOS 液态玻璃
// ---------------------------------------------------------------------------

const PALETTE = ['#BF5AF2', '#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#5E5CE6', '#64D2FF', '#FFD60A', '#AC8E68', '#FF6482'];

const C = {
  text: { light: '#000000', dark: '#FFFFFF' },
  dim:  { light: '#3C3C4399', dark: '#EBEBF599' },
  glass: { light: '#FFFFFFA6', dark: '#FFFFFF1A' },
  accent: '#BF5AF2',
  ok: '#30D158',
  warn: '#FF9F0A',
  fail: '#FF453A',
};

function bg() {
  return {
    type: 'linear',
    colors: [{ light: '#F3EEFF', dark: '#1A0F33' }, { light: '#EEF4FF', dark: '#0B1530' }, { light: '#F2FBF7', dark: '#06120E' }],
    stops: [0, 0.55, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function svgUri(svg) { return 'data:image/svg+xml,' + encodeURIComponent(svg); }

// 本地 SVG 圆环，不依赖外部图片服务（更快、离线可用）
function ringsSvg(values, size, stroke, gap) {
  const h = size / 2;
  let body = '';
  values.forEach((v, i) => {
    const r = h - stroke / 2 - i * (stroke + gap);
    if (r <= stroke / 2) return;
    const p = Math.max(0, Math.min(1, Number(v.pct) || 0));
    body += `<circle cx='${h}' cy='${h}' r='${r.toFixed(2)}' fill='none' stroke='${v.color}' stroke-opacity='0.22' stroke-width='${stroke}'/>`;
    if (p > 0) {
      // 用 path 圆弧绘制进度，不依赖 stroke-dasharray
      if (p >= 0.999) {
        body += `<circle cx='${h}' cy='${h}' r='${r.toFixed(2)}' fill='none' stroke='${v.color}' stroke-width='${stroke}'/>`;
      } else {
        const a = p * 2 * Math.PI;
        const x = (h + r * Math.sin(a)).toFixed(2), y = (h - r * Math.cos(a)).toFixed(2);
        body += `<path d='M ${h} ${(h - r).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${p > 0.5 ? 1 : 0} 1 ${x} ${y}' fill='none' stroke='${v.color}' stroke-width='${stroke}' stroke-linecap='round'/>`;
      }
    }
  });
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>${body}</svg>`);
}

// 半圆仪表
function gaugeSvg(pct, color, w) {
  const stroke = 12, r = (w - stroke) / 2, cx = w / 2, cy = w / 2, h = w / 2 + stroke / 2;
  const p = Math.max(0, Math.min(1, Number(pct) || 0));
  const pt = a => [(cx - r * Math.cos(a)).toFixed(2), (cy - r * Math.sin(a)).toFixed(2)];
  const [x0, y0] = pt(0), [x1, y1] = pt(Math.PI), [xp, yp] = pt(Math.PI * p);
  let body = `<path d='M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}' fill='none' stroke='${color}' stroke-opacity='0.22' stroke-width='${stroke}' stroke-linecap='round'/>`;
  if (p > 0.005) body += `<path d='M ${x0} ${y0} A ${r} ${r} 0 0 1 ${xp} ${yp}' fill='none' stroke='${color}' stroke-width='${stroke}' stroke-linecap='round'/>`;
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>${body}</svg>`);
}

// 近 7 天用量柱状图（最后一根是今天）
function sparkSvg(values, color, w, h) {
  const n = values.length, gap = 3, bw = (w - gap * (n - 1)) / n;
  const max = Math.max(1, ...values.map(v => v || 0));
  let body = '';
  values.forEach((v, i) => {
    const x = (i * (bw + gap)).toFixed(1);
    const bh = v ? Math.max(2, (v / max) * h) : 2;
    const op = v == null ? 0.15 : (i === n - 1 ? 1 : 0.55);
    body += `<rect x='${x}' y='${(h - bh).toFixed(1)}' width='${bw.toFixed(1)}' height='${bh.toFixed(1)}' rx='${Math.min(2, bw / 2).toFixed(1)}' fill='${color}' fill-opacity='${op}'/>`;
  });
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>${body}</svg>`);
}

// 近 7 天分组柱状图（多订阅大号用）
function weekSvg(list, w, h) {
  const n = 7, groupGap = 10, m = list.length || 1;
  const gw = (w - groupGap * (n - 1)) / n;
  const bw = Math.max(2, (gw - 2 * (m - 1)) / m);
  const vals = list.map(s => (s.hist || [null, null, null, null, null, null, s.today]).map(v => v || 0));
  const max = Math.max(1, ...vals.flat());
  let body = '';
  for (let d = 0; d < n; d++) {
    list.forEach((s, k) => {
      const v = vals[k][d] || 0;
      const bh = v ? Math.max(2, (v / max) * (h - 1)) : 2;
      const x = d * (gw + groupGap) + k * (bw + 2);
      const op = v ? (d === n - 1 ? 1 : 0.6) : 0.15;
      body += `<rect x='${x.toFixed(1)}' y='${(h - bh).toFixed(1)}' width='${bw.toFixed(1)}' height='${bh.toFixed(1)}' rx='${Math.min(2.5, bw / 2).toFixed(1)}' fill='${colorOf(k)}' fill-opacity='${op}'/>`;
    });
  }
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>${body}</svg>`);
}

function barSvg(pct, color, w, h) {
  const p = Math.max(0, Math.min(1, Number(pct) || 0));
  const r = h / 2, fw = p > 0 ? Math.max(h, w * p) : 0;
  return svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' rx='${r}' fill='${color}' fill-opacity='0.2'/>` +
    (fw ? `<rect width='${fw.toFixed(1)}' height='${h}' rx='${r}' fill='${color}'/>` : '') + `</svg>`);
}

function T(value, size, color, weight = 'regular', extra = {}) {
  return { type: 'text', text: String(value), font: { size, weight }, textColor: color || C.text, maxLines: 1, minScale: 0.6, ...extra };
}

function icon(name, color, size = 12) {
  return { type: 'image', src: `sf-symbol:${name}`, width: size, height: size, color };
}

function dot(color) {
  return { type: 'stack', width: 6, height: 6, borderRadius: 3, backgroundColor: color, children: [] };
}

function glass(children, extra = {}) {
  return { type: 'stack', direction: 'column', alignItems: 'start', gap: 6, padding: 12, borderRadius: 20, backgroundColor: C.glass, children, ...extra };
}

function colorOf(i) { return PALETTE[i % PALETTE.length]; }

function lastUpdated(list) {
  const ts = Math.max(0, ...list.map(s => s.updatedAt || 0));
  return ts ? fmtTime(ts) : '--';
}

function header(list, title) {
  const bad = list.filter(s => status(s).color !== C.ok).length;
  return {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 5,
    children: [
      icon('chart.pie.fill', C.accent, 13),
      T(title, 13, C.text, 'semibold'),
      { type: 'spacer' },
      ...(bad ? [dot(C.warn)] : []),
      T(`更新 ${lastUpdated(list)}`, 10, C.dim),
    ],
  };
}

function bigRemain(t, size) {
  const b = splitBytes(remainKnown(t) ? t.remaining : t.used);
  return {
    type: 'stack', direction: 'row', alignItems: 'end', gap: 2,
    children: [T(b.n, size, C.text, 'bold'), T(b.u, Math.round(size * 0.45), C.dim, 'semibold')],
  };
}

function subLine(s) {
  const t = s.traffic;
  const parts = [];
  const e = daysUntil(t.expireAt);
  parts.push(e == null ? '长期有效' : `到期 ${Math.max(0, e)} 天`);
  const r = nextReset(s.resetDay);
  if (r) parts.push(r.days === 0 ? '今日重置' : `重置 ${r.days} 天`);
  if (s.nodeCount > 0) parts.push(`${s.nodeCount} 节点`);
  return parts.join(' · ');
}

// 一条订阅的行（多订阅列表用）
function subRow(s, i, barW, opts = {}) {
  const color = colorOf(i);
  const st = status(s);
  if (!s.traffic) {
    return {
      type: 'stack', direction: 'column', alignItems: 'start', gap: 4,
      children: [
        { type: 'stack', direction: 'row', alignItems: 'center', gap: 5, children: [dot(color), T(s.name, 12, C.text, 'semibold'), { type: 'spacer' }, T(st.label, 10, st.color, 'semibold')] },
        T(s.nodeCount > 0 ? `${s.nodeCount} 节点 · 未提供流量信息` : (s.error || '读取失败'), 10, C.dim),
      ],
    };
  }
  const t = s.traffic;
  const p = pctLeft(t);
  return {
    type: 'stack', direction: 'column', alignItems: 'start', gap: 4,
    children: [
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 5,
        children: [
          dot(st.color === C.ok ? color : st.color),
          T(s.name, 12, C.text, 'semibold'),
          { type: 'spacer' },
          T(fmtBytes(remainKnown(t) ? t.remaining : t.used), opts.valueSize || 14, C.text, 'bold'),
          T(`  ${pctLabel(t)}`, 10, color, 'semibold'),
        ],
      },
      { type: 'image', src: barSvg(ringPct(t), color, barW, opts.barH || 4), width: barW, height: opts.barH || 4 },
      ...(opts.detail ? [T(subLine(s) + (s.today != null ? ` · 今日 ${fmtBytes(s.today)}` : ''), 10, C.dim)] : []),
    ],
  };
}

function refreshAt(ctx) {
  const v = Number(ctx.env?.REFRESH_HOURS);
  const h = Number.isFinite(v) ? Math.min(24, Math.max(0.5, v)) : 2;
  return new Date(Date.now() + h * 3600000).toISOString();
}

function titleOf(ctx, list) {
  const t = String(ctx.env?.WIDGET_TITLE || '').trim();
  if (t) return t;
  return list.length === 1 ? list[0].name : '订阅流量';
}

function emptyWidget(ctx, message, sub) {
  return {
    type: 'widget', padding: 16, gap: 8, backgroundGradient: bg(),
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 5, children: [icon('chart.pie.fill', C.accent, 13), T('订阅流量', 13, C.text, 'semibold')] },
      { type: 'spacer' },
      icon('link.badge.plus', C.dim, 22),
      T(message, 14, C.text, 'semibold'),
      T(sub, 10, C.dim, 'regular', { maxLines: 3 }),
      { type: 'spacer' },
    ],
  };
}

/* ---------- 单订阅 ---------- */

function singleSmall(ctx, s) {
  const t = s.traffic;
  const p = pctLeft(t);
  return {
    type: 'widget', padding: 14, gap: 6, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 5, children: [icon('chart.pie.fill', C.accent, 12), T(s.name, 12, C.text, 'semibold'), { type: 'spacer' }, dot(status(s).color)] },
      { type: 'spacer' },
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 8,
        children: [
          { type: 'stack', direction: 'column', alignItems: 'start', gap: 0, children: [T(valueTitle(t), 10, C.dim, 'medium'), bigRemain(t, 24)] },
          { type: 'spacer' },
          { type: 'image', src: ringsSvg([{ pct: ringPct(t), color: C.accent }], 100, 14, 0), width: 44, height: 44 },
        ],
      },
      { type: 'spacer' },
      T(subLine(s), 10, C.dim),
      T(s.today != null ? `今日已用 ${fmtBytes(s.today)}` : `更新 ${fmtTime(s.updatedAt)}`, 10, C.dim),
    ],
  };
}

function singleMedium(ctx, s) {
  const t = s.traffic;
  const p = pctLeft(t);
  const daily = dailyBudget(s);
  const kv = (k, v) => ({ type: 'stack', direction: 'column', alignItems: 'start', gap: 1, flex: 1, children: [T(k, 10, C.dim), T(v, 13, C.text, 'semibold')] });
  return {
    type: 'widget', padding: 14, gap: 8, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [
      header([s], s.name),
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 12, flex: 1,
        children: [
          {
            type: 'stack', direction: 'column', alignItems: 'center', gap: 2, width: 96,
            children: [
              { type: 'image', src: ringsSvg([{ pct: ringPct(t), color: C.accent }], 120, 14, 0), width: 78, height: 78 },
              T(t.unlimited ? '不限量' : (p == null ? '总量未知' : `剩 ${Math.round(p * 100)}%`), 11, C.accent, 'semibold'),
            ],
          },
          glass([
            T(valueTitle(t), 10, C.dim, 'medium'),
            bigRemain(t, 26),
            { type: 'stack', direction: 'row', gap: 8, children: [kv('已用', fmtBytes(t.used)), kv('总量', totalLabel(t)), kv('日均可用', daily == null ? '--' : fmtBytes(daily))] },
            T(subLine(s) + (s.today != null ? ` · 今日 ${fmtBytes(s.today)}` : ''), 10, C.dim),
          ], { flex: 1, gap: 4 }),
        ],
      },
    ],
  };
}

function singleLarge(ctx, s) {
  const t = s.traffic;
  const p = pctLeft(t);
  const daily = dailyBudget(s);
  const r = nextReset(s.resetDay);
  const cell = (k, v, c) => glass([T(k, 10, C.dim, 'medium'), T(v, 15, c || C.text, 'bold')], { flex: 1, padding: [10, 12, 10, 12], borderRadius: 16, gap: 3 });
  return {
    type: 'widget', padding: 16, gap: 10, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [
      header([s], s.name),
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 14,
        children: [
          { type: 'image', src: ringsSvg([{ pct: ringPct(t), color: C.accent }], 140, 16, 0), width: 96, height: 96 },
          { type: 'stack', direction: 'column', alignItems: 'start', gap: 2, children: [T(valueTitle(t), 11, C.dim, 'medium'), bigRemain(t, 34), T(p == null ? `状态 ${status(s).label}` : `剩余 ${Math.round(p * 100)}% · 状态 ${status(s).label}`, 11, C.accent, 'semibold')] },
          { type: 'spacer' },
        ],
      },
      { type: 'image', src: barSvg(ringPct(t), C.accent, 300, 6), width: 300, height: 6 },
      { type: 'stack', direction: 'row', gap: 8, children: [cell('下载', Number.isFinite(t.download) ? fmtBytes(t.download) : '--'), cell('上传', Number.isFinite(t.upload) ? fmtBytes(t.upload) : '--'), cell('今日已用', s.today == null ? '--' : fmtBytes(s.today))] },
      { type: 'stack', direction: 'row', gap: 8, children: [cell('套餐总量', totalLabel(t)), cell('日均可用', daily == null ? '--' : fmtBytes(daily), C.ok), cell('节点', s.nodeCount > 0 ? `${s.nodeCount} 个` : '--')] },
      { type: 'stack', direction: 'row', gap: 8, children: [cell('套餐到期', fmtDate(t.expireAt)), cell('流量重置', r ? (r.days === 0 ? '今日' : `${r.days} 天后`) : '--', C.accent)] },
      { type: 'spacer' },
    ],
  };
}

/* ---------- 多订阅 ---------- */

function multiSmall(ctx, list) {
  const shown = list.slice(0, 3);
  const withT = shown.filter(s => s.traffic && !s.traffic.unlimited && Number.isFinite(s.traffic.remaining));
  const sumRemain = withT.reduce((a, s) => a + s.traffic.remaining, 0);
  const sumToday = shown.reduce((a, s) => a + (s.today || 0), 0);
  const two = shown.length <= 2;
  return {
    type: 'widget', padding: 14, gap: two ? 7 : 8, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [
      { type: 'stack', direction: 'row', alignItems: 'center', gap: 5, children: [icon('chart.pie.fill', C.accent, 12), T(titleOf(ctx, list), 12, C.text, 'semibold'), { type: 'spacer' }, T(lastUpdated(list), 9, C.dim)] },
      ...(two ? [{ type: 'stack', direction: 'column', alignItems: 'start', gap: 0, children: [T('合计剩余', 9, C.dim, 'medium'), bigRemain(withT.length ? { remaining: sumRemain } : {}, 24)] }] : []),
      { type: 'spacer' },
      ...shown.map((s, i) => subRow(s, i, 126, { valueSize: 12, barH: 3 })),
      { type: 'spacer' },
      T(list.length > 3 ? `共 ${list.length} 个 · 今日 ${fmtBytes(sumToday)}` : `今日已用 ${fmtBytes(sumToday)}`, 10, C.accent, 'semibold'),
    ],
  };
}

// 详情卡（两订阅中号 / 大号网格共用）
function detailCard(s, i, o = {}) {
  const F = { name: o.name || 11, big: o.big || 19, small: o.small || 9 };
  const CARD = { flex: 1, height: o.height || 108, gap: o.gap || 2, padding: o.padding || [7, 9, 7, 9], borderRadius: 16 };
  const t9 = (txt, c, w) => T(txt, F.small, c || C.dim, w || 'medium', { minScale: 1 });
  const color = colorOf(i);
  const st = status(s);
  const right = st.color !== C.ok && s.traffic ? t9(st.label, st.color, 'semibold') : t9(s.nodeCount > 0 ? `${s.nodeCount} 节点` : '-- 节点');
  const head = {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 4,
    children: [dot(st.color === C.ok ? color : st.color), T(s.name, F.name, C.text, 'semibold', { minScale: 1 }), { type: 'spacer' }, right],
  };
  if (!s.traffic) return glass([head, { type: 'spacer' }, T('读取失败', 13, C.dim, 'semibold', { minScale: 1 }), t9(s.error || '稍后自动重试'), { type: 'spacer' }], CARD);
  const t = s.traffic;
  const p = pctLeft(t);
  const daily = dailyBudget(s);
  const e = daysUntil(t.expireAt);
  const r = nextReset(s.resetDay);
  const b = splitBytes(remainKnown(t) ? t.remaining : t.used);
  const fc = forecast(s);
  return glass([
    head,
    {
      type: 'stack', direction: 'row', alignItems: 'end', gap: 4,
      children: [
        {
          type: 'stack', direction: 'column', alignItems: 'start', gap: 0,
          children: [
            { type: 'stack', direction: 'row', alignItems: 'end', gap: 2, children: [T(b.n, F.big, C.text, 'bold', { minScale: 1 }), T(b.u, F.small, C.dim, 'semibold', { minScale: 1 })] },
            T(remainKnown(t) ? `已用 ${fmtBytes(t.used)} / ${totalLabel(t)}` : `已用 ${fmtBytes(t.used)} · 总量未知`, F.small, C.dim, 'medium', { minScale: 0.7 }),
          ],
        },
        { type: 'spacer' },
        {
          type: 'stack', direction: 'column', alignItems: 'center', gap: -4,
          children: [
            { type: 'image', src: gaugeSvg(ringPct(t), color, 64), width: 40, height: 23 },
            T(pctLabel(t), F.small, color, 'bold', { minScale: 1 }),
          ],
        },
      ],
    },
    {
      type: 'stack', direction: 'row', alignItems: 'end', gap: 5,
      children: [
        { type: 'image', src: sparkSvg(s.hist || [null, null, null, null, null, null, s.today], color, 70, 14), width: 52, height: 12 },
        t9(`今日 ${s.today == null ? '--' : fmtBytes(s.today)}`, C.text, 'semibold'),
      ],
    },
    t9(`日均可用 ${daily == null ? '--' : fmtBytes(daily)}`),
    t9(fc.text, fc.color, 'semibold'),
    t9(`${e == null ? '长期有效' : `到期 ${Math.max(0, e)} 天`} · ${r ? (r.days === 0 ? '今日重置' : `重置 ${r.days} 天`) : '不重置'}`),
  ], CARD);
}

// 紧凑卡（三订阅中号）：窄列，信息精简
function compactCard(s, i) {
  const color = colorOf(i);
  const st = status(s);
  const t8 = (txt, c, w) => T(txt, 8.5, c || C.dim, w || 'medium', { minScale: 0.8 });
  const CARD = { flex: 1, height: 108, gap: 2, padding: [7, 8, 7, 8], borderRadius: 16 };
  const head = {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 3,
    children: [dot(st.color === C.ok ? color : st.color), T(s.name, 10, C.text, 'semibold', { minScale: 0.8 })],
  };
  if (!s.traffic) return glass([head, { type: 'spacer' }, T('读取失败', 12, C.dim, 'semibold'), t8(s.error || '稍后重试'), { type: 'spacer' }], CARD);
  const t = s.traffic;
  const p = pctLeft(t);
  const b = splitBytes(remainKnown(t) ? t.remaining : t.used);
  const fc = forecast(s);
  const e = daysUntil(t.expireAt);
  const r = nextReset(s.resetDay);
  return glass([
    head,
    {
      type: 'stack', direction: 'row', alignItems: 'end', gap: 2,
      children: [
        T(b.n, 17, C.text, 'bold', { minScale: 0.7 }), T(b.u, 8.5, C.dim, 'semibold', { minScale: 1 }),
        { type: 'spacer' },
        T(pctLabel(t), 9, color, 'bold', { minScale: 1 }),
      ],
    },
    { type: 'image', src: barSvg(ringPct(t), color, 90, 4), width: 84, height: 4 },
    {
      type: 'stack', direction: 'row', alignItems: 'end', gap: 3,
      children: [
        { type: 'image', src: sparkSvg(s.hist || [null, null, null, null, null, null, s.today], color, 70, 14), width: 30, height: 10 },
        t8(`今日 ${s.today == null ? '--' : fmtBytes(s.today)}`, C.text, 'semibold'),
      ],
    },
    t8(fc.text, fc.color, 'semibold'),
    t8(`${e == null ? '长期' : `到期${Math.max(0, e)}天`}${r ? (r.days === 0 ? '·今日重置' : `·重置${r.days}天`) : ''}`),
  ], CARD);
}

// 密集网格单元：按可用高度自动选择信息密度（5 个及以上订阅用）
function miniCell(s, i, h) {
  const color = colorOf(i);
  const st = status(s);
  const t = s.traffic;
  const wrap = children => glass(children, { flex: 1, height: h, gap: h >= 44 ? 2 : 1, padding: h >= 34 ? [4, 7, 4, 7] : [2, 6, 2, 6], borderRadius: 12 });

  if (!t) {
    return wrap([
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 3,
        children: [dot(st.color), T(s.name, 9, C.text, 'semibold', { minScale: 0.6 }), { type: 'spacer' }, T(s.nodeCount > 0 ? `${s.nodeCount} 节点` : st.label, 8, st.color, 'semibold', { minScale: 0.6 })],
      },
      ...(h >= 34 ? [{ type: 'spacer' }, T(s.nodeCount > 0 ? '未返回流量信息' : (s.error || '读取失败'), 8, C.dim, 'medium', { maxLines: 2, minScale: 0.6 })] : []),
    ]);
  }

  const p = pctLeft(t);
  const pctText = pctLabel(t);
  const head = {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 3,
    children: [dot(st.color === C.ok ? color : st.color), T(s.name, h >= 34 ? 10 : 9, C.text, 'semibold', { minScale: 0.6 }), { type: 'spacer' }, T(pctText, 9, color, 'semibold', { minScale: 0.6 })],
  };

  // 高度不够：压成单行
  if (h < 24) {
    return wrap([{
      type: 'stack', direction: 'row', alignItems: 'center', gap: 3,
      children: [dot(st.color === C.ok ? color : st.color), T(s.name, 9, C.text, 'semibold', { minScale: 0.5 }), { type: 'spacer' }, T(fmtBytes(remainKnown(t) ? t.remaining : t.used), 10, C.text, 'bold', { minScale: 0.5 }), T(pctText, 8, color, 'semibold', { minScale: 0.5 })],
    }]);
  }

  const b = splitBytes(remainKnown(t) ? t.remaining : t.used);
  const children = [head];
  if (h >= 34) {
    children.push({
      type: 'stack', direction: 'row', alignItems: 'end', gap: 2,
      children: [
        T(b.n, h >= 60 ? 18 : 14, C.text, 'bold', { minScale: 0.6 }),
        T(b.u, 8, C.dim, 'semibold', { minScale: 0.6 }),
        { type: 'spacer' },
        T(s.today == null ? '' : `今日 ${fmtBytes(s.today)}`, 8, C.dim, 'medium', { minScale: 0.5 }),
      ],
    });
    children.push({ type: 'image', src: barSvg(ringPct(t), color, 120, 3), width: 120, height: 3 });
    if (h >= 80) {
      const e = daysUntil(t.expireAt);
      const r = nextReset(s.resetDay);
      children.push(T(remainKnown(t) ? `已用 ${fmtBytes(t.used)} / ${totalLabel(t)}` : `已用 ${fmtBytes(t.used)} · 总量未知`, 8, C.dim, 'medium', { minScale: 0.5 }));
      children.push(T(`${e == null ? '长期有效' : `到期 ${Math.max(0, e)} 天`}${r ? (r.days === 0 ? ' · 今日重置' : ` · 重置 ${r.days} 天`) : ''}`, 8, C.dim, 'medium', { minScale: 0.5 }));
    }
  } else {
    children.push({
      type: 'stack', direction: 'row', alignItems: 'end', gap: 2,
      children: [T(b.n, 13, C.text, 'bold', { minScale: 0.6 }), T(b.u, 8, C.dim, 'semibold', { minScale: 0.6 }), { type: 'spacer' }, T(s.today == null ? '' : fmtBytes(s.today), 8, C.dim, 'medium', { minScale: 0.5 })],
    });
  }
  return wrap(children);
}

// 双列密集网格（5~10 个订阅）
function denseGrid(ctx, list, family) {
  const large = family !== 'systemMedium';
  const rows = Math.ceil(list.length / 2);
  const inner = large ? 272 : 116;
  const gap = large ? 6 : 4;
  const cellH = Math.max(18, Math.min(large ? 100 : 40, Math.floor((inner - gap * (rows - 1)) / rows)));

  const cells = list.map((s, i) => miniCell(s, i, cellH));
  if (cells.length % 2 === 1) cells.push({ type: 'stack', flex: 1, height: cellH, children: [] });

  const rowEls = [];
  for (let k = 0; k < cells.length; k += 2) {
    rowEls.push({ type: 'stack', direction: 'row', alignItems: 'start', gap, height: cellH, children: cells.slice(k, k + 2) });
  }

  const withT = list.filter(s => s.traffic && !s.traffic.unlimited && Number.isFinite(s.traffic.remaining));
  const sumRemain = withT.reduce((a, s) => a + s.traffic.remaining, 0);
  const sumToday = list.reduce((a, s) => a + (s.today || 0), 0);

  return {
    type: 'widget', padding: large ? [10, 12, 10, 12] : [6, 8, 6, 8], gap: 5, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [
      header(list, titleOf(ctx, list)),
      ...(large ? [{
        type: 'stack', direction: 'row', alignItems: 'end', gap: 5,
        children: [
          T(`${list.length} 个订阅 剩余`, 10, C.dim, 'medium'),
          bigRemain(withT.length ? { remaining: sumRemain } : {}, 18),
          { type: 'spacer' },
          T(`今日 ${fmtBytes(sumToday)}`, 10, C.accent, 'semibold'),
        ],
      }] : []),
      ...rowEls,
    ],
  };
}

function multiMedium(ctx, list) {
  const n = list.length;
  if (n === 2) {
    return {
      type: 'widget', padding: [9, 11, 9, 11], gap: 5, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
      children: [header(list, titleOf(ctx, list)), { type: 'stack', direction: 'row', gap: 7, flex: 1, children: list.map((s, i) => detailCard(s, i)) }],
    };
  }
  if (n === 3) {
    return {
      type: 'widget', padding: [9, 11, 9, 11], gap: 5, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
      children: [header(list, titleOf(ctx, list)), { type: 'stack', direction: 'row', gap: 6, flex: 1, children: list.map((s, i) => compactCard(s, i)) }],
    };
  }
  if (n === 4) {
    const shown = list.slice(0, 4);
    return {
      type: 'widget', padding: 14, gap: 8, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
      children: [
        header(list, titleOf(ctx, list)),
        {
          type: 'stack', direction: 'row', alignItems: 'center', gap: 12, flex: 1,
          children: [
            { type: 'image', src: ringsSvg(shown.map((s, i) => ({ pct: ringPct(s.traffic), color: colorOf(i) })), 120, 12, 3), width: 80, height: 80 },
            glass(shown.map((s, i) => subRow(s, i, 190, { valueSize: 12, barH: 3 })), { flex: 1, gap: 5, padding: [8, 12, 8, 12] }),
          ],
        },
      ],
    };
  }
  return denseGrid(ctx, list, 'systemMedium');
}

function weekCard(shown, height) {
  const now = new Date();
  const wk = ['日', '一', '二', '三', '四', '五', '六'];
  const labels = [];
  for (let i = 6; i >= 0; i--) labels.push(i === 0 ? '今' : wk[new Date(now.getTime() - i * 86400000).getDay()]);
  const legend = shown.map((s, i) => ({ type: 'stack', direction: 'row', alignItems: 'center', gap: 3, children: [dot(colorOf(i)), T(s.name, 9, C.dim, 'medium', { minScale: 1 })] }));
  const week = shown.reduce((a, s) => a + (s.hist || []).reduce((x, v) => x + (v || 0), 0), 0);
  return glass([
    {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
      children: [T('近 7 天用量', 11, C.text, 'semibold', { minScale: 1 }), T(`共 ${fmtBytes(week)}`, 10, C.accent, 'semibold', { minScale: 1 }), { type: 'spacer' }, ...legend],
    },
    { type: 'spacer' },
    { type: 'image', src: weekSvg(shown, 300, 76), width: 296, height: 70 },
    { type: 'stack', direction: 'row', gap: 0, children: labels.map((l, i) => T(l, 9, i === 6 ? C.text : C.dim, i === 6 ? 'semibold' : 'medium', { flex: 1, textAlign: 'center', minScale: 1 })) },
  ], { height, gap: 4, padding: [9, 11, 9, 11], borderRadius: 16 });
}

// 大号：两列详情卡网格；3 个订阅时第 4 格放合计卡，4 个时顶部一行合计
function sumCardHasRemain(list) {
  return list.some(s => s.traffic && !s.traffic.unlimited && Number.isFinite(s.traffic.remaining));
}

function sumCard(shown, sumRemain, sumToday, o) {
  const nodes = shown.reduce((a, s) => a + (s.nodeCount || 0), 0);
  return glass([
    { type: 'stack', direction: 'row', alignItems: 'center', gap: 4, children: [icon('sum', C.accent, 11), T(`${shown.length} 个订阅合计`, 12, C.text, 'semibold', { minScale: 1 })] },
    {
      type: 'stack', direction: 'row', alignItems: 'center', gap: 8,
      children: [
        { type: 'image', src: ringsSvg(shown.map((s, i) => ({ pct: ringPct(s.traffic), color: colorOf(i) })), 120, 12, 3), width: 56, height: 56 },
        {
          type: 'stack', direction: 'column', alignItems: 'start', gap: 1,
          children: [T('合计剩余', 10, C.dim, 'medium', { minScale: 1 }), bigRemain(sumCardHasRemain(shown) ? { remaining: sumRemain } : {}, 22)],
        },
      ],
    },
    T(`今日已用 ${fmtBytes(sumToday)}`, 10, C.accent, 'semibold', { minScale: 1 }),
    T(nodes ? `共 ${nodes} 节点` : ' ', 10, C.dim, 'medium', { minScale: 1 }),
  ], { flex: 1, height: o.height, gap: 5, padding: o.padding, borderRadius: 16 });
}

function multiLarge(ctx, list) {
  if (list.length >= 5) return denseGrid(ctx, list, 'systemLarge');
  const shown = list.slice(0, 4);
  const withT = shown.filter(s => s.traffic && !s.traffic.unlimited && Number.isFinite(s.traffic.remaining));
  const sumRemain = withT.reduce((a, s) => a + s.traffic.remaining, 0);
  const sumToday = shown.reduce((a, s) => a + (s.today || 0), 0);
  const odd = shown.length % 2 === 1;
  const two = shown.length === 2;
  const O = { height: odd ? 146 : (two ? 140 : 128), gap: odd || two ? 4 : 3, padding: [9, 11, 9, 11], name: 12, big: 22, small: 10 };
  const cells = shown.map((s, i) => detailCard(s, i, O));
  if (odd) cells.push(sumCard(shown, sumRemain, sumToday, O));
  const rows = [];
  // 行高固定，避免 Egern 把整行撑高后卡片上下居中留白
  for (let k = 0; k < cells.length; k += 2) rows.push({ type: 'stack', direction: 'row', alignItems: 'start', gap: 8, height: O.height, children: cells.slice(k, k + 2) });
  if (two) rows.push(weekCard(shown, 132));
  const top = odd ? [] : [{
    type: 'stack', direction: 'row', alignItems: 'end', gap: 6,
    children: [
      T(`${shown.length} 个订阅 合计剩余`, 11, C.dim, 'medium'),
      bigRemain(withT.length ? { remaining: sumRemain } : {}, 20),
      { type: 'spacer' },
      T(`今日已用 ${fmtBytes(sumToday)}`, 11, C.accent, 'semibold'),
    ],
  }];
  return {
    type: 'widget', padding: [12, 14, 12, 14], gap: 8, backgroundGradient: bg(), refreshAfter: refreshAt(ctx),
    children: [header(list, titleOf(ctx, list)), ...top, ...rows, { type: 'spacer' }],
  };
}

/* ---------- 锁屏 ---------- */

function lockWidget(list, family) {
  const ok = list.filter(s => s.traffic);
  if (!ok.length) return { type: 'widget', children: [{ type: 'text', text: list.length ? '订阅流量：读取失败' : '订阅流量：待配置', font: { size: 12, weight: 'semibold' } }] };
  if (family === 'accessoryInline') {
    return { type: 'widget', children: [{ type: 'text', text: ok.map(s => `${s.name} ${fmtBytes(remainKnown(s.traffic) ? s.traffic.remaining : s.traffic.used)}`).join(' · '), maxLines: 1, minScale: 0.6 }] };
  }
  if (family === 'accessoryCircular') {
    const s = ok[0];
    const p = pctLeft(s.traffic);
    return {
      type: 'widget', padding: 8, backgroundImage: ringsSvg([{ pct: ringPct(s.traffic), color: 'white' }], 60, 6, 0),
      children: [
        { type: 'spacer' },
        { type: 'text', text: p == null ? (s.traffic.unlimited ? '∞' : '--') : `${Math.round(p * 100)}%`, font: { size: 14, weight: 'bold' }, textAlign: 'center' },
        { type: 'text', text: splitBytes(remainKnown(s.traffic) ? s.traffic.remaining : s.traffic.used).n, font: { size: 9 }, textAlign: 'center', opacity: 0.7, maxLines: 1, minScale: 0.5 },
        { type: 'spacer' },
      ],
    };
  }
  return {
    type: 'widget', padding: [2, 4, 2, 4], gap: 2,
    children: ok.slice(0, 3).map(s => ({
      type: 'stack', direction: 'row', alignItems: 'center', gap: 4,
      children: [
        { type: 'image', src: 'sf-symbol:chart.pie.fill', width: 10, height: 10 },
        { type: 'text', text: `${s.name} ${fmtBytes(remainKnown(s.traffic) ? s.traffic.remaining : s.traffic.used)}`, font: { size: 'caption1', weight: 'semibold' }, maxLines: 1, minScale: 0.6 },
        { type: 'spacer' },
        { type: 'text', text: (() => { const e = daysUntil(s.traffic.expireAt); return e == null ? '' : `${Math.max(0, e)}天`; })(), font: { size: 'caption2' }, opacity: 0.7 },
      ],
    })),
  };
}

export default async function (ctx) {
  const list = await loadAll(ctx);
  const family = ctx.widgetFamily || 'systemMedium';
  if (family.startsWith('accessory')) return lockWidget(list, family);
  if (!list.length) return emptyWidget(ctx, '等待订阅地址', '在 Env 里填 SUB1_URL、SUB2_URL……最多 10 个，也可以在 SUBSCRIPTION_URL 里用 | 分隔多个地址');
  if (list.length === 1) {
    const s = list[0];
    if (!s.traffic) return emptyWidget(ctx, s.nodeCount > 0 ? `${s.nodeCount} 个可用节点` : '无法读取流量', s.error || '订阅未提供流量信息');
    if (family === 'systemSmall') return singleSmall(ctx, s);
    if (family === 'systemLarge' || family === 'systemExtraLarge') return singleLarge(ctx, s);
    return singleMedium(ctx, s);
  }
  if (family === 'systemSmall') return multiSmall(ctx, list);
  if (family === 'systemLarge' || family === 'systemExtraLarge') return multiLarge(ctx, list);
  return multiMedium(ctx, list);
}