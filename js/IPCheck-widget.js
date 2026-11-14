/*
 * IP 质检 (IPCheck) — Egern 小组件
 *
 * 设计目标：一眼看懂「这条出口线能不能用」，而不是罗列字段。
 *   · 单一主指标：综合纯净度（大字号 + 环形仪表 + 进度条，三种尺寸呼应）
 *   · 双源并列：Net.Coffee / IPFinal 各一条横条，长度即分数，避免两列文字堆叠
 *   · 结论先行：标题右侧给「结论徽标」，底部给一句人话结论
 *   · 数据自适应：某源失败或未启用时整块消失，不出现空卡片与 N/A
 *
 * 数据源
 *   · Net.Coffee  https://ip.net.coffee/api/ip/lookup/{ip}   （英文地名，作为地名基准）
 *   · IPFinal     https://api.ipfinal.com/api/report/{ip}     （PoW + AES-256-GCM，需自解密）
 */

const NC_BASE = "https://ip.net.coffee";
const IF_BASE = "https://api.ipfinal.com/api";
const IF_ORIGIN = "https://ipfinal.com";
const CHECK_LOGO = "data:image/png;base64,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";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

export default async function (ctx) {
  const markIP = String(ctx.env?.MarkIP || ctx.env?.mark_ip || "false").toLowerCase() === "true";
  const sel = parseSource(ctx.env?.Source ?? ctx.env?.source);

  // 出口 IP：默认走 Net.Coffee 的 trace；只查 IPFinal 时交给它自己的 self 报告
  const ip = sel.nc ? await fetchSelfIP(ctx) : "";

  const [ncRes, ifRes] = await Promise.allSettled([
    sel.nc ? fetchNetCoffee(ctx, ip) : Promise.resolve(null),
    sel.iff ? fetchIPFinal(ctx, ip) : Promise.resolve(null)
  ]);

  const nc = ncRes.status === "fulfilled" ? ncRes.value : null;
  const iff = ifRes.status === "fulfilled" ? ifRes.value : null;

  if (!nc && !iff) {
    return renderEmpty(sel.nc ? "Net.Coffee 无响应" : (sel.iff ? "IPFinal 无响应" : "数据源无响应"));
  }

  // ── 基础字段 ──
  const finalIp = ip || nc?.ip || iff?.ip || "";
  const ipVer = finalIp.includes(":") ? "IPv6" : (finalIp ? "IPv4" : "IP");
  const displayIP = markIP ? maskIP(finalIp) : (finalIp || "未知 IP");

  const ncOn = sel.nc && !!nc;
  const iffOn = sel.iff && !!iff;

  const ncScore = numScore(nc?.trust_score);
  const iffScore = numScore(iff?.score?.total);

  const scores = [ncScore, iffScore].filter(v => v !== null);
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const tone = scoreTone(overall);

  // ── 地名：以 Net.Coffee 为准 ──
  const localCc = nc ? "" : localCountry(ctx, finalIp);
  const iffCc = (iff?.geo?.countryCode || "").toUpperCase();
  const geoConflict = !nc && !!localCc && !!iffCc && localCc !== iffCc;
  const countryCode = (nc?.countryCode || localCc || iffCc || "").toUpperCase();
  const country = nc?.country || (geoConflict ? "" : iff?.geo?.country) || "";
  const city = nc?.city || nc?.region || (geoConflict ? "" : iff?.geo?.city) || "";
  const place = [flagEmoji(countryCode), city || country || (countryCode ? countryCode : "未知位置")].filter(Boolean).join(" ");

  const asn = iff?.network?.asn ? `AS${iff.network.asn}` : (nc?.asn ? `AS${nc.asn}` : "");
  const org = (iff?.network?.asOrg || nc?.asOrganization || "").trim();

  // ── 每源指标 ──
  const ncType = nc ? (nc.isResidential ? "住宅" : (nc.is_datacenter ? "机房" : "普通")) : "";
  const ncAbuse = nc ? abuserZh((String(nc.abuser_score || "").match(/\(([^)]+)\)/) || [, ""])[1]) : "";
  const iffLevel = iff?.score?.level || "";
  const iffNative = iff ? (iff.isNative === true ? "原生" : (iff.isNative === false ? "广播" : "未知")) : "";
  const botPct = typeof iff?.humanRatio === "number" ? Math.round(100 - iff.humanRatio) : null;
  const proxyHit = iff?.factors?.proxy ? `${iff.factors.proxy.hit}/${iff.factors.proxy.total}` : "";
  const vpnHit = iff?.factors?.vpn ? `${iff.factors.vpn.hit}/${iff.factors.vpn.total}` : "";
  const torHit = iff?.factors?.tor ? `${iff.factors.tor.hit}/${iff.factors.tor.total}` : "";
  const blHits = Array.isArray(iff?.blacklists) ? iff.blacklists.filter(b => b.listed).length : null;
  const scenes = Array.isArray(iff?.score?.scenarios) ? iff.score.scenarios : [];

  const verdict = buildVerdict({ ncScore, iffScore, overall, nc, iff, ncType, iffNative, proxyHit, vpnHit });
  const sourceLabel = [ncOn ? "Net.Coffee" : "", iffOn ? "IPFinal" : ""].filter(Boolean).join(" · ") || "无";

  const model = {
    displayIP, ipVer, place, countryCode, asn, org,
    overall, overallText: overall === null ? "—" : String(overall), tone,
    ncOn, iffOn, sourceLabel, verdict,
    ncScore, ncType, ncAbuse, ncAi: nc?.ai_verdict?.label || "",
    iffScore, iffLevel, iffNative, botPct, proxyHit, vpnHit, torHit, blHits, scenes,
    ncProxy: nc ? nc.is_proxy === true : null,
    ncVpn: nc ? nc.is_vpn === true : null,
    ncTor: nc ? nc.is_tor === true : null,
    ncCrawler: nc ? nc.is_crawler === true : null,
    ncRisky: nc ? !!(nc.is_vpn || nc.is_proxy || nc.is_tor || nc.is_abuser || nc.is_crawler) : null
  };

  const family = ctx.widgetFamily || "systemMedium";
  if (family === "accessoryInline" || family === "accessoryRectangular") return renderAccessoryText(model);
  if (family === "accessoryCircular") return renderAccessoryCircular(model);
  if (family === "systemSmall") return renderSmall(model);
  if (family === "systemLarge" || family === "systemExtraLarge") return renderLarge(model);
  return renderMedium(model);
}

