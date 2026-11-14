/*
 * IP 质检 (IPCheck) — Surge / Loon / Egern 面板脚本
 * 双源：Net.Coffee（trust_score）+ IPFinal（多源纯净评分）
 * IPFinal 需 PoW + AES-256-GCM 解密，运行环境不支持二进制响应时自动降级为单源
 */

var NC = "https://ip.net.coffee";
var IF = "https://api.ipfinal.com/api";
var IF_ORIGIN = "https://ipfinal.com";
var ARG = parseArg($argument);
var MarkIP = ARG.markIP;
var SRC = ARG.source;
var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

main();

async function main() {
  try {
    var ip = SRC.nc ? await selfIP() : "";
    var results = await Promise.all([
      SRC.nc ? netCoffee(ip).catch(function () { return null; }) : Promise.resolve(null),
      SRC.iff ? ipFinal(ip).catch(function () { return null; }) : Promise.resolve(null)
    ]);
    var nc = results[0], iff = results[1];

    if (!nc && !iff) {
      return $done({
        title: "IP 质检",
        content: SRC.both ? "所有数据源请求失败" : (SRC.nc ? "Net.Coffee 请求失败" : "IPFinal 请求失败"),
        icon: "network.slash"
      });
    }

    var finalIp = ip || (nc && nc.ip) || (iff && iff.ip) || "";
    var showIP = MarkIP ? (maskIP(finalIp) || "未知 IP") : (finalIp || "未知 IP");
    // 地名以 Net.Coffee 为准，IPFinal 中文译名仅作兜底
    var loc = [flag((nc && nc.countryCode) || (iff && iff.geo && iff.geo.countryCode) || ""),
      (nc && (nc.city || nc.region)) || (iff && iff.geo && iff.geo.city) || "",
      (nc && nc.country) || (iff && iff.geo && iff.geo.country) || ""].filter(Boolean).join(" ");

    var ncScore = nc ? numScore(nc.trust_score) : null;
    var iffScore = iff && iff.score ? numScore(iff.score.total) : null;

    // 只在真实读到评分时参与平均，缺分不按 0 计
    var scores = [ncScore, iffScore].filter(function (v) { return v !== null; });
    var overall = scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : null;
    var level = overall === null ? { text: "无评分", color: "#8E8E93" } : levelOf(overall);

    var lines = [];
    lines.push("出口：" + showIP + "  " + (loc || "未知位置"));
    var asn = (iff && iff.network && iff.network.asn ? "AS" + iff.network.asn : (nc && nc.asn ? "AS" + nc.asn : ""));
    var org = (iff && iff.network && (iff.network.asOrg || iff.network.isp)) || (nc && nc.asOrganization) || "";
    if (asn || org) lines.push("网络：" + [asn, org].filter(Boolean).join(" "));

    if (SRC.nc && nc) {
      var ncType = nc.isResidential ? "住宅 IP" : (nc.is_datacenter ? "机房 IP" : "普通网络");
      var abuseRaw = (String(nc.abuser_score || "").match(/\(([^)]+)\)/) || [, ""])[1];
      var abuse = abuserZh(abuseRaw);
      lines.push("Net.Coffee：" + (ncScore !== null ? ncScore + "分" : "无评分") + " · " + ncType +
        (abuse ? " · 滥用 " + abuse : ""));
    } else if (SRC.nc) {
      lines.push("Net.Coffee：不可用");
    }

    if (SRC.iff && iff) {
      var native = iff.isNative === true ? "原生 IP" : (iff.isNative === false ? "广播 IP" : "原生未知");
      var bot = typeof iff.humanRatio === "number" ? " · 机器流量 " + Math.round(100 - iff.humanRatio) + "%" : "";
      lines.push("IPFinal：" + (iffScore !== null ? iffScore + "分" : "无评分") + " · " +
        ((iff.score && iff.score.level) || "无评级") + " · " + native + bot);
    } else if (SRC.iff) {
      lines.push("IPFinal：不可用");
    }

    lines.push(overall === null ? "综合：无评分（数据源未返回评分）" : "综合：" + overall + "分 " + level.text);
    if (!SRC.both) lines.push("数据源：仅 " + (SRC.nc ? "Net.Coffee" : "IPFinal") + "（单源模式）");

    $done({
      title: "IP 质检",
      content: lines.join("\n"),
      icon: overall === null ? "questionmark.circle" : (overall >= 70 ? "checkmark.seal.fill" : (overall >= 40 ? "exclamationmark.triangle.fill" : "xmark.seal.fill")),
      "title-color": level.color
    });
  } catch (e) {
    $done({ title: "IP 质检", content: "检测失败：" + (e && e.message ? e.message : e), icon: "network.slash" });
  }
}

