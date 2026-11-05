/* Apple 智能换模型（问千问） — Egern 模块脚本
 *
 * 国行 Apple 智能在用户选择「问千问」后，Siri 以明文 HTTPS 直接调用：
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/responses
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/sess_xxx/responses
 * 该域名无证书 pinning，也没有 Private Cloud Compute 的 OHTTP/HPKE 端到端层。
 *
 * 本脚本在请求发出前拦截，改发到自定义 provider，再按原样 SSE 事件壳回包。
 * 覆盖纯文本回答、视觉智能识别、写作工具（compose）三条链路。
 * 画图不接管：识别到画图意图时原样放行，仍由千问出图。
 * 协议细节与抓包依据见 ../markdown/AppleIntelligence-Qwen.md
 */

const TARGET_HOST = "prod-yabuli.qianwen.com";
const PATH_RE = /^\/v1\/sessions(\/sess_[^/?#]+)?\/responses$/;
const STORE_PREFIX = "AIQ:hist:";
const MAX_TURNS = 20;

const DEFAULT_SYSTEM =
  "Your answer must remain neutral, be accurate, and sound natural in spoken language. Output only the final answer.";

// 视觉智能的原始请求里只有图片、没有文字，通用模型需要一句引导
const DEFAULT_VISION_PROMPT =
  "请识别图片中的内容，用中文简洁说明这是什么、有什么可见信息。";

// 写作工具：原文 + 改写要求，回包必须是 {body, refinements[]}
const DEFAULT_WRITING_PROMPT =
  "你是中文写作助手。用户给出原文和改写要求，你按要求重写，保持原意、原语言，不添加原文没有的事实。" +
  '只输出 JSON：{"body":"改写后的全文","refinements":["建议1","建议2","建议3"]}。' +
  "body 要包含完整文本，未改动的部分也照抄，不要省略；" +
  "refinements 是 3 条中文短语，从结构、语气、意象、节奏等角度给出，供用户下一步选择。";

/**
 * Siri 只有听到唤醒词才会把请求发给千问。唤醒词本身不该进 provider，
 * 否则模型会把它当成问题的一部分。
 */
const TRIGGER_RE =
  /^\s*(?:(?:ask\s*)?(?:qwen|chat\s*gpt|chatgpt|gpt)(?![a-z0-9-])|问千问|千问)\s*[,，、:：!！.。]?\s*/i;

function stripTrigger(text) {
  const raw = str(text);
  const m = TRIGGER_RE.exec(raw);
  if (!m) return raw;
  const rest = raw.slice(m[0].length).trim();
  return rest || raw;
}

const COMPOSE_GROUP_PREFIX = "compose_";

/* 画图不接管：命中这些句式就放行给千问，别用自己的模型回答 */
const IMAGE_INTENT = [
  /(画|绘制|生成|做|来|设计)[^，。,.!?]{0,8}(图片|图像|插画|海报|头像|壁纸|照片|表情包|logo|banner)/i,
  /(画|绘制|生成)[一二三四五六七八九十]?[只个张幅条匹种]/,
  /\b(draw|paint|sketch|render|generate|create|make)\b[^.!?]{0,20}\b(image|picture|photo|illustration|poster|avatar|wallpaper|logo)\b/i,
];

function str(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function bool(value, fallback) {
  const v = str(value).toLowerCase();
  if (v === "true" || v === "on" || v === "1") return true;
  if (v === "false" || v === "off" || v === "0") return false;
  return fallback;
}

/**
 * 补全接口地址。用户只写到 /v1 甚至只写域名都能用：
 *   https://api.example.com                        → https://api.example.com/v1/chat/completions
 *   https://api.example.com/v1                     → https://api.example.com/v1/chat/completions
 *   https://gw.example.com/openai                  → https://gw.example.com/openai/v1/chat/completions
 *   https://api.example.com/v1/chat/completions    → 原样
 * 已带 query/fragment 的地址视为完整地址，不做改动。
 */
function buildEndpoint(raw, leaf) {
  let s = str(raw);
  if (!s) return "";
  if (/[?#]/.test(s)) return s;
  s = s.replace(/\/+$/, "");
  const leafPath = "/" + leaf;
  if (s.toLowerCase().endsWith(leafPath)) return s;
  if (/\/v\d+[a-z0-9]*$/i.test(s)) return s + leafPath;
  return s + "/v1" + leafPath;
}

/* ---------------------------------------------------------------- 配置 */

/**
 * 思考强度：只发 OpenAI 兼容的标准字段 reasoning_effort。
 * 不猜 provider、不切写法；默认不发送，避免严格 schema 的上游直接 400。
 * 需要非标准字段（enable_thinking / reasoning.effort / thinking_config 等）时，
 * 用 EXTRA_BODY 自己传。
 */
const EFFORT_LEVELS = ["default", "off", "low", "medium", "high", "xhigh", "max"];

function buildReasoningParams(effort) {
  const lv = str(effort).toLowerCase();
  if (!lv || lv === "default") return {};
  if (!EFFORT_LEVELS.includes(lv)) throw new Error("EFFORT 只能是 " + EFFORT_LEVELS.join(" / "));
  return { reasoning_effort: lv === "off" ? "none" : lv };
}

/** 兜底：允许用户塞任意 provider 私有参数，必须能解析成对象 */
function parseExtraBody(raw) {
  const s = str(raw);
  if (!s) return {};
  let obj;
  try {
    obj = JSON.parse(s);
  } catch (_) {
    throw new Error("EXTRA_BODY 必须是合法 JSON，例如 {\"top_k\":20}");
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("EXTRA_BODY 必须是 JSON 对象");
  }
  return obj;
}

function readConfig(env) {
  const e = env || {};
  const model = str(e.MODEL);
  const rawProvider = str(e.PROVIDER_URL);
  // MODEL 留空 = 不接管，整条请求原样回到千问
  if (model) {
    if (!rawProvider) throw new Error("未填写 PROVIDER_URL（填到 /v1 即可，会自动补 /chat/completions）");
    if (!/^https?:\/\/[^\s]+$/i.test(rawProvider)) throw new Error("PROVIDER_URL 必须是 http(s) 地址");
  }
  const providerUrl = model ? buildEndpoint(rawProvider, "chat/completions") : "";

  const timeout = Number(str(e.TIMEOUT) || "120");
  const chatSeconds = Number(str(e.CHAT_TIMEOUT) || "45");
  const chatTimeoutMs =
    Number.isFinite(chatSeconds) && chatSeconds > 0 ? Math.min(chatSeconds, 300) * 1000 : 45000;
  const searchMode = readSearchMode(e.WEB_SEARCH || "provider");

  return {
    providerUrl,
    apiKey: str(e.API_KEY),
    model,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 300) * 1000 : 120000,
    chatTimeoutMs,
    system: str(e.SYSTEM_PROMPT) || DEFAULT_SYSTEM,
    visionPrompt: str(e.VISION_PROMPT) || DEFAULT_VISION_PROMPT,
    visionModel: str(e.VISION_MODEL) || model,
    writingPrompt: str(e.WRITING_PROMPT) || DEFAULT_WRITING_PROMPT,
    writingModel: str(e.WRITING_MODEL) || model,
    reportModel: str(e.REPORT_MODEL) || "qwenapp-apple-tqa",
    continueUrl: str(e.CONTINUE_URL),
    notifyOnError: bool(e.NOTIFY_ON_ERROR, false),
    reasoning: buildReasoningParams(e.EFFORT),
    extraBody: parseExtraBody(e.EXTRA_BODY),
    searchMode,
    search: searchMode === "provider",
    searchKey: str(e.SEARCH_KEY),
    serpApiKey: str(e.SERPAPI_KEY),
    searchLang: str(e.HL) || "zh-cn",
    searchCountry: str(e.COUNTRY) || "us",
    searchTimeoutMs: Math.max(5000, Math.min(timeout > 0 ? timeout : 20, 30) * 1000),
    searchJudge: bool(e.SEARCH_JUDGE, true),
    searchDebug: bool(e.SEARCH_DEBUG, false),
    judgeModel: str(e.SEARCH_JUDGE_MODEL),
  };
}

/* ------------------------------------------------------------ 请求解析 */

function parseRequestPath(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    return null;
  }
  if (parsed.hostname !== TARGET_HOST) return null;
  const m = PATH_RE.exec(parsed.pathname);
  if (!m) return null;
  return { sessionId: m[1] ? m[1].slice(1) : null, isNew: !m[1] };
}

/**
 * 解析 input。视觉智能只发图片（data:image/jpeg;base64,...），没有文字；
 * 普通对话只有文字。两种都要能取出来。
 */
function extractInput(body) {
  const result = { text: "", images: [] };
  const input = body && body.input;
  if (!Array.isArray(input)) return result;
  const parts = [];
  for (const item of input) {
    const message = item && item.message;
    if (!message) continue;
    if (message.role && message.role !== "user") continue;
    const content = message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (!c) continue;
      if (c.type === "text" && typeof c.text === "string") parts.push(c.text);
      if (c.type === "image_url" && c.image_url && typeof c.image_url.url === "string") {
        result.images.push(c.image_url.url);
      }
      if (c.type === "input_image" && typeof c.image_url === "string") result.images.push(c.image_url);
    }
  }
  result.text = parts.join("\n").trim();
  return result;
}

function extractUserText(body) {
  return extractInput(body).text;
}

/** 有图片时转成 OpenAI 视觉消息；没有文字就补一句引导语 */
function buildUserContent(input, visionPrompt) {
  if (!input.images.length) return input.text || "(空输入)";
  const content = [{ type: "text", text: input.text || visionPrompt }];
  for (const url of input.images) content.push({ type: "image_url", image_url: { url } });
  return content;
}

/* --------------------------------------------------------- 写作工具解析 */

/**
 * 写作工具（WritingTools）走同一端点，靠 configuration 里的
 * response_configuration_group_id 区分，抓到的值是 compose_selectedAndAllText。
 */
function isComposeRequest(body) {
  const configuration = body && body.configuration;
  return str(configuration && configuration.response_configuration_group_id).startsWith(COMPOSE_GROUP_PREFIX);
}

/**
 * compose 的 input 不是自然语言，而是一条 JSON 字符串：
 *   {"originalText":"# **我来一桥上，怀古轻吟风**\n","prompt":"更优雅"}
 * 解析失败时把整段当原文，避免直接丢内容。
 */
function parseComposeInput(text) {
  const raw = str(text);
  if (!raw) return { originalText: "", prompt: "" };
  let obj = null;
  if (raw.charAt(0) === "{") {
    try {
      obj = JSON.parse(raw);
    } catch (_) {
      obj = null;
    }
  }
  if (!obj || typeof obj !== "object") return { originalText: raw, prompt: "" };
  const originalText = str(obj.originalText || obj.original_text || obj.text) || raw;
  const prompt = str(obj.prompt || obj.instruction || obj.request);
  return { originalText, prompt };
}

function composeUserMessage(input) {
  return (
    "原文：\n" + (input.originalText || "(空)") + "\n\n改写要求：" +
    (input.prompt || "保持原意，表达更顺畅、更得体")
  );
}

function stripCodeFence(text) {
  const s = String(text || "").trim();
  const m = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/.exec(s);
  return m ? m[1].trim() : s;
}

/** 模型可能带解释、代码围栏或前后缀，尽量把 {body, refinements} 抠出来 */
function parseComposeResult(answer, fallbackBody) {
  const raw = stripCodeFence(unwrapAnswer(answer));
  let obj = null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      obj = JSON.parse(raw.slice(start, end + 1));
    } catch (_) {
      obj = null;
    }
  }
  const refinements = [];
  if (obj && Array.isArray(obj.refinements)) {
    for (const item of obj.refinements) {
      const s = str(item);
      if (s && refinements.length < 3) refinements.push(s);
    }
  }
  const body = str(obj && obj.body) || str(fallbackBody) || raw;
  return { body, refinements };
}