/* ═════════════════════════ 取数 ═════════════════════════ */

async function fetchSelfIP(ctx) {
  try {
    const resp = await ctx.http.get(`${NC_BASE}/cdn-cgi/trace`, { timeout: 6000 });
    const text = await resp.text();
    const line = String(text).split("\n").find(l => l.startsWith("ip="));
    const ip = line ? line.slice(3).trim() : "";
    return /^[0-9a-fA-F:.]+$/.test(ip) ? ip : "";
  } catch (e) {
    return "";
  }
}

async function fetchNetCoffee(ctx, ip) {
  if (!ip) return null;
  const resp = await ctx.http.get(`${NC_BASE}/api/ip/lookup/${encodeURIComponent(ip)}`, {
    headers: { "accept": "application/json", "referer": `${NC_BASE}/ip/${ip}` },
    timeout: 9000
  });
  if (resp.status !== 200) throw new Error("netcoffee " + resp.status);
  return await resp.json();
}

async function fetchIPFinal(ctx, ip) {
  const sess = ipfSession(ctx);
  const pow = await ipfPow(ctx, sess);
  const url = ip ? `${IF_BASE}/report/${encodeURIComponent(ip)}` : `${IF_BASE}/report`;

  let resp = await ipfGet(ctx, url, sess, pow);
  if (resp.status === 428) {
    let fresh = null;
    try {
      const body = await resp.json();
      fresh = body?.pow ? solvePow(body.pow) : null;
    } catch (e) { fresh = null; }
    if (fresh) {
      cachePow(ctx, sess, fresh);
      resp = await ipfGet(ctx, url, sess, fresh);
    }
  }
  if (resp.status !== 200) throw new Error("ipfinal " + resp.status);

  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  let payload;
  if (ctype.includes("ipf-enc")) {
    const raw = new Uint8Array(await resp.arrayBuffer());
    const key = sha256(utf8Encode("aes:" + pow.challenge));
    const dec = aesGcmDecrypt(key, raw);
    payload = JSON.parse(utf8Decode(dec.plaintext));
  } else {
    payload = await resp.json();
  }
  return payload && payload.data ? payload.data : payload;
}

