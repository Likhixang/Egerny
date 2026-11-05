/* 百度识图换 Google Lens — Egern 模块脚本
 *
 * 国行 iPhone「视觉搜索 / 以图搜图」走的是百度千帆：
 *   POST https://qianfan.baidubce.com/v1/images/search
 *   body: image=<urlencoded base64>（application/x-www-form-urlencoded）
 *
 * 本脚本拦下请求，改用 SerpAPI 的 google_lens 引擎，再把结果映射回
 * 百度识图的 JSON schema（手机 UI 只认这个），所以界面无感知。
 *
 * SerpAPI key 填在模块的 SERPAPI_KEY 里；任何一步失败都原样放行给百度，
 * 不会让视觉搜索直接坏掉。
 *
 * 协议依据：2026-11-05 抓包（qianfan.baidubce.com，UA SearchPartnerInferenceProvider）
 * 与 https://serpapi.com/google-lens-api 的响应示例。
 */

const BAIDU_HOST = "qianfan.baidubce.com";
const BAIDU_PATH = "/v1/images/search";
const SERP_BASE = "https://serpapi.com";
const MAX_UPLOAD_BYTES = 500 * 1024; // SerpAPI /image 上限 500KB
const MAX_RES_ITEMS = 60;
const MAX_SIM_ITEMS = 85;