/** 回包内层就是这段 JSON 字符串，字段顺序与抓包一致 */
function buildComposeValue(body, refinements) {
  return JSON.stringify({ body: str(body), refinements: refinements || [] });
}

/* ------------------------------------------------------------ 上游调用 */

function pickAnswer(data) {
  if (!data) return "";
  // OpenAI Chat Completions
  const choice = Array.isArray(data.choices) ? data.choices[0] : null;
  if (choice && choice.message && typeof choice.message.content === "string") return choice.message.content;
  // OpenAI Responses
  if (typeof data.output_text === "string") return data.output_text;
  if (Array.isArray(data.output)) {
    const chunks = [];
    for (const item of data.output) {
      const content = item && item.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) if (c && typeof c.text === "string") chunks.push(c.text);
    }
    if (chunks.length) return chunks.join("");
  }
  return "";
}

/** 上游若返回 url_citation 引用，透传给 Siri 的来源卡片 */
function pickAnnotations(data) {
  const out = [];
  const push = (a) => {
    if (!a || a.type !== "url_citation" || !a.url_citation || !a.url_citation.url) return;
    const url = str(a.url_citation.url);
    out.push({
      type: "url_citation",
      url_citation: { index: out.length, title: str(a.url_citation.title) || url, url },
    });
  };
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  const message = choice && choice.message;
  if (message && Array.isArray(message.annotations)) message.annotations.forEach(push);
  if (data && Array.isArray(data.citations)) {
    for (const c of data.citations) {
      if (typeof c === "string") push({ type: "url_citation", url_citation: { title: c, url: c } });
      else push(c);
    }
  }
  return out;
}