function ipfHeaders(sess, pow) {
  const h = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "origin": IF_ORIGIN,
    "referer": `${IF_ORIGIN}/`,
    "x-client": "ip-risk-client",
    "ip-session": sess,
    "user-agent": UA
  };
  if (pow) {
    h["x-pow-challenge"] = pow.challenge;
    h["x-pow-nonce"] = pow.nonce;
  }
  return h;
}

async function ipfGet(ctx, url, sess, pow) {
  return await ctx.http.get(url, { headers: ipfHeaders(sess, pow), timeout: 12000, credentials: "omit" });
}

async function ipfPow(ctx, sess) {
  try {
    const cached = ctx.storage.getJSON("ipcheck:pow");
    if (cached && cached.challenge && cached.nonce && cached.expiresAt > Date.now() && cached.session === sess) return cached;
  } catch (e) { /* ignore */ }

  let data = null;
  try {
    const resp = await ctx.http.get(`${IF_BASE}/pow`, {
      headers: ipfHeaders(sess, null),
      timeout: 8000,
      credentials: "omit"
    });
    const body = await resp.json();
    data = body?.data || body?.pow || null;
  } catch (e) { data = null; }
  if (!data || !data.challenge) throw new Error("ipfinal pow unavailable");

  const solved = solvePow(data);
  cachePow(ctx, sess, solved);
  return solved;
}

function cachePow(ctx, sess, pow) {
  try {
    ctx.storage.setJSON("ipcheck:pow", {
      challenge: pow.challenge, difficulty: pow.difficulty, nonce: pow.nonce,
      session: sess, expiresAt: pow.expiresAt
    });
  } catch (e) { /* ignore */ }
}

function ipfSession(ctx) {
  try {
    const s = ctx.storage.get("ipcheck:session");
    if (/^[0-9a-f]{24}$/.test(s || "")) return s;
  } catch (e) { /* ignore */ }
  let s = "";
  const hex = "0123456789abcdef";
  for (let i = 0; i < 24; i++) s += hex[Math.floor(Math.random() * 16)];
  try { ctx.storage.set("ipcheck:session", s); } catch (e) { /* ignore */ }
  return s;
}

function solvePow({ challenge, difficulty, ttl }) {
  const bits = Number(difficulty) || 0;
  const expiresAt = Date.now() + Math.max(30, (Number(ttl) || 600) - 30) * 1000;
  if (!bits) return { challenge, difficulty: bits, nonce: "0", expiresAt };
  for (let n = 0; n < 2000000; n++) {
    if (leadingZeroBits(sha256(utf8Encode(challenge + ":" + n))) >= bits) {
      return { challenge, difficulty: bits, nonce: String(n), expiresAt };
    }
  }
  throw new Error("PoW 计算失败");
}

function leadingZeroBits(h) {
  let bits = 0;
  for (let i = 0; i < h.length; i++) {
    const b = h[i];
    if (b === 0) { bits += 8; continue; }
    let v = b;
    while (v < 128) { v = (v << 1) & 0xff; bits++; }
    break;
  }
  return bits;
}

/* ═════════════════════════ 归一化 ═════════════════════════ */

function parseSource(raw) {
  const v = String(raw == null ? "" : raw).replace(/[\u3000\s._\-\/|，,]/g, "").toLowerCase();
  if (!v || v.includes("双源") || v.includes("both") || v.includes("all") || v.includes("auto") || v.includes("默认")) {
    return { nc: true, iff: true, both: true };
  }
  const hasIF = v.includes("ipfinal") || v.includes("final") || v.includes("ifp");
  const hasNC = v.includes("netcoffee") || v.includes("coffee") || v.includes("net") || v === "nc" || v.includes("咖啡");
  if (hasIF && !hasNC) return { nc: false, iff: true, both: false };
  if (hasNC && !hasIF) return { nc: true, iff: false, both: false };
  return { nc: true, iff: true, both: true };
}

