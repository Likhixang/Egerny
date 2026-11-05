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
  "你是用户的私人助理，回答要简洁、准确、口语化。只输出最终答案，不要解释推理过程。";

// 视觉智能的原始请求里只有图片、没有文字，通用模型需要一句引导
const DEFAULT_VISION_PROMPT =
  "请识别图片中的内容，用中文简洁说明这是什么、有什么可见信息。";

// 写作工具：原文 + 改写要求，回包必须是 {body, refinements[]}
const DEFAULT_WRITING_PROMPT =
  "你是中文写作助手。用户给出原文和改写要求，你按要求重写，保持原意、原语言，不添加原文没有的事实。" +
  '只输出 JSON：{"body":"改写后的全文","refinements":["建议1","建议2","建议3"]}。' +
  "body 要包含完整文本，未改动的部分也照抄，不要省略；" +
  "refinements 是 3 条中文短语，从结构、语气、意象、节奏等角度给出，供用户下一步选择。";

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

function readConfig(env) {
  const e = env || {};
  const rawProvider = str(e.PROVIDER_URL);
  if (!rawProvider) throw new Error("未填写 PROVIDER_URL（填到 /v1 即可，会自动补 /chat/completions）");
  if (!/^https?:\/\/[^\s]+$/i.test(rawProvider)) throw new Error("PROVIDER_URL 必须是 http(s) 地址");
  const providerUrl = buildEndpoint(rawProvider, "chat/completions");
  const model = str(e.MODEL);
  if (!model) throw new Error("未填写 MODEL");

  const timeout = Number(str(e.TIMEOUT) || "120");

  return {
    providerUrl,
    apiKey: str(e.API_KEY),
    model,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 300) * 1000 : 120000,
    system: str(e.SYSTEM_PROMPT) || DEFAULT_SYSTEM,
    visionPrompt: str(e.VISION_PROMPT) || DEFAULT_VISION_PROMPT,
    visionModel: str(e.VISION_MODEL) || model,
    writingPrompt: str(e.WRITING_PROMPT) || DEFAULT_WRITING_PROMPT,
    writingModel: str(e.WRITING_MODEL) || model,
    reportModel: str(e.REPORT_MODEL) || "qwenapp-apple-tqa",
    continueUrl: str(e.CONTINUE_URL),
    notifyOnError: bool(e.NOTIFY_ON_ERROR, false),
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

async function postChat(ctx, cfg, messages, model) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  const body = {
    model: model || cfg.model,
    messages,
    stream: false,
  };
  const resp = await ctx.http.post(cfg.providerUrl, { headers, body, timeout: cfg.timeoutMs });
  const raw = await resp.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error("上游返回非 JSON（HTTP " + resp.status + "）");
  }
  if (resp.status >= 400) {
    const error = new Error(errorText(data, raw, resp.status));
    error.status = resp.status;
    throw error;
  }
  return data;
}

/** 调用对话接口，返回文本与引用 */
async function callUpstream(ctx, cfg, messages, options = {}) {
  const data = await postChat(ctx, cfg, messages, options.model || cfg.model);
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

export default async function (ctx) {
  const parsed = parseRequestPath(ctx.request.url);
  if (!parsed) return undefined; // 非目标路径，透传

  const sessionId = parsed.sessionId || "sess_" + uuid();

  let body;
  try {
    body = await ctx.request.json();
  } catch (_) {
    body = {};
  }

  const input = extractInput(body);
  const userText = input.text;
  const hasImage = input.images.length > 0;

  // 画图不接管：命中画图句式就原样放行，仍由千问出图
  if (!hasImage && looksLikeImageRequest(userText)) return undefined;

  let cfg;
  try {
    cfg = readConfig(ctx.env);
  } catch (error) {
    return ctx.respond(sseResponse(sessionId,
      buildTextSSE(sessionId, "配置错误：" + error.message, { isNew: parsed.isNew })));
  }

  // 写作工具（compose）与 Siri 对话共用端点，但报文结构完全不同，先分流
  if (isComposeRequest(body)) {
    return handleCompose(ctx, cfg, body, sessionId, parsed.isNew);
  }

  const history = loadHistory(ctx, sessionId);
  const messages = [{ role: "system", content: cfg.system }];
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
    });
  } catch (error) {
    const detail = String((error && error.message) || error);
    const message = hasImage
      ? "（图片识别失败：" + detail + "。请确认 VISION_MODEL 支持图片输入）"
      : "（后端不可用：" + detail + "）";
    notify(message);
    return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, message, textOptions)));
  }

  const answer = result.answer || "（上游没有返回内容）";
  return finish(
    buildTextSSE(sessionId, answer, { ...textOptions, annotations: result.annotations || [] }),
    answer,
  );
}