/* 模型有时会把答案包成 {"content": "..."}，剥一层 */
function unwrapAnswer(text) {
  const t = String(text || "").trim();
  if (!t.startsWith("{") || !t.endsWith("}")) return t;
  try {
    const o = JSON.parse(t);
    if (o && typeof o.content === "string") return o.content;
  } catch (_) {
    /* 不是 JSON，原样返回 */
  }
  return t;
}

function errorText(data, raw, status) {
  const detail =
    (data && data.error && (data.error.message || data.error)) ||
    (data && data.message) ||
    raw;
  return "上游 HTTP " + status + "：" + String(detail).slice(0, 200);
}

const NO_EFFORT_PREFIX = "AIQ:noeffort:";
const NO_SEARCH_PREFIX = "AIQ:nosearch:";
const NO_EFFORT_TTL_MS = 60 * 60 * 1000;
// OpenAI 兼容的联网搜索写法；上游不认时会被降级移除
const SEARCH_PARAM = { tools: [{ type: "web_search" }] };

/** Egern 的 http 客户端在非 2xx 时可能直接抛错，状态码只能从消息里抠 */
function statusFromError(error) {
  const direct = Number(error && error.status);
  if (Number.isFinite(direct) && direct >= 400) return direct;
  const m = /status[^\d]{0,4}(\d{3})/i.exec(String((error && error.message) || error));
  return m ? Number(m[1]) : 0;
}

function capabilityKey(prefix, cfg, model, extra) {
  return prefix + cfg.providerUrl + "|" + (model || cfg.model) + (extra ? "|" + extra : "");
}

function isSuppressed(ctx, key) {
  try {
    const hit = ctx.storage.getJSON(key);
    return Boolean(hit && hit.at && Date.now() - hit.at < NO_EFFORT_TTL_MS);
  } catch (_) {
    return false;
  }
}

function markSuppressed(ctx, key) {
  try {
    ctx.storage.setJSON(key, { at: Date.now() });
  } catch (_) {
    /* 存储不可用就每次重试，不影响回答 */
  }
}

/** 上游拒了可选参数：降级重试，并明确告诉用户丢了什么 */
function notifyDegraded(ctx, model, status, dropped) {
  try {
    ctx.notify({
      title: "部分能力未生效",
      body:
        (model || "当前模型") +
        " 拒绝了 " + dropped.join("、") + "（HTTP " + (status || "?") + "），已降级重试",
    });
  } catch (_) {
    /* 通知失败忽略 */
  }
}