function numScore(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

function localCountry(ctx, ip) {
  if (!ip) return "";
  try {
    const info = ctx.lookupIP ? ctx.lookupIP(ip) : null;
    const cc = info && info.country ? String(info.country).toUpperCase() : "";
    return /^[A-Z]{2}$/.test(cc) ? cc : "";
  } catch (e) {
    return "";
  }
}

function abuserZh(level) {
  const k = String(level || "").toLowerCase();
  if (k.includes("very low")) return "极低";
  if (k.includes("low")) return "低";
  if (k.includes("elevated")) return "偏高";
  if (k.includes("high")) return "高";
  return level || "—";
}

function maskIP(ip) {
  if (!ip) return "";
  if (ip.includes(".")) {
    const p = ip.split(".");
    return `${p[0]}.${p[1]}.*.*`;
  }
  const p6 = ip.split(":");
  return `${p6[0]}:${p6[1]}:*:*:*:*:*:*`;
}

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  let code = cc.toUpperCase();
  if (code === "TW") code = "CN";
  try {
    return String.fromCodePoint(...code.split("").map(c => 127397 + c.charCodeAt(0)));
  } catch (e) {
    return "";
  }
}

/* ═════════════════════════ 结论与色彩 ═════════════════════════ */

const TONE = {
  great: { main: "rgb(48,209,88)", soft: "rgba(48,209,88,0.14)", word: "干净" },
  good: { main: "rgb(48,176,199)", soft: "rgba(48,176,199,0.14)", word: "可用" },
  mid: { main: "rgb(255,159,10)", soft: "rgba(255,159,10,0.16)", word: "一般" },
  bad: { main: "rgb(255,69,58)", soft: "rgba(255,69,58,0.16)", word: "高风险" },
  none: { main: "rgb(142,142,147)", soft: "rgba(142,142,147,0.16)", word: "无评分" }
};

function scoreTone(score) {
  if (score === null || score === undefined) return TONE.none;
  if (score >= 80) return TONE.great;
  if (score >= 60) return TONE.good;
  if (score >= 40) return TONE.mid;
  return TONE.bad;
}

function buildVerdict({ nc, iff, ncType, iffNative, proxyHit, vpnHit, overall }) {
  const hit = v => v && Number(String(v).split("/")[0]) > 0;
  const risk = [];
  if (hit(proxyHit)) risk.push("代理特征");
  if (hit(vpnHit)) risk.push("VPN 特征");

  let base;
  if (ncType === "住宅") base = "住宅线路";
  else if (ncType === "机房") base = "机房线路";
  else if (iffNative === "原生") base = "原生 IP";
  else if (iffNative === "广播") base = "广播 IP";
  else base = overall === null ? "数据不足" : scoreTone(overall).word;

  let tail;
  if (risk.length) tail = risk.join(" / ");
  else if (base === "机房线路") tail = "易触发风控";
  else if (base === "住宅线路") tail = "风险低";
  else if (base === "广播 IP") tail = "注册地不符";
  else tail = scoreTone(overall).word;

  return `${base} · ${tail}`;
}

/* ═════════════════════════ 视觉常量 ═════════════════════════ */

const C = {
  primary: { light: "#0B0B0C", dark: "#FFFFFF" },
  secondary: { light: "#6E6E73", dark: "#A1A1A6" },
  tertiary: { light: "#9A9AA0", dark: "#6E6E73" },
  bg: { light: "#FFFFFF", dark: "#121214" },
  card: { light: "rgba(120,120,128,0.08)", dark: "rgba(120,120,128,0.16)" },
  hair: { light: "rgba(60,60,67,0.10)", dark: "rgba(255,255,255,0.10)" }
};

/* ═════════════════════════ Small ═════════════════════════ */

function renderSmall(d) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    padding: 13,
    children: [
      // 标题行
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 13, height: 13, borderRadius: 3.5 },
          { type: "spacer", length: 5 },
          { type: "text", text: "IP 质检", font: { size: 11, weight: "heavy" }, textColor: C.primary },
          { type: "spacer" },
          toneDot(d.tone, d.tone.word)
        ]
      },

      { type: "spacer", length: 10 },

      // 主指标
      { type: "text", text: d.overallText, font: { size: 38, weight: "heavy" }, textColor: d.tone.main, maxLines: 1, minScale: 0.6 },
      { type: "text", text: "综合纯净度", font: { size: 9, weight: "semibold" }, textColor: C.tertiary },

      { type: "spacer", length: 7 },
      { type: "image", src: barSvg(d.overall === null ? 0 : d.overall, 108, 5, d.tone.main), width: 108, height: 5 },

      { type: "spacer" },
      { type: "text", text: d.displayIP, font: { size: 10, weight: "semibold" }, textColor: C.secondary, maxLines: 1, minScale: 0.7 },
      { type: "spacer", length: 2 },
      { type: "text", text: [d.place, d.asn].filter(Boolean).join(" · ") || "—", font: { size: 9 }, textColor: C.tertiary, maxLines: 1, minScale: 0.75 }
    ]
  };
}