function str(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function bool(value, fallback) {
  const v = str(value).toLowerCase();
  if (v === "true" || v === "on" || v === "1") return true;
  if (v === "false" || v === "off" || v === "0") return false;
  return fallback;
}

function readConfig(env) {
  const e = env || {};
  return {
    apiKey: str(e.SERPAPI_KEY),
    hl: str(e.HL) || "zh-cn",
    country: str(e.COUNTRY) || "cn",
    type: str(e.LENS_TYPE) || "all",
    thumbProxy: str(e.THUMB_PROXY), // 例如 https://wsrv.nl/?url=，留空保持原图地址
    notifyOnError: bool(e.NOTIFY_ON_ERROR, true),
    timeoutMs: (Number(str(e.TIMEOUT) || "45") || 45) * 1000,
  };
}

/* ------------------------------------------------------------ 字节工具 */

function asciiBytes(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

function concatBytes(parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(input) {
  const clean = String(input || "").replace(/[^A-Za-z0-9+/=_-]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const table = new Uint8Array(128);
  for (let i = 0; i < B64_CHARS.length; i += 1) table[B64_CHARS.charCodeAt(i)] = i;
  const out = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean.charCodeAt(i);
    if (ch === 61) break; // '='
    const v = table[ch];
    if (v === undefined) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/** 从魔数判断图片类型，只用于 multipart 的 filename/Content-Type */
function detectImage(bytes) {
  if (bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return { ext: "png", mime: "image/png" };
  }
  if (bytes.length > 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  return { ext: "jpg", mime: "image/jpeg" };
}

/* ------------------------------------------------------------ 请求解析 */

function parseRequestUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    return null;
  }
  if (parsed.hostname !== BAIDU_HOST) return null;
  if (parsed.pathname !== BAIDU_PATH) return null;
  return parsed;
}

/** 百度送的是 application/x-www-form-urlencoded，只有一个 image 字段 */
function extractImageBase64(bodyText) {
  const raw = String(bodyText || "");
  if (!raw) return "";
  for (const pair of raw.split("&")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const key = pair.slice(0, eq);
    if (key !== "image") continue;
    let value = pair.slice(eq + 1);
    try {
      value = decodeURIComponent(value);
    } catch (_) {
      /* 保持原样 */
    }
    return value.replace(/\s/g, "+").trim();
  }
  return "";
}

/* ------------------------------------------------------ SerpAPI → 百度 */

function proxied(url, prefix) {
  const s = str(url);
  if (!s || !prefix) return s;
  return prefix + encodeURIComponent(s);
}

function itemFromVisual(v, prefix) {
  const w = Number(v.image_width || v.thumbnail_width || 0) || 0;
  const h = Number(v.image_height || v.thumbnail_height || 0) || 0;
  return {
    item_cate: "CATE_SIMI",
    site_name: str(v.source),
    height: h,
    width: w,
    title: str(v.title),
    thumburl: proxied(v.thumbnail || v.image, prefix),
    fromurl: str(v.link),
    objurl: str(v.image || v.thumbnail),
  };
}

function itemFromOther(v, prefix) {
  return {
    item_cate: "CATE_SIMI",
    contsign: "",
    title: str(v.title),
    score: 0,
    thumburl: proxied(v.thumbnail, prefix),
    fromurl: str(v.link || v.redirect_link),
    height: Number(v.thumbnail_height || 0) || 0,
    width: Number(v.thumbnail_width || 0) || 0,
    img_score: 0,
  };
}

function pickGuessword(data) {
  const related = Array.isArray(data.related_content) ? data.related_content : [];
  for (const r of related) {
    const q = str(r && r.query);
    if (q) return q;
  }
  const kg = data.knowledge_graph;
  if (kg && str(kg.title)) return str(kg.title);
  const first = Array.isArray(data.visual_matches) ? data.visual_matches[0] : null;
  if (first && str(first.title)) return str(first.title).slice(0, 40);
  return "图片搜索";
}

/** SerpAPI google_lens 响应 → 百度识图 schema */
function toBaidu(data, prefix) {
  const visual = Array.isArray(data.visual_matches) ? data.visual_matches : [];
  const exact = Array.isArray(data.exact_matches) ? data.exact_matches : [];
  const organic = Array.isArray(data.organic_results) ? data.organic_results : [];

  const logid = Date.now() % 2147483647;
  return {
    result: {
      logid,
      err_code: 0,
      all_need_data: {},
      guessword_res: [
        {
          word: pickGuessword(data),
          type: "TYPE_MLLM_GUESSWORD",
          confidence: 1,
          extend_brief: { mllm_abstract: { component: [] } },
        },
      ],
      post_intention_res: {},
      query_data: {},
      res_data: {
        res_items: visual.slice(0, MAX_RES_ITEMS).map((v) => itemFromVisual(v, prefix)),
        sim_items: exact.concat(organic).slice(0, MAX_SIM_ITEMS).map((v) => itemFromOther(v, prefix)),
        simi_result_page: "",
        result_page: "",
      },
      anti_response: {},
      intervened: 0,
    },
    error_code: 0,
    error_msg: "succ",
    support: "Google Lens 提供技术支持",
    logid,
  };
}

/* ------------------------------------------------------------ SerpAPI */

function multipartImage(bytes, image) {
  const boundary = "----egern" + Date.now().toString(16) + Math.floor(Math.random() * 1e6).toString(16);
  const head =
    "--" + boundary + "\r\n" +
    'Content-Disposition: form-data; name="image"; filename="image.' + image.ext + '"\r\n' +
    "Content-Type: " + image.mime + "\r\n\r\n";
  const tail = "\r\n--" + boundary + "--\r\n";
  return { boundary, body: concatBytes([asciiBytes(head), bytes, asciiBytes(tail)]) };
}

async function uploadImage(ctx, cfg, bytes, image) {
  const { boundary, body } = multipartImage(bytes, image);
  const url = SERP_BASE + "/image?api_key=" + encodeURIComponent(cfg.apiKey);
  const resp = await ctx.http.post(url, {
    headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
    body,
    timeout: cfg.timeoutMs,
  });
  const text = await resp.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("SerpAPI 上传返回非 JSON（HTTP " + resp.status + "）");
  }
  if (resp.status >= 400 || (data && data.error)) {
    throw new Error("SerpAPI 上传失败：" + String((data && data.error) || text).slice(0, 160));
  }
  const id = str(data && (data.image_id || data.imageId));
  if (!id) throw new Error("SerpAPI 上传没有返回 image_id");
  return id;
}

async function lensSearch(ctx, cfg, imageId) {
  const qs = [
    "engine=google_lens",
    "image_id=" + encodeURIComponent(imageId),
    "type=" + encodeURIComponent(cfg.type),
    "hl=" + encodeURIComponent(cfg.hl),
    "country=" + encodeURIComponent(cfg.country),
    "api_key=" + encodeURIComponent(cfg.apiKey),
  ].join("&");
  const resp = await ctx.http.get(SERP_BASE + "/search.json?" + qs, { timeout: cfg.timeoutMs });
  const text = await resp.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("SerpAPI 搜索返回非 JSON（HTTP " + resp.status + "）");
  }
  if (resp.status >= 400 || (data && data.error)) {
    throw new Error("SerpAPI 搜索失败：" + String((data && data.error) || text).slice(0, 160));
  }
  return data;
}

/* ------------------------------------------------------------ 入口 */

export default async function (ctx) {
  if (!parseRequestUrl(ctx.request.url)) return undefined; // 非目标请求，透传

  const cfg = readConfig(ctx.env);
  if (!cfg.apiKey) return undefined; // 没配 key 就继续用百度

  let bodyText = "";
  try {
    bodyText = await ctx.request.text();
  } catch (_) {
    return undefined;
  }

  const base64 = extractImageBase64(bodyText);
  if (!base64) return undefined;

  const bytes = base64ToBytes(base64);
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) return undefined;

  const image = detectImage(bytes);
  const fail = (message) => {
    if (cfg.notifyOnError) {
      try {
        ctx.notify({ title: "Google 识图不可用", body: String(message).slice(0, 180) + "（已回退百度）" });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }
    return undefined; // 回退百度，视觉搜索不中断
  };

  let imageId;
  try {
    imageId = await uploadImage(ctx, cfg, bytes, image);
  } catch (error) {
    return fail(String((error && error.message) || error));
  }

  let data;
  try {
    data = await lensSearch(ctx, cfg, imageId);
  } catch (error) {
    return fail(String((error && error.message) || error));
  }

  const mapped = toBaidu(data, cfg.thumbProxy);
  return ctx.respond({
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: JSON.stringify(mapped),
  });
}