async function postChat(ctx, cfg, messages, model, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  // 顺序：先铺 EXTRA_BODY 的私有参数，再压上协议核心字段，最后叠加可选能力，
  // 避免用户手写的 JSON 覆盖 model / messages / stream 把请求拆坏。
  const core = {
    ...(cfg.extraBody || {}),
    model: model || cfg.model,
    messages,
    stream: false,
  };
  const modelName = core.model;

  const send = async (extra) => {
    const body = { ...core, ...extra };
    const resp = await ctx.http.post(cfg.providerUrl, { headers, body, timeout: cfg.chatTimeoutMs });
    const raw = await resp.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      const parseError = new Error("上游返回非 JSON（HTTP " + resp.status + "）：" + String(raw).slice(0, 120));
      parseError.status = resp.status;
      throw parseError;
    }
    if (resp.status >= 400) {
      const error = new Error(errorText(data, raw, resp.status));
      error.status = resp.status;
      throw error;
    }
    return data;
  };

  const effort = cfg.reasoning || {};
  // 抑制按「上下文 + 档位」隔离：带图失败不该影响纯文本，换档位也应重新尝试
  const context = options.context || "chat";
  const effortValue = str(effort.reasoning_effort);
  const effortKeyName = capabilityKey(NO_EFFORT_PREFIX, cfg, modelName, context + ":" + effortValue);
  const searchKeyName = capabilityKey(NO_SEARCH_PREFIX, cfg, modelName, cfg.searchMode);
  const effortWanted = Object.keys(effort).length > 0 && !isSuppressed(ctx, effortKeyName);
  const searchWanted =
    Boolean(cfg.search) && options.search !== false && !isSuppressed(ctx, searchKeyName);

  // 降级顺序：全量 → 只联网 → 只思考 → 裸请求；只在 400/422 时往下走
  const plans = [];
  const seen = new Set();
  const addPlan = (search, wantEffort) => {
    const id = (search ? 1 : 0) + "-" + (wantEffort ? 1 : 0);
    if (seen.has(id)) return;
    seen.add(id);
    plans.push({ search, effort: wantEffort });
  };
  addPlan(searchWanted, effortWanted);
  addPlan(searchWanted, false);
  addPlan(false, effortWanted);
  addPlan(false, false);

  let lastError = null;
  for (const plan of plans) {
    const extra = { ...(plan.search ? SEARCH_PARAM : {}), ...(plan.effort ? effort : {}) };
    try {
      const data = await send(extra);
      const dropped = [];
      if (searchWanted && !plan.search) {
        dropped.push("联网搜索");
        markSuppressed(ctx, searchKeyName);
      }
      if (effortWanted && !plan.effort) {
        dropped.push("思考强度");
        markSuppressed(ctx, effortKeyName);
      }
      if (dropped.length) notifyDegraded(ctx, modelName, statusFromError(lastError), dropped);
      return data;
    } catch (error) {
      const status = statusFromError(error);
      const message = String((error && error.message) || error);
      if (!status && /timed? ?out|timeout|ETIMEDOUT|abort/i.test(message)) {
        const seconds = Math.round(cfg.chatTimeoutMs / 1000);
        const timeoutError = new Error("上游超过 " + seconds + " 秒没有响应（可调大 CHAT_TIMEOUT）");
        timeoutError.status = 0;
        throw timeoutError;
      }
      if (status !== 400 && status !== 422) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

/** 调用对话接口，返回文本与引用 */
async function callUpstream(ctx, cfg, messages, options = {}) {
  const data = await postChat(ctx, cfg, messages, options.model || cfg.model, {
    search: options.search,
    context: options.context,
  });
  return {
    answer: unwrapAnswer(pickAnswer(data)),
    annotations: pickAnnotations(data),
  };
}

/* --------------------------------------------------------------- 画图放行 */

function looksLikeImageRequest(text) {
  const t = str(text);
  if (!t) return false;
  return IMAGE_INTENT.some((re) => re.test(t));
}

/* --------------------------------------------------------------- 会话 */

function loadHistory(ctx, sessionId) {
  if (!sessionId) return [];
  try {
    const cached = ctx.storage.getJSON(STORE_PREFIX + sessionId);
    if (cached && Array.isArray(cached.messages)) return cached.messages;
  } catch (_) {
    /* 存储不可用就当没有历史 */
  }
  return [];
}

function saveHistory(ctx, sessionId, messages) {
  if (!sessionId) return;
  try {
    ctx.storage.setJSON(STORE_PREFIX + sessionId, {
      messages: messages.slice(-MAX_TURNS * 2),
      updatedAt: Date.now(),
    });
  } catch (_) {
    /* 存储不可用不影响本次回答 */
  }
}

/* ----------------------------------------------------------- SSE 构造 */

function makeSummary(text, limit = 28) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= limit ? t : t.slice(0, limit) + "…";
}

function hex32() {
  let s = "";
  for (let i = 0; i < 32; i += 1) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function uuid() {
  const a = hex32();
  return `${a.slice(0, 8)}-${a.slice(8, 12)}-${a.slice(12, 16)}-${a.slice(16, 20)}-${a.slice(20, 32)}`;
}

function event(name, payload) {
  return `event: ${name}\ndata: ${JSON.stringify({ [name]: payload, type: name })}\n\n`;
}

function chunkString(s, size) {
  const out = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out.length ? out : [""];
}

function innerPayload(answer) {
  return JSON.stringify({
    content: answer,
    isRequestingUserInput: false,
    summary: makeSummary(answer),
    suggestions: ["", "", ""],
  });
}

function textContent(value, annotations) {
  return { text: { annotations: annotations || [], value }, type: "text" };
}

function textMessageItem(value, annotations) {
  return { type: "message", message: { role: "assistant", content: [textContent(value, annotations)] } };
}

/** 打开响应：session.created（仅新会话）+ response.created + choices.added */
function openSSE(opts) {
  const now = Math.floor(Date.now() / 1000);
  const out = [];
  if (opts.isNew) {
    out.push(event("session.created", {
      expires_at: now + 600,
      expires_after: { seconds: 600, anchor: "last_active_at" },
      last_active_at: now,
      created_at: now,
      id: opts.sessionId,
      object: "session",
    }));
  }
  out.push(event("session.response.created", {
    notices: [],
    session_id: opts.sessionId,
    created_at: now,
    model: opts.reportModel,
    id: opts.respId,
    choices: [],
    object: "session.response",
  }));
  out.push(event("session.response.choices[].added", {
    index: 0,
    choice: { output: [], id: opts.choiceId, continue_url: opts.continueUrl, status: "incomplete" },
  }));
  return { out, now };
}

function closeSSE(out, opts) {
  const completed = {
    index: 0,
    choice: {
      output: opts.output,
      moderation: [],
      id: opts.choiceId,
      continue_url: opts.continueUrl,
      status: "completed",
    },
  };
  out.push(event("session.response.choices[].completed", completed));
  out.push(event("session.response.choices[].done", completed));
  out.push(event("session.response.done", {
    notices: [],
    session_id: opts.sessionId,
    created_at: opts.now,
    model: opts.reportModel,
    id: opts.respId,
    choices: [completed.choice],
    object: "session.response",
  }));
  return out.join("");
}

/** 纯文本回答：14 个事件（新会话 15 个） */
function buildTextSSE(sessionId, answer, options = {}) {
  const base = {
    sessionId,
    respId: "resp_" + hex32(),
    choiceId: "choice_" + uuid(),
    reportModel: options.reportModel || "qwenapp-apple-tqa",
    continueUrl: options.continueUrl || "",
    isNew: Boolean(options.isNew),
  };
  const { out, now } = openSSE(base);
  const inner = typeof options.value === "string" ? options.value : innerPayload(answer);
  const annotations = options.annotations || [];

  out.push(event("session.response.choices[].items[].added", {
    choice_index: 0,
    item: { type: "message", message: { role: "assistant", content: [] } },
    index: 0,
  }));
  out.push(event("session.response.choices[].items[].message.content[].added", {
    item_index: 0,
    choice_index: 0,
    index: 0,
    content: textContent(""),
  }));
  for (const piece of chunkString(inner, 40)) {
    out.push(event("session.response.choices[].items[].message.content[].text.value.delta", {
      item_index: 0,
      choice_index: 0,
      content_index: 0,
      delta: piece,
    }));
  }
  out.push(event("session.response.choices[].items[].message.content[].text.value.done", {
    item_index: 0,
    choice_index: 0,
    content_index: 0,
    value: inner,
  }));
  // 引用卡片：只在有 url_citation 时出现，普通回答没有这一段
  for (let i = 0; i < annotations.length; i += 1) {
    out.push(event("session.response.choices[].items[].message.content[].text.annotations[].added", {
      annotation: annotations[i],
      item_index: 0,
      choice_index: 0,
      content_index: 0,
      index: i,
    }));
  }
  out.push(event("session.response.choices[].items[].message.content[].done", {
    item_index: 0,
    choice_index: 0,
    index: 0,
    content: textContent(inner, annotations),
  }));
  out.push(event("session.response.choices[].items[].done", {
    choice_index: 0,
    item: textMessageItem(inner, annotations),
    index: 0,
  }));

  return closeSSE(out, { ...base, now, output: [textMessageItem(inner, annotations)] });
}

function sseResponse(sessionId, sseBody) {
  return {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream;charset=UTF-8",
      "Cache-Control": "no-cache",
      "x-session-id": sessionId,
      "x-request-id": hex32(),
    },
    body: sseBody,
  };
}

/* ==================================================== 借用千问自己的搜索
 *
 * 千问的联网搜索不是独立 API，而是挂在对话接口上的 server_tools.browser。
 * search= qwen 时先把同一个请求再打一次千问（保留原 body 与 Authorization），
 * 只让它做检索、吐出标题+链接；拿到来源后再交给 provider 生成回答，
 * 并把来源按 url_citation 填回 Siri 的引用卡片。
 */

const SEARCH_MAX_SOURCES = 5;
const SEARCH_TIMEOUT_MS = 30000;
const SEARCH_HEADER = "x-aiq-search";

function readSearchMode(value) {
  const v = str(value).toLowerCase();
  if (v === "qwen" || v === "tavily" || v === "serpapi") return v;
  if (v === "off" || v === "false" || v === "0" || v === "no") return "off";
  return "provider";
}

function searchInstruction(question) {
  return (
    "只做联网检索，不要回答问题，也不要总结。\n" +
    "搜索：" + question + "\n" +
    '只输出 JSON 数组（最多 5 条），格式 [{"title":"标题","url":"https://..."}]，不要代码块、不要解释。'
  );
}

function headerValue(headers, name) {
  if (!headers) return "";
  try {
    if (typeof headers.get === "function") return str(headers.get(name));
    const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (Array.isArray(direct)) return str(direct[0]);
    return str(direct);
  } catch (_) {
    return "";
  }
}

/** 千问侧是 SSE：取 text.value.done 的完整内层 JSON，同时收集 annotations */
function parseQwenStream(text) {
  const out = { value: "", annotations: [] };
  for (const block of String(text || "").split("\n\n")) {
    let name = "";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) name = line.slice(7).trim();
      else if (line.startsWith("data: ")) data += line.slice(6);
    }
    if (!data) continue;
    let payload = null;
    try {
      payload = JSON.parse(data);
    } catch (_) {
      continue;
    }
    const body = name && payload && payload[name] !== undefined ? payload[name] : payload;
    if (!body) continue;
    if (name.endsWith("text.value.done") && typeof body.value === "string") out.value = body.value;
    if (name.endsWith("annotations[].added") && body.annotation) out.annotations.push(body.annotation);
  }
  return out;
}