/* ═════════════════════════ Medium ═════════════════════════ */

function renderMedium(d) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    padding: [13, 15, 13, 15],
    children: [
      // 标题 + 结论徽标
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "spacer", length: 6 },
          { type: "text", text: "IP 质检", font: { size: 12, weight: "heavy" }, textColor: C.primary },
          { type: "spacer", length: 7 },
          { type: "text", text: d.ipVer, font: { size: 8, weight: "bold" }, textColor: C.tertiary },
          { type: "spacer" },
          scorePill(d)
        ]
      },

      { type: "spacer", length: 7 },

      // 出口身份
      { type: "text", text: d.displayIP, font: { size: 15, weight: "bold" }, textColor: C.primary, maxLines: 1, minScale: 0.7 },
      { type: "spacer", length: 2 },
      {
        type: "text",
        text: [d.place, d.asn, d.org].filter(Boolean).join("  ·  ") || "—",
        font: { size: 10, weight: "medium" },
        textColor: C.secondary,
        maxLines: 1,
        minScale: 0.7
      },

      { type: "spacer", length: 7 },
      hairline(),
      { type: "spacer", length: 7 },

      // 双源横条
      ...(d.ncOn ? [sourceBar("Net.Coffee", d.ncScore, d.ncType || "—", d.ncScore === null ? TONE.none : scoreTone(d.ncScore))] : []),
      ...(d.ncOn && d.iffOn ? [{ type: "spacer", length: 7 }] : []),
      ...(d.iffOn ? [sourceBar("IPFinal", d.iffScore, d.iffLevel || d.iffNative || "—", d.iffScore === null ? TONE.none : scoreTone(d.iffScore))] : []),

      { type: "spacer" },
      {
        type: "text",
        text: d.verdict + (d.sourceLabel === "无" ? "" : `　·　${d.sourceLabel}`),
        font: { size: 9, weight: "medium" },
        textColor: C.tertiary,
        maxLines: 1,
        minScale: 0.7
      }
    ]
  };
}

function sourceBar(name, score, tag, tone) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "stack",
        width: 56,
        children: [
          { type: "text", text: name, font: { size: 9, weight: "semibold" }, textColor: C.secondary, maxLines: 1, minScale: 0.8 }
        ]
      },
      { type: "image", src: barSvg(score === null ? 0 : score, 92, 5, tone.main), width: 92, height: 5 },
      { type: "spacer", length: 6 },
      { type: "text", text: score === null ? "—" : String(score), font: { size: 12, weight: "heavy" }, textColor: tone.main, maxLines: 1 },
      { type: "spacer", length: 6 },
      { type: "text", text: tag, font: { size: 9, weight: "medium" }, textColor: C.tertiary, maxLines: 1, minScale: 0.75 }
    ]
  };
}

/* ═════════════════════════ Large ═════════════════════════ */