// ── 参数解析：$argument 支持 "false" / "false;双源" / "MarkIP=true,Source=ipfinal" ──
function parseArg(raw) {
  var text = String(raw == null ? "" : raw);
  var tokens = text.split(/[;,|]/).map(function (t) { return t.trim(); }).filter(Boolean);
  var markIP = false;
  var source = { nc: true, iff: true, both: true };

  tokens.forEach(function (t) {
    var v = t.toLowerCase();
    var eq = v.indexOf("=");
    if (eq > 0) v = v.slice(eq + 1).trim();
    if (v === "true" || v === "false") {
      markIP = v === "true";
      return;
    }
    if (v.indexOf("双源") !== -1 || v === "both" || v === "all") {
      source = { nc: true, iff: true, both: true };
      return;
    }
    if (v.indexOf("ipfinal") !== -1 || v.indexOf("final") !== -1) {
      source = { nc: false, iff: true, both: false };
      return;
    }
    if (v.indexOf("coffee") !== -1 || v.indexOf("net") !== -1 || v === "nc") {
      source = { nc: true, iff: false, both: false };
    }
  });

  return { markIP: markIP, source: source };
}

// ── HTTP（兼容 $httpClient 回调风格） ──
function request(url, headers) {
  return new Promise(function (resolve, reject) {
    var opts = { url: url, headers: headers || {} };
    $httpClient.get(opts, function (err, resp, data) {
      if (err) return reject(new Error(String(err)));
      var status = resp && (resp.status || resp.statusCode) ? (resp.status || resp.statusCode) : 200;
      var hdrs = {};
      if (resp && resp.headers) {
        Object.keys(resp.headers).forEach(function (k) { hdrs[k.toLowerCase()] = resp.headers[k]; });
      }
      resolve({ status: status, headers: hdrs, body: data });
    });
  });
}

async function selfIP() {
  try {
    var r = await request(NC + "/cdn-cgi/trace", {});
    var text = toText(r.body);
    var line = String(text).split("\n").filter(function (l) { return l.indexOf("ip=") === 0; })[0];
    var ip = line ? line.slice(3).trim() : "";
    return /^[0-9a-fA-F:.]+$/.test(ip) ? ip : "";
  } catch (e) {
    return "";
  }
}

async function netCoffee(ip) {
  if (!ip) return null;
  var r = await request(NC + "/api/ip/lookup/" + encodeURIComponent(ip), { "accept": "application/json" });
  if (r.status !== 200) throw new Error("netcoffee " + r.status);
  return JSON.parse(toText(r.body));
}

async function ipFinal(ip) {
  var sess = session();
  var pow = await getPow(sess);
  // 无 IP 时不带路径段，服务端返回自身出口的报告
  var url = ip ? IF + "/report/" + encodeURIComponent(ip) : IF + "/report";

  var r = await request(url, ifHeaders(sess, pow));
  if (r.status === 428) {
    var fresh = null;
    try {
      var b = JSON.parse(toText(r.body));
      fresh = b && b.pow ? solvePow(b.pow) : null;
    } catch (e) { fresh = null; }
    if (fresh) r = await request(url, ifHeaders(sess, fresh));
  }
  if (r.status !== 200) throw new Error("ipfinal " + r.status);

  var ctype = String(r.headers["content-type"] || "").toLowerCase();
  var body = r.body;

  if (ctype.indexOf("ipf-enc") !== -1) {
    // 需要二进制响应能力；若运行时只给了字符串则无法解密
    if (typeof body === "string") throw new Error("ipfinal 需要二进制响应支持");
    var raw = toBytes(body);
    var key = sha256(utf8Encode("aes:" + pow.challenge));
    var dec = aesGcmDecrypt(key, raw);
    var payload = JSON.parse(utf8Decode(dec.plaintext));
    return payload && payload.data ? payload.data : payload;
  }
  var json = JSON.parse(toText(body));
  return json && json.data ? json.data : json;
}