function sourcesFromAnnotations(annotations) {
  const out = [];
  for (const a of annotations || []) {
    const c = a && a.url_citation;
    if (!c || !str(c.url)) continue;
    out.push({ title: str(c.title) || str(c.url), url: str(c.url) });
  }
  return out;
}

function sourcesFromText(text) {
  const raw = str(text);
  const out = [];
  if (!raw) return out;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const arr = JSON.parse(raw.slice(start, end + 1));
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const url = str(item && (item.url || item.link));
          if (!url) continue;
          out.push({ title: str(item.title) || url, url });
        }
      }
    } catch (_) {
      /* 落到下面按链接抓 */
    }
  }
  if (!out.length) {
    const re = /https?:\/\/[^\s"')]+/g;
    let m;
    while ((m = re.exec(raw)) && out.length < SEARCH_MAX_SOURCES) out.push({ title: m[0], url: m[0] });
  }
  return out;
}

function dedupeSources(list) {
  const seen = new Set();
  const out = [];
  for (const s of list || []) {
    if (!s || !str(s.url) || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push({ title: str(s.title) || str(s.url), url: str(s.url), snippet: str(s.snippet) });
    if (out.length >= SEARCH_MAX_SOURCES) break;
  }
  return out;
}

/**
 * Siri 不渲染 markdown，正文里堆裸链接很难看。
 * 来源交给 annotations 的引用卡片，正文只保留文字。
 */
function cleanAnswer(text) {
  let out = String(text || "");
  // [标题](链接) -> 标题；[链接](链接) -> 空
  out = out.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (m, label, url) => {
    if (!label || label === url || /^https?:\/\//.test(label)) return "";
    return label;
  });
  // 裸链接，含 [] （）包裹
  out = out.replace(/[\[(（]?https?:\/\/[^\s\])）]+[\])）]?/g, "");
  // 清理留下的空壳与多余空白
  out = out.replace(/[（(]\s*[）)]/g, "");
  out = out.replace(/\[\s*\]/g, "");
  out = out.replace(/[ \t]{2,}/g, " ");
  out = out.replace(/\s+([,，。.;；:：])/g, "$1");
  out = out.replace(/([,，、。])\1+/g, "$1");
  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/([。！？!?])[。！？!?]+/g, "$1");
  return out.trim();
}

function todayText() {
  const d = new Date();
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function buildSearchContext(sources) {
  const rows = sources
    .map((s, i) => {
      const head = i + 1 + ". " + s.title + "\n   " + s.url;
      const extra = str(s.snippet).slice(0, 200);
      return extra ? head + "\n   " + extra : head;
    })
    .join("\n");
  return (
    "以下是刚刚联网检索到的实时来源（检索时间 " +
    todayText() +
    "）。时效性问题必须以此为准：与你的训练知识冲突时一律采用这些来源，不要凭记忆作答；正文不要写链接，来源卡片由客户端展示。\n" +
    rows
  );
}

/** 不接管回答时，把检索结果并进原请求，直接交给千问 */
function injectSources(body, sources) {
  const block = buildSearchContext(sources);
  const input = Array.isArray(body && body.input) ? body.input : [];
  for (let i = input.length - 1; i >= 0; i -= 1) {
    const content = input[i] && input[i].message && input[i].message.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && part.type === "text" && typeof part.text === "string") {
        part.text = part.text + "\n\n" + block;
        return body;
      }
    }
  }
  return body;
}

function toSourceAnnotations(sources) {
  return sources.map((s, i) => ({
    type: "url_citation",
    url_citation: { index: i, title: s.title, url: s.url },
  }));
}

function dedupeAnnotations(list) {
  const seen = new Set();
  const out = [];
  for (const a of list || []) {
    const url = str(a && a.url_citation && a.url_citation.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      type: "url_citation",
      url_citation: {
        index: out.length,
        title: str(a.url_citation.title) || url,
        url,
      },
    });
  }
  return out;
}