function renderLarge(d) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    padding: 15,
    gap: 9,
    children: [
      // 顶栏
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "spacer", length: 6 },
          { type: "text", text: "IP 质检", font: { size: 13, weight: "heavy" }, textColor: C.primary },
          { type: "spacer", length: 7 },
          { type: "text", text: d.ipVer, font: { size: 9, weight: "bold" }, textColor: C.tertiary },
          { type: "spacer" },
          scorePill(d)
        ]
      },

      // Hero
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 14,
        children: [
          { type: "image", src: ringSvg(d.overall === null ? 0 : d.overall, 78, 7, d.tone.main, d.overallText), width: 78, height: 78 },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            gap: 3,
            alignItems: "start",
            children: [
              { type: "text", text: d.displayIP, font: { size: 17, weight: "bold" }, textColor: C.primary, maxLines: 1, minScale: 0.7 },
              { type: "text", text: d.place, font: { size: 11, weight: "medium" }, textColor: C.secondary, maxLines: 1, minScale: 0.8 },
              { type: "text", text: [d.asn, d.org].filter(Boolean).join(" "), font: { size: 9 }, textColor: C.tertiary, maxLines: 1, minScale: 0.8 },
              { type: "spacer", length: 2 },
              { type: "text", text: d.verdict, font: { size: 10, weight: "semibold" }, textColor: d.tone.main, maxLines: 1, minScale: 0.8 }
            ]
          }
        ]
      },

      // 2x2：行内字段按「实际有值」动态生成，缺数据不留破折号
      {
        type: "stack",
        direction: "column",
        flex: 1,
        gap: 8,
        children: [
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              card("sf-symbol:person.text.rectangle", "身份", layoutRows(d)),
              card("sf-symbol:exclamationmark.shield", "风险", riskRows(d))
            ]
          },
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              card("sf-symbol:chart.bar.fill", "流量画像", trafficRows(d)),
              d.scenes.length
                ? sceneCard(d.scenes)
                : card("sf-symbol:target", "质检结论", [
                  { k: "综合", v: d.overallText },
                  { k: "数据源", v: d.sourceLabel }
                ])
            ]
          }
        ]
      }
    ]
  };
}

function layoutRows(d) {
  const rows = [];
  if (d.ncType) rows.push({ k: "线路", v: d.ncType });
  if (d.iffNative) rows.push({ k: "原生性", v: d.iffNative });
  if (d.ncAbuse) rows.push({ k: "滥用", v: d.ncAbuse });
  if (!rows.length) rows.push({ k: "状态", v: "正常" });
  return rows;
}

function riskRows(d) {
  const rows = [];
  if (d.proxyHit) rows.push({ k: "代理", v: d.proxyHit });
  else if (d.ncProxy !== null) rows.push({ k: "代理", v: d.ncProxy ? "是" : "否" });

  if (d.vpnHit) rows.push({ k: "VPN", v: d.vpnHit });
  else if (d.ncVpn !== null) rows.push({ k: "VPN", v: d.ncVpn ? "是" : "否" });

  if (d.blHits !== null) rows.push({ k: "黑名单", v: d.blHits ? `${d.blHits} 个` : "未命中" });
  else if (d.ncTor !== null) rows.push({ k: "Tor", v: d.ncTor ? "是" : "否" });

  if (!rows.length) rows.push({ k: "风险", v: d.ncRisky ? "有命中" : "无明显命中" });
  return rows;
}

function trafficRows(d) {
  const rows = [];
  if (d.botPct !== null) rows.push({ k: "机器流量", v: `${d.botPct}%` });
  if (d.ncAi) rows.push({ k: "AI 判定", v: d.ncAi });
  if (d.ncCrawler !== null) rows.push({ k: "爬虫", v: d.ncCrawler ? "是" : "否" });
  if (!rows.length) rows.push({ k: "采样", v: "不足" });
  return rows;
}

function sceneCard(scenes) {
  const pick = ["ai", "streaming", "tiktok"];
  const chosen = pick.map(k => scenes.find(s => s.key === k)).filter(Boolean).slice(0, 3);
  const rows = (chosen.length ? chosen : scenes.slice(0, 3)).map(s => ({
    k: s.name, v: String(s.score), tone: scoreTone(s.score)
  }));
  return card("sf-symbol:target", "场景适配", rows, true);
}

function card(icon, title, rows, colored) {
  return {
    type: "stack",
    direction: "column",
    flex: 1,
    gap: 5,
    padding: [9, 10, 9, 10],
    backgroundColor: C.card,
    borderRadius: 11,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: icon, color: C.tertiary, width: 10, height: 10 },
          { type: "text", text: title, font: { size: 9, weight: "heavy" }, textColor: C.tertiary }
        ]
      },
      ...rows.map(r => ({
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "text", text: r.k, font: { size: 9 }, textColor: C.secondary, maxLines: 1 },
          { type: "spacer" },
          {
            type: "text",
            text: r.v,
            font: { size: 9, weight: "bold" },
            textColor: colored && r.tone ? r.tone.main : C.primary,
            maxLines: 1,
            minScale: 0.75
          }
        ]
      }))
    ]
  };
}

/* ═════════════════════════ 锁屏 / 空态 ═════════════════════════ */