function ifHeaders(sess, pow) {
  var h = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "origin": IF_ORIGIN,
    "referer": IF_ORIGIN + "/",
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

async function getPow(sess) {
  var r = await request(IF + "/pow", ifHeaders(sess, null));
  if (r.status !== 200) throw new Error("pow " + r.status);
  var body = JSON.parse(toText(r.body));
  var data = (body && body.data) || (body && body.pow);
  if (!data || !data.challenge) throw new Error("pow 参数缺失");
  return solvePow(data);
}

function solvePow(p) {
  var bits = Number(p.difficulty) || 0;
  var expiresAt = Date.now() + Math.max(30, (Number(p.ttl) || 600) - 30) * 1000;
  if (!bits) return { challenge: p.challenge, difficulty: bits, nonce: "0", expiresAt: expiresAt };
  for (var n = 0; n < 2000000; n++) {
    if (leadingZeroBits(sha256(utf8Encode(p.challenge + ":" + n))) >= bits) {
      return { challenge: p.challenge, difficulty: bits, nonce: String(n), expiresAt: expiresAt };
    }
  }
  throw new Error("PoW 计算失败");
}

function leadingZeroBits(h) {
  var bits = 0;
  for (var i = 0; i < h.length; i++) {
    var b = h[i];
    if (b === 0) { bits += 8; continue; }
    var v = b;
    while (v < 128) { v = (v << 1) & 0xff; bits++; }
    break;
  }
  return bits;
}

function session() {
  var s = "";
  try { s = $persistentStore.read("ipcheck:session") || ""; } catch (e) { s = ""; }
  if (/^[0-9a-f]{24}$/.test(s)) return s;
  var hex = "0123456789abcdef";
  s = "";
  for (var i = 0; i < 24; i++) s += hex[Math.floor(Math.random() * 16)];
  try { $persistentStore.write(s, "ipcheck:session"); } catch (e) { /* ignore */ }
  return s;
}

// ── 数据/显示辅助 ──
function toText(body) {
  if (typeof body === "string") return body;
  if (body && body.length !== undefined) return utf8Decode(toBytes(body));
  return String(body);
}

function toBytes(body) {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (body && body.buffer) return new Uint8Array(body.buffer, body.byteOffset || 0, body.byteLength || body.length);
  if (typeof body === "string") {
    var out = new Uint8Array(body.length);
    for (var i = 0; i < body.length; i++) out[i] = body.charCodeAt(i) & 0xff;
    return out;
  }
  return new Uint8Array(0);
}

function clamp100(n) { return Math.max(0, Math.min(100, Math.round(n))); }

// 只有真实数字才算分；0 是合法评分，缺失/非法一律 null
function numScore(v) {
  var n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && isFinite(n) ? clamp100(n) : null;
}

function abuserZh(level) {
  var k = String(level).toLowerCase();
  if (k.indexOf("very low") !== -1) return "极低";
  if (k.indexOf("low") !== -1) return "低";
  if (k.indexOf("elevated") !== -1) return "偏高";
  if (k.indexOf("high") !== -1) return "高";
  return level;
}

function levelOf(score) {
  if (score >= 80) return { text: "极佳", color: "#34C759" };
  if (score >= 60) return { text: "良好", color: "#30B0C7" };
  if (score >= 40) return { text: "一般", color: "#FF9500" };
  return { text: "差", color: "#FF3B30" };
}

function maskIP(ip) {
  if (!ip) return "";
  if (ip.indexOf(".") !== -1) {
    var p = ip.split(".");
    return p[0] + "." + p[1] + ".*.*";
  }
  var p6 = ip.split(":");
  return p6[0] + ":" + p6[1] + ":*:*:*:*:*:*";
}

function flag(cc) {
  if (!cc || cc.length !== 2) return "";
  var code = cc.toUpperCase() === "TW" ? "CN" : cc.toUpperCase();
  try {
    return String.fromCodePoint.apply(null, code.split("").map(function (c) { return 127397 + c.charCodeAt(0); }));
  } catch (e) {
    return "";
  }
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