/** 再打一次千问，只要来源；失败由调用方决定降级 */
async function qwenSearch(ctx, question, rawBody) {
  const parsed = rawBody ? JSON.parse(rawBody) : {};
  // 检索用独立的新会话，避免把检索指令写进正在进行的对话
  const url = String(ctx.request.url || "").replace(/\/v1\/sessions\/sess_[^/?#]+\/responses/, "/v1/sessions/responses");
  for (const key of Object.keys(parsed)) {
    if (/^(session_?id|previous_response_id|thread_id)$/i.test(key)) delete parsed[key];
  }

  const headers = { "Content-Type": "application/json", [SEARCH_HEADER]: "1" };
  const auth = headerValue(ctx.request.headers, "authorization");
  if (auth) headers.Authorization = auth;
  const accept = headerValue(ctx.request.headers, "accept");
  if (accept) headers.Accept = accept;

  const body = {
    ...parsed,
    input: [
      {
        type: "message",
        message: { role: "user", content: [{ text: searchInstruction(question), type: "text" }] },
      },
    ],
  };

  const resp = await ctx.http.post(url, { headers, body, timeout: SEARCH_TIMEOUT_MS });
  const text = await resp.text();
  if (resp.status >= 400) throw new Error("千问搜索 HTTP " + resp.status);

  const stream = parseQwenStream(text);
  let content = "";
  try {
    content = str(JSON.parse(stream.value).content);
  } catch (_) {
    content = str(stream.value);
  }
  // 千问自己判断不需要联网时会回 []
  if (/^\[\s*\]$/.test(content)) return [];
  const sources = dedupeSources([...sourcesFromAnnotations(stream.annotations), ...sourcesFromText(content)]);
  if (!sources.length) throw new Error("千问搜索没有返回来源");
  return sources;
}

/* ------------------------------------------------------------ 要不要搜 */

const SEARCH_JUDGE_PROMPT = "判断用户问题是否需要联网检索最新或实时信息。只回答 yes 或 no，不要解释。";

// 判断模型偶尔回空（推理模型把预算花在 reasoning 上），兜底按时间敏感词判断
const TIME_SENSITIVE_RE = new RegExp(
  [
    "搜一下|搜搜|搜下|搜索|查一下|查查|查下|查询|找一下|找找|帮我搜|帮我查|上网|联网|百度|谷歌",
    // 只说一个「搜」也算：句首，或后面跟空格/标点；排除 搜集/搜狗/搜罗
    String.raw`^搜(?![索狗集罗身])|搜[\s，。,.!！?？]`,
    String.raw`\bsearch\b|\bgoogle\b|\blook\s*up\b|\blookup\b|\bbrowse\b|\bweb\s*search\b|\bfind\s+out\b`,
    "今天|今日|现在|目前|最新|近期|刚刚|本周|新闻|消息|股价|汇率|比分|天气|气温|价格|多少钱|发布|上市|开售|评测",
    String.raw`\blatest\b|\btoday\b|\bcurrent\b|\bnews\b|\bprice\b|\bweather\b|\bscore\b|\brelease\b`,
    String.raw`20[2-9]\d年?\d*月?`,
  ].join("|"),
  "i",
);

function looksTimeSensitive(question) {
  return TIME_SENSITIVE_RE.test(str(question));
}

/**
 * Tavily / SerpAPI 只负责搜，不负责判断，所以先用 provider 做一次极小的分类调用。
 * 关掉推理（reasoning_effort: none）避免 20 秒的分类；判断不出发音时退回关键词。
 */
function newSessionUrl(url) {
  return String(url || "").replace(/\/v1\/sessions\/sess_[^/?#]+\/responses/, "/v1/sessions/responses");
}

function searchHeaders(ctx) {
  const headers = { "Content-Type": "application/json", [SEARCH_HEADER]: "1" };
  const auth = headerValue(ctx.request.headers, "authorization");
  if (auth) headers.Authorization = auth;
  const accept = headerValue(ctx.request.headers, "accept");
  if (accept) headers.Accept = accept;
  return headers;
}

/** 没接管回答时没有 provider 模型可用，判断交给千问本身 */
async function qwenJudge(ctx, question) {
  const resp = await ctx.http.post(newSessionUrl(ctx.request.url), {
    headers: searchHeaders(ctx),
    body: {
      input: [
        {
          type: "message",
          message: { role: "user", content: [{ text: SEARCH_JUDGE_PROMPT + "\n问题：" + question, type: "text" }] },
        },
      ],
    },
    timeout: SEARCH_TIMEOUT_MS,
  });
  if (resp.status >= 400) return "";
  const stream = parseQwenStream(await resp.text());
  try {
    return str(JSON.parse(stream.value).content);
  } catch (_) {
    return str(stream.value);
  }
}

async function judgeNeedsSearch(ctx, cfg, question) {
  if (!cfg.model) {
    try {
      const text = await qwenJudge(ctx, question);
      if (/^\s*(yes|是|需要)/i.test(text)) return true;
      if (/^\s*(no|否|不需要)/i.test(text)) return false;
    } catch (_) {
      /* 落到关键词 */
    }
    return looksTimeSensitive(question);
  }

  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  const body = {
    model: cfg.judgeModel || cfg.model,
    messages: [
      { role: "system", content: SEARCH_JUDGE_PROMPT },
      { role: "user", content: question },
    ],
    stream: false,
    max_tokens: 8,
    temperature: 0,
    reasoning_effort: "none",
  };
  try {
    const resp = await ctx.http.post(cfg.providerUrl, {
      headers,
      body,
      timeout: Math.min(cfg.chatTimeoutMs, 15000),
    });
    if (resp.status >= 400) return looksTimeSensitive(question);
    const text = str(pickAnswer(JSON.parse(await resp.text())));
    if (/^\s*(yes|是|需要)\b/i.test(text)) return true;
    if (/^\s*(no|否|不需要)\b/i.test(text)) return false;
    return looksTimeSensitive(question);
  } catch (_) {
    return looksTimeSensitive(question);
  }
}

/* ------------------------------------------------------- 第三方检索 API */

function searchKeyOf(cfg) {
  // SerpAPI 优先用识图那把 key，避免把 Tavily 的 key 误发过去
  if (cfg.searchMode === "serpapi") return str(cfg.serpApiKey) || str(cfg.searchKey);
  return str(cfg.searchKey);
}

async function tavilySearch(ctx, cfg, question) {
  const key = searchKeyOf(cfg);
  if (!key) throw new Error("未填写 SEARCH_KEY（Tavily）");
  const resp = await ctx.http.post("https://api.tavily.com/search", {
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: {
      query: question,
      max_results: SEARCH_MAX_SOURCES,
      search_depth: "basic",
      include_answer: false,
    },
    timeout: cfg.searchTimeoutMs,
  });
  const raw = await resp.text();
  if (resp.status >= 400) throw new Error("Tavily HTTP " + resp.status + "：" + String(raw).slice(0, 120));
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error("Tavily 返回非 JSON");
  }
  const rows = Array.isArray(data && data.results) ? data.results : [];
  return dedupeSources(
    rows.map((r) => ({ title: str(r.title) || str(r.url), url: str(r.url), snippet: str(r.content) })),
  );
}

async function serpapiSearch(ctx, cfg, question) {
  const key = searchKeyOf(cfg);
  if (!key) throw new Error("未填写 SEARCH_KEY（SerpAPI）");
  const qs = [
    "engine=google",
    "q=" + encodeURIComponent(question),
    "num=" + SEARCH_MAX_SOURCES,
    "hl=" + encodeURIComponent(cfg.searchLang || "zh-cn"),
    "gl=" + encodeURIComponent(cfg.searchCountry || "us"),
    "api_key=" + encodeURIComponent(key),
  ].join("&");
  const resp = await ctx.http.get("https://serpapi.com/search.json?" + qs, { timeout: cfg.searchTimeoutMs });
  const raw = await resp.text();
  if (resp.status >= 400) throw new Error("SerpAPI HTTP " + resp.status + "：" + String(raw).slice(0, 120));
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error("SerpAPI 返回非 JSON");
  }
  if (data && data.error) throw new Error("SerpAPI：" + String(data.error).slice(0, 120));
  const rows = Array.isArray(data && data.organic_results) ? data.organic_results : [];
  return dedupeSources(
    rows.map((r) => ({ title: str(r.title) || str(r.link), url: str(r.link), snippet: str(r.snippet) })),
  );
}

/* ------------------------------------------------------------ 入口 */

/**
 * 写作工具（compose）：input 是 {originalText, prompt}，回包必须是
 * {"body":"…","refinements":["…"]} 的 JSON 字符串，塞进同样的文本 SSE 壳。
 * 与 Siri 对话不同，这里不读写会话历史：原文每次都由客户端带上来。
 */
async function handleCompose(ctx, cfg, body, sessionId, isNew) {
  const input = parseComposeInput(extractUserText(body));
  const options = { isNew, reportModel: cfg.reportModel, continueUrl: cfg.continueUrl };

  const notify = (message) => {
    if (!cfg.notifyOnError) return;
    try {
      ctx.notify({ title: "写作工具换模型", body: String(message).slice(0, 200) });
    } catch (_) {
      /* 通知失败忽略 */
    }
  };

  let answer = "";
  let failure = "";
  try {
    const data = await postChat(
      ctx,
      cfg,
      [
        { role: "system", content: cfg.writingPrompt },
        { role: "user", content: composeUserMessage(input) },
      ],
      cfg.writingModel,
      { search: false, context: "compose" },
    );
    answer = pickAnswer(data);
  } catch (error) {
    failure = String((error && error.message) || error);
  }

  if (failure) {
    notify("写作后端不可用：" + failure);
    const value = buildComposeValue("（写作后端不可用：" + failure + "）", []);
    return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, "", { ...options, value })));
  }

  if (!str(answer)) {
    const value = buildComposeValue("（上游没有返回内容）", []);
    return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, "", { ...options, value })));
  }

  const parsed = parseComposeResult(answer, input.originalText);
  const value = buildComposeValue(parsed.body, parsed.refinements);
  return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, parsed.body, { ...options, value })));
}