function renderAccessoryCircular(d) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    children: [{ type: "image", src: ringSvg(d.overall === null ? 0 : d.overall, 58, 5, d.tone.main, d.overallText), width: 58, height: 58 }]
  };
}

function renderAccessoryText(d) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: CHECK_LOGO, width: 11, height: 11, borderRadius: 3 },
          { type: "text", text: `IP ${d.overallText}`, font: { size: 11, weight: "heavy" }, textColor: d.tone.main },
          { type: "text", text: d.place, font: { size: 10 }, textColor: C.secondary, maxLines: 1, minScale: 0.8 }
        ]
      }
    ]
  };
}

function renderEmpty(msg) {
  return {
    type: "widget",
    backgroundColor: C.bg,
    padding: 14,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 13, height: 13, borderRadius: 3.5 },
          { type: "spacer", length: 5 },
          { type: "text", text: "IP 质检", font: { size: 11, weight: "heavy" }, textColor: C.primary }
        ]
      },
      { type: "spacer" },
      { type: "text", text: msg, font: { size: 11, weight: "semibold" }, textColor: TONE.bad.main, maxLines: 2 },
      { type: "text", text: "检查策略组连通性后下拉刷新", font: { size: 9 }, textColor: C.tertiary },
      { type: "spacer" }
    ]
  };
}

/* ═════════════════════════ 小组件元素 ═════════════════════════ */

function toneDot(tone, word) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 4,
    padding: [2, 7, 2, 6],
    borderRadius: 9,
    backgroundColor: tone.soft,
    children: [
      { type: "text", text: "●", font: { size: 7 }, textColor: tone.main, maxLines: 1 },
      { type: "text", text: word, font: { size: 9, weight: "heavy" }, textColor: tone.main, maxLines: 1 }
    ]
  };
}

function scorePill(d) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 5,
    padding: [3, 9, 3, 8],
    borderRadius: 10,
    backgroundColor: d.tone.soft,
    children: [
      { type: "text", text: "综合", font: { size: 9, weight: "semibold" }, textColor: d.tone.main, maxLines: 1 },
      { type: "text", text: d.overallText, font: { size: 13, weight: "heavy" }, textColor: d.tone.main, maxLines: 1 },
      { type: "text", text: d.tone.word, font: { size: 9, weight: "bold" }, textColor: d.tone.main, maxLines: 1 }
    ]
  };
}

function hairline() {
  return { type: "stack", height: 1, backgroundColor: C.hair, children: [] };
}

/* ═════════════════════════ SVG ═════════════════════════ */

function barSvg(pct, w, h, color) {
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const fill = (w * p).toFixed(2);
  const r = h / 2;
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<rect x='0' y='0' width='${w}' height='${h}' rx='${r}' fill='rgba(128,128,128,0.22)'/>` +
    `<rect x='0' y='0' width='${fill}' height='${h}' rx='${r}' fill='${color}'/>` +
    `</svg>`;
}

function ringSvg(score, size, stroke, color, valueText) {
  const half = size / 2;
  const r = half - stroke / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = (circ * pct).toFixed(1);
  const num = Math.round(size * 0.30);
  const numY = Math.round(half + num * 0.34);
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='rgba(128,128,128,0.20)' stroke-width='${stroke}'/>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${color}' stroke-width='${stroke}' stroke-linecap='round' stroke-dasharray='${dash} ${(circ - dash).toFixed(1)}' transform='rotate(-90 ${half} ${half})'/>` +
    `<text x='${half}' y='${numY}' text-anchor='middle' font-size='${num}' font-weight='800' font-family='-apple-system, sans-serif' fill='${color}'>${valueText === "—" ? "—" : score}</text>` +
    `</svg>`;
}

// ═════════════════════ 纯 JS 加密原语（SHA-256 / AES-256-GCM） ═════════════════════
// Egern 的脚本上下文不提供 WebCrypto，IPFinal 的响应是 AES-GCM 密文，
// 这里自带实现：SHA-256 用于 PoW 与派生密钥，AES-256-CTR + GHASH 用于解密。

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256(bytes) {
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(len / 536870912));
  dv.setUint32(padded.length - 4, (len << 3) >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

function utf8Encode(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c >= 0xd800 && c <= 0xdbff) {
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

function utf8Decode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++];
    let cp;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    if (cp > 0xffff) {
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      s += String.fromCharCode(cp);
    }
  }
  return s;
}