/* ============================================================ 百度识图 → Google Lens
 *
 * 视觉搜索 / 以图搜图走的是百度千帆：
 *   POST https://qianfan.baidubce.com/v1/images/search
 *   body: image=<urlencoded base64>
 * 这里把它改接到 SerpAPI 的 google_lens，再把结果映射回百度 schema。
 * 没配 SERPAPI_KEY、或任何一步失败，都原样放行给百度。
 */

const BAIDU_HOST = "qianfan.baidubce.com";
const BAIDU_PATH = "/v1/images/search";
const SERP_BASE = "https://serpapi.com";
const MAX_UPLOAD_BYTES = 500 * 1024; // SerpAPI /image 上限 500KB
const MAX_RES_ITEMS = 60;
const MAX_SIM_ITEMS = 85;

function readLensConfig(env) {
  const e = env || {};
  return {
    apiKey: str(e.SERPAPI_KEY),
    hl: str(e.HL) || "zh-cn",
    country: str(e.COUNTRY) || "us",
    type: str(e.LENS_TYPE) || "all",
    notifyOnError: bool(e.NOTIFY_ON_ERROR, true),
    timeoutMs: (Number(str(e.TIMEOUT) || "45") || 45) * 1000,
  };
}

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

function detectImage(bytes) {
  if (bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return { ext: "png", mime: "image/png" };
  }
  if (bytes.length > 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  return { ext: "jpg", mime: "image/jpeg" };
}

function isBaiduImageRequest(url) {
  try {
    const u = new URL(url);
    return u.hostname === BAIDU_HOST && u.pathname === BAIDU_PATH;
  } catch (_) {
    return false;
  }
}

/** 百度送的是 application/x-www-form-urlencoded，只有一个 image 字段 */
function extractImageBase64(bodyText) {
  const raw = String(bodyText || "");
  if (!raw) return "";
  for (const pair of raw.split("&")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    if (pair.slice(0, eq) !== "image") continue;
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

function itemFromVisual(v) {
  const w = Number(v.image_width || v.thumbnail_width || 0) || 0;
  const h = Number(v.image_height || v.thumbnail_height || 0) || 0;
  return {
    item_cate: "CATE_SIMI",
    site_name: str(v.source),
    height: h,
    width: w,
    title: str(v.title),
    thumburl: str(v.thumbnail || v.image),
    fromurl: str(v.link),
    objurl: str(v.image || v.thumbnail),
  };
}

function itemFromOther(v) {
  return {
    item_cate: "CATE_SIMI",
    contsign: "",
    title: str(v.title),
    score: 0,
    thumburl: str(v.thumbnail),
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
function toBaidu(data) {
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
        res_items: visual.slice(0, MAX_RES_ITEMS).map((v) => itemFromVisual(v)),
        sim_items: exact.concat(organic).slice(0, MAX_SIM_ITEMS).map((v) => itemFromOther(v)),
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

async function handleBaiduImage(ctx) {
  const cfg = readLensConfig(ctx.env);
  if (!cfg.apiKey) return undefined; // 没配 key 就继续用百度

  let bodyText = "";
  try {
    bodyText = await ctx.request.text();
  } catch (_) {
    return undefined;
  }

  // 读过 body 之后，任何回退都必须把它显式带回去，否则百度收到空 body
  const passthrough = () => (bodyText ? { body: bodyText } : undefined);

  const base64 = extractImageBase64(bodyText);
  if (!base64) return passthrough();

  const bytes = base64ToBytes(base64);
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) return passthrough();

  const image = detectImage(bytes);
  const fail = (message) => {
    if (cfg.notifyOnError) {
      try {
        ctx.notify({ title: "Google 识图不可用", body: String(message).slice(0, 180) + "（已回退百度）" });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }
    return passthrough();
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

  return ctx.respond({
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: JSON.stringify(toBaidu(data)),
  });
}

export default async function (ctx) {
  // 自己发起的检索请求可能再次被本脚本匹配到，带标记的直接透传，避免递归
  if (headerValue(ctx.request.headers, SEARCH_HEADER)) return undefined;

  // 视觉搜索（百度识图）与 Siri 对话是两条完全不同的链路，先按域名分流
  if (isBaiduImageRequest(ctx.request.url)) return handleBaiduImage(ctx);

  const parsed = parseRequestPath(ctx.request.url);
  if (!parsed) return undefined; // 非目标路径，透传

  const sessionId = parsed.sessionId || "sess_" + uuid();

  let raw = "";
  let body = {};
  try {
    raw = await ctx.request.text();
    body = raw ? JSON.parse(raw) : {};
  } catch (_) {
    body = {};
  }

  const input = extractInput(body);
  input.text = stripTrigger(input.text);
  const userText = input.text;
  const hasImage = input.images.length > 0;

  let cfg;
  try {
    cfg = readConfig(ctx.env);
  } catch (error) {
    return ctx.respond(sseResponse(sessionId,
      buildTextSSE(sessionId, "配置错误：" + error.message, { isNew: parsed.isNew })));
  }

  // 写作工具（compose）与 Siri 对话共用端点，但报文结构完全不同，先分流
  if (isComposeRequest(body)) {
    // MODEL 留空 = 不接管，写作工具也原样交给千问
    if (!cfg.model) return raw ? { body: raw } : undefined;
    return handleCompose(ctx, cfg, body, sessionId, parsed.isNew);
  }

  // 画图不接管：命中画图句式就原样放行给千问。
  // body 已被脚本读过，必须显式带回，否则上游可能收到空 body。
  if (!hasImage && looksLikeImageRequest(userText)) {
    return raw ? { body: raw } : undefined;
  }

  const history = loadHistory(ctx, sessionId);
  // qwen / tavily / serpapi 三种来源共用同一套判断：由模型决定要不要搜
  let sources = [];
  const engineMode = cfg.searchMode;
  // 模型留空时 qwen 档直接走千问原生（不重复检索）；tavily/serpapi 仍然按所选执行
  const useEngine =
    engineMode === "tavily" || engineMode === "serpapi" || (Boolean(cfg.model) && engineMode === "qwen");
  if (!hasImage && userText && useEngine) {
    const label = engineMode === "qwen" ? "千问" : engineMode === "tavily" ? "Tavily" : "SerpAPI";
    let needSearch = true;
    try {
      // 明确带时效词的问题直接搜，省掉一次判断往返（Siri 等不了太久）
      needSearch = cfg.searchJudge
        ? looksTimeSensitive(userText) || (await judgeNeedsSearch(ctx, cfg, userText))
        : true;
      if (needSearch) {
        if (engineMode === "qwen") sources = await qwenSearch(ctx, userText, raw);
        else if (engineMode === "tavily") sources = await tavilySearch(ctx, cfg, userText);
        else sources = await serpapiSearch(ctx, cfg, userText);
      }
    } catch (error) {
      try {
        ctx.notify({
          title: label + "搜索不可用",
          body: String((error && error.message) || error).slice(0, 180) + "（本次回答没有来源）",
        });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }

    // 检索跑通但没结果时也要说一声，否则看起来像“搜了但没用”
    if (needSearch && !sources.length) {
      try {
        ctx.notify({ title: label + " 没有返回结果", body: "已按无来源回答" });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }
    if (cfg.searchDebug) {
      try {
        ctx.notify({
          title: "搜索调试",
          body: label + "｜判断 " + (needSearch ? "yes" : "no") + "｜来源 " + sources.length,
        });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }
  }

  // MODEL 留空：回答仍由千问生成；只有 tavily/serpapi 的检索结果需要塞回去
  if (!cfg.model) {
    if (!sources.length) return raw ? { body: raw } : undefined;
    return { body: JSON.stringify(injectSources(body, sources)) };
  }

  const systemText =
    cfg.system +
    "\n\n当前日期：" +
    todayText() +
    (sources.length ? "\n\n" + buildSearchContext(sources) : "");
  const messages = [{ role: "system", content: systemText }];
  for (const turn of history) {
    if (turn && turn.role && typeof turn.content === "string") messages.push(turn);
  }
  messages.push({ role: "user", content: buildUserContent(input, cfg.visionPrompt) });

  const finish = (sseBody, answerForHistory) => {
    saveHistory(ctx, sessionId, [
      ...history,
      { role: "user", content: hasImage ? "[图片]" + (userText ? " " + userText : "") : userText },
      { role: "assistant", content: answerForHistory },
    ]);
    return ctx.respond(sseResponse(sessionId, sseBody));
  };

  const notify = (message) => {
    if (!cfg.notifyOnError) return;
    try {
      ctx.notify({ title: "Apple 智能换模型", body: String(message).slice(0, 200) });
    } catch (_) {
      /* 通知失败忽略 */
    }
  };

  const textOptions = { isNew: parsed.isNew, reportModel: cfg.reportModel, continueUrl: cfg.continueUrl };

  let result;
  try {
    result = await callUpstream(ctx, cfg, messages, {
      model: hasImage ? cfg.visionModel : cfg.model,
      search: !hasImage,
      context: hasImage ? "vision" : "chat",
    });
  } catch (error) {
    const detail = String((error && error.message) || error);
    const message = hasImage
      ? "（图片识别失败：" + detail + "。请确认 VISION_MODEL 支持图片输入）"
      : "（后端不可用：" + detail + "）";
    notify(message);
    return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, message, textOptions)));
  }

  const answer = cleanAnswer(result.answer) || "（上游没有返回内容）";
  const annotations = dedupeAnnotations([...(result.annotations || []), ...toSourceAnnotations(sources)]);
  return finish(
    buildTextSSE(sessionId, answer, { ...textOptions, annotations }),
    answer,
  );
}