const SBOX = new Uint8Array(256);
(function buildSbox() {
  const gmul = (a, b) => {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  };
  const rotl8 = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;
  for (let a = 0; a < 256; a++) {
    let inv = 0;
    if (a) for (let b = 1; b < 256; b++) if (gmul(a, b) === 1) { inv = b; break; }
    SBOX[a] = (inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63) & 0xff;
  }
})();

function xtime(x) { return ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff; }
function gfMul(a, b) {
  let p = 0;
  while (b) {
    if (b & 1) p ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return p;
}

function expandKey256(key) {
  const w = new Uint8Array(240);
  w.set(key);
  let rcon = 1;
  for (let i = 32; i < 240; i += 4) {
    let t = [w[i - 4], w[i - 3], w[i - 2], w[i - 1]];
    if (i % 32 === 0) {
      t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
      rcon = xtime(rcon);
    } else if (i % 32 === 16) {
      t = [SBOX[t[0]], SBOX[t[1]], SBOX[t[2]], SBOX[t[3]]];
    }
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
  }
  return w;
}

function encryptBlock(w, input) {
  const s = new Uint8Array(input);
  const addRoundKey = (round) => {
    for (let i = 0; i < 16; i++) s[i] ^= w[round * 16 + i];
  };
  addRoundKey(0);
  for (let round = 1; round <= 14; round++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = new Uint8Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) t[c * 4 + r] = s[((c + r) % 4) * 4 + r];
    s.set(t);
    if (round !== 14) {
      for (let c = 0; c < 4; c++) {
        const a0 = s[c * 4], a1 = s[c * 4 + 1], a2 = s[c * 4 + 2], a3 = s[c * 4 + 3];
        s[c * 4] = gfMul(a0, 2) ^ gfMul(a1, 3) ^ a2 ^ a3;
        s[c * 4 + 1] = a0 ^ gfMul(a1, 2) ^ gfMul(a2, 3) ^ a3;
        s[c * 4 + 2] = a0 ^ a1 ^ gfMul(a2, 2) ^ gfMul(a3, 3);
        s[c * 4 + 3] = gfMul(a0, 3) ^ a1 ^ a2 ^ gfMul(a3, 2);
      }
    }
    addRoundKey(round);
  }
  return s;
}

function ghashMul(x, y) {
  const z = new Uint8Array(16);
  const v = new Uint8Array(y);
  for (let i = 0; i < 128; i++) {
    if ((x[i >> 3] >> (7 - (i & 7))) & 1) for (let j = 0; j < 16; j++) z[j] ^= v[j];
    const lsb = v[15] & 1;
    for (let j = 15; j > 0; j--) v[j] = ((v[j] >> 1) | ((v[j - 1] & 1) << 7)) & 0xff;
    v[0] = (v[0] >> 1) & 0xff;
    if (lsb) v[0] ^= 0xe1;
  }
  return z;
}

function ghash(H, data) {
  let y = new Uint8Array(16);
  for (let i = 0; i < data.length; i += 16) {
    const block = new Uint8Array(16);
    block.set(data.subarray(i, Math.min(i + 16, data.length)));
    for (let j = 0; j < 16; j++) y[j] ^= block[j];
    y = ghashMul(y, H);
  }
  return y;
}

// raw = IV(12) || ciphertext || tag(16)
function aesGcmDecrypt(key, raw) {
  const iv = raw.subarray(0, 12);
  const body = raw.subarray(12);
  const ct = body.subarray(0, body.length - 16);

  const w = expandKey256(key);
  const H = encryptBlock(w, new Uint8Array(16));

  const j0 = new Uint8Array(16);
  j0.set(iv);
  j0[15] = 1;

  const out = new Uint8Array(ct.length);
  const counter = new Uint8Array(j0);
  for (let off = 0; off < ct.length; off += 16) {
    for (let i = 15; i >= 12; i--) {
      counter[i] = (counter[i] + 1) & 0xff;
      if (counter[i] !== 0) break;
    }
    const ks = encryptBlock(w, counter);
    for (let i = 0; i < 16 && off + i < ct.length; i++) out[off + i] = ct[off + i] ^ ks[i];
  }
  return { plaintext: out, h: H };
}

