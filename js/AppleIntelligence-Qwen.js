/* Apple 智能换模型（问千问） — Egern 模块脚本
 *
 * 国行 Apple 智能在用户选择「问千问」后，Siri 以明文 HTTPS 直接调用：
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/responses
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/sess_xxx/responses
 * 该域名无证书 pinning，也没有 Private Cloud Compute 的 OHTTP/HPKE 端到端层。
 *
 * 本脚本在请求发出前拦截，改发到自定义 provider，再按原样 SSE 事件壳回包。
 * 支持纯文本回答与 image_generator 出图两条链路。
 * 协议细节与抓包依据见 ../markdown/AppleIntelligence-Qwen.md
 */

const TARGET_HOST = "prod-yabuli.qianwen.com";
const PATH_RE = /^\/v1\/sessions(\/sess_[^/?#]+)?\/responses$/;
const STORE_PREFIX = "AIQ:hist:";
const MAX_TURNS = 20;

const DEFAULT_SYSTEM =
  "你是用户的私人助理，回答要简洁、准确、口语化。只输出最终答案，不要解释推理过程。";

const IMAGE_TOOL = {
  type: "function",
  function: {
    name: "image_generator",
    description:
      "根据用户的描述生成图片。当用户想画图、生成图片、做海报/头像/壁纸/插画时调用。" +
      "prompt 要保留用户意图，并补全主体、场景、风格、光线、构图等视觉细节。",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "用于图像生成的详细中文提示词",
        },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
  },
};

/* 上游不支持工具调用时的兜底：只认明确的「画/生成 + 图像名词」句式 */
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

/* ---------------------------------------------------------------- 配置 */

function readConfig(env) {
  const e = env || {};
  const providerUrl = str(e.PROVIDER_URL);
  if (!providerUrl) throw new Error("未填写 PROVIDER_URL（OpenAI 兼容的 /chat/completions 地址）");
  if (!/^https?:\/\/[^\s]+$/i.test(providerUrl)) throw new Error("PROVIDER_URL 必须是 http(s) 地址");
  const model = str(e.MODEL);
  if (!model) throw new Error("未填写 MODEL");

  const temperature = Number(str(e.TEMPERATURE) || "0.7");
  const timeout = Number(str(e.TIMEOUT) || "120");

  const imageSize = str(e.IMAGE_SIZE) || "1024x1024";
  const sizeMatch = /^(\d{2,5})x(\d{2,5})$/i.exec(imageSize);

  return {
    providerUrl,
    apiKey: str(e.API_KEY),
    model,
    temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 2) : 0.7,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 300) * 1000 : 120000,
    system: str(e.SYSTEM_PROMPT) || DEFAULT_SYSTEM,
    reportModel: str(e.REPORT_MODEL) || "qwenapp-apple-tqa",
    continueUrl: str(e.CONTINUE_URL),
    notifyOnError: bool(e.NOTIFY_ON_ERROR, false),

    imageEnable: bool(e.IMAGE_ENABLE, true),
    imageUrl: str(e.IMAGE_URL),
    imageKey: str(e.IMAGE_KEY) || str(e.API_KEY),
    imageModel: str(e.IMAGE_MODEL),
    imageSize,
    imageWidth: sizeMatch ? Number(sizeMatch[1]) : 1024,
    imageHeight: sizeMatch ? Number(sizeMatch[2]) : 1024,
    imageTimeoutMs: (Number(str(e.IMAGE_TIMEOUT) || "180") || 180) * 1000,
    imageUploadUrl: str(e.IMAGE_UPLOAD_URL),
    imageDescribe: bool(e.IMAGE_DESCRIBE, false),
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

function extractUserText(body) {
  const input = body && body.input;
  if (!Array.isArray(input)) return "";
  const parts = [];
  for (const item of input) {
    const message = item && item.message;
    if (!message) continue;
    if (message.role && message.role !== "user") continue;
    const content = message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c && c.type === "text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
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

/** 从 choices[0].message.tool_calls 里取出 image_generator 的 prompt */
function parseToolCall(data) {
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  const calls = choice && choice.message && choice.message.tool_calls;
  if (!Array.isArray(calls)) return null;
  for (const call of calls) {
    const fn = call && call.function;
    if (!fn || fn.name !== "image_generator") continue;
    let args = {};
    try {
      args = typeof fn.arguments === "string" ? JSON.parse(fn.arguments) : fn.arguments || {};
    } catch (_) {
      args = {};
    }
    const prompt = str(args.prompt);
    if (prompt) return { prompt };
  }
  return null;
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

async function postChat(ctx, cfg, messages, withTools) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  const body = {
    model: cfg.model,
    messages,
    temperature: cfg.temperature,
    stream: false,
  };
  if (withTools) {
    body.tools = [IMAGE_TOOL];
    body.tool_choice = "auto";
  }
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

/**
 * 调用对话接口。tools=true 时带上 image_generator 定义；
 * 上游若明确拒绝工具参数，自动退回不带工具再请求一次。
 */
async function callUpstream(ctx, cfg, messages, options = {}) {
  const wantTools = Boolean(options.tools) && cfg.imageEnable;
  let data;
  let toolsUnsupported = false;

  if (wantTools) {
    try {
      data = await postChat(ctx, cfg, messages, true);
    } catch (error) {
      const rejectedTools = error.status === 400 && /tool/i.test(String(error.message));
      if (!rejectedTools) throw error;
      toolsUnsupported = true;
      data = await postChat(ctx, cfg, messages, false);
    }
  } else {
    data = await postChat(ctx, cfg, messages, false);
  }

  const toolCall = parseToolCall(data);
  if (toolCall) return { toolCall, toolsUnsupported };
  return { answer: unwrapAnswer(pickAnswer(data)), toolsUnsupported };
}

/* --------------------------------------------------------------- 图像 */

function looksLikeImageRequest(text) {
  const t = str(text);
  if (!t) return false;
  return IMAGE_INTENT.some((re) => re.test(t));
}

async function uploadBase64(ctx, cfg, base64, mimeType) {
  if (!cfg.imageUploadUrl) {
    throw new Error("上游只返回 base64 图片，请配置 IMAGE_UPLOAD_URL 接收转存");
  }
  const headers = { "Content-Type": "application/json" };
  if (cfg.imageKey) headers.Authorization = "Bearer " + cfg.imageKey;
  const resp = await ctx.http.post(cfg.imageUploadUrl, {
    headers,
    body: { image: base64, mimeType },
    timeout: cfg.timeoutMs,
  });
  const raw = await resp.text();
  if (resp.status >= 400) throw new Error("转存失败 HTTP " + resp.status + "：" + raw.slice(0, 120));
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  let data = null;
  try {
    data = JSON.parse(trimmed);
  } catch (_) {
    throw new Error("转存接口没有返回可用的 URL");
  }
  const url = str(data && (data.url || (data.data && data.data.url)));
  if (!url) throw new Error("转存接口没有返回可用的 URL");
  return url;
}

/** 生成图片，返回 Siri 可直接抓取的 https URL */
async function generateImage(ctx, cfg, prompt) {
  if (!cfg.imageUrl) throw new Error("未配置 IMAGE_URL（图像生成接口地址）");
  if (!cfg.imageModel) throw new Error("未配置 IMAGE_MODEL");

  const headers = { "Content-Type": "application/json" };
  if (cfg.imageKey) headers.Authorization = "Bearer " + cfg.imageKey;

  // 不传 response_format：dall-e 系列默认回 url，gpt-image 系列回 b64_json
  const resp = await ctx.http.post(cfg.imageUrl, {
    headers,
    body: {
      model: cfg.imageModel,
      prompt,
      n: 1,
      size: cfg.imageSize,
    },
    timeout: cfg.imageTimeoutMs,
  });
  const raw = await resp.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error("图像接口返回非 JSON（HTTP " + resp.status + "）");
  }
  if (resp.status >= 400) throw new Error(errorText(data, raw, resp.status));

  const first = data && Array.isArray(data.data) ? data.data[0] : null;
  if (!first) throw new Error("图像接口没有返回 data[0]");
  if (str(first.url)) return str(first.url);
  if (str(first.b64_json)) return await uploadBase64(ctx, cfg, str(first.b64_json), "image/png");
  throw new Error("图像接口既没有 url 也没有 b64_json");
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

function textContent(value) {
  return { text: { annotations: [], value }, type: "text" };
}

function textMessageItem(value) {
  return { type: "message", message: { role: "assistant", content: [textContent(value)] } };
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
  const inner = innerPayload(answer);

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
  out.push(event("session.response.choices[].items[].message.content[].done", {
    item_index: 0,
    choice_index: 0,
    index: 0,
    content: textContent(inner),
  }));
  out.push(event("session.response.choices[].items[].done", {
    choice_index: 0,
    item: textMessageItem(inner),
    index: 0,
  }));

  return closeSSE(out, { ...base, now, output: [textMessageItem(inner)] });
}

/**
 * 出图回答：image_generator_call 项 + 带图片的 message 项。
 * 事件序列对齐 2026-11-05 抓包（entry 22），共 20 个（新会话 21 个）。
 */
function buildImageSSE(sessionId, image, options = {}) {
  const base = {
    sessionId,
    respId: "resp_" + hex32(),
    choiceId: "choice_" + uuid(),
    reportModel: options.reportModel || "qwenapp-apple-tqa",
    continueUrl: options.continueUrl || "",
    isNew: Boolean(options.isNew),
  };
  const { out, now } = openSSE(base);

  const prompt = image.prompt;
  const url = image.url;
  const width = image.width || 1024;
  const height = image.height || 1024;
  const inner = innerPayload(image.answer);

  const callItem = () => ({
    type: "image_generator_call",
    image_generator_call: {
      tool_name: "image_generator",
      images: [{ url }],
      prompt,
      status: "completed",
    },
  });

  // 真实后端在 added 事件里就给 status: completed、prompt 为空，照抄
  out.push(event("session.response.choices[].items[].added", {
    choice_index: 0,
    item: { type: "image_generator_call", image_generator_call: { images: [], prompt: "", status: "completed" } },
    index: 0,
  }));
  out.push(event("session.response.choices[].items[].image_generator_call.in_progress", {
    item_index: 0,
    choice_index: 0,
    item: { type: "image_generator_call", image_generator_call: { images: [], prompt: "", status: "in_progress" } },
  }));
  out.push(event("session.response.choices[].items[].image_generator_call.prompt.done", {
    item_index: 0,
    choice_index: 0,
    prompt,
  }));
  out.push(event("session.response.choices[].items[].image_generator_call.generating", {
    item_index: 0,
    choice_index: 0,
    item: { type: "image_generator_call", image_generator_call: { images: [], prompt, status: "generating" } },
  }));
  out.push(event("session.response.choices[].items[].image_generator_call.images[].added", {
    item_index: 0,
    image: { url },
    choice_index: 0,
    index: 0,
  }));
  out.push(event("session.response.choices[].items[].image_generator_call.completed", {
    item_index: 0,
    choice_index: 0,
    item: callItem(),
  }));
  out.push(event("session.response.choices[].items[].done", {
    choice_index: 0,
    item: callItem(),
    index: 0,
  }));

  // 第二个 item：消息，content[0] 是图片，content[1] 是文本
  const imageContent = () => ({
    type: "image_generator_image",
    image_generator_image: { width, prompt, url, height },
  });

  out.push(event("session.response.choices[].items[].added", {
    choice_index: 0,
    item: { type: "message", message: { role: "assistant", content: [] } },
    index: 1,
  }));
  out.push(event("session.response.choices[].items[].message.content[].added", {
    item_index: 1,
    choice_index: 0,
    index: 0,
    content: imageContent(),
  }));
  out.push(event("session.response.choices[].items[].message.content[].done", {
    item_index: 1,
    choice_index: 0,
    index: 0,
    content: imageContent(),
  }));
  out.push(event("session.response.choices[].items[].message.content[].added", {
    item_index: 1,
    choice_index: 0,
    index: 1,
    content: textContent(""),
  }));
  for (const piece of chunkString(inner, 40)) {
    out.push(event("session.response.choices[].items[].message.content[].text.value.delta", {
      item_index: 1,
      choice_index: 0,
      content_index: 1,
      delta: piece,
    }));
  }
  out.push(event("session.response.choices[].items[].message.content[].text.value.done", {
    item_index: 1,
    choice_index: 0,
    content_index: 1,
    value: inner,
  }));
  out.push(event("session.response.choices[].items[].message.content[].done", {
    item_index: 1,
    choice_index: 0,
    index: 1,
    content: textContent(inner),
  }));

  const messageItem = {
    type: "message",
    message: { role: "assistant", content: [imageContent(), textContent(inner)] },
  };
  out.push(event("session.response.choices[].items[].done", {
    choice_index: 0,
    item: messageItem,
    index: 1,
  }));

  return closeSSE(out, { ...base, now, output: [callItem(), messageItem] });
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

async function describeImage(ctx, cfg, prompt) {
  try {
    const { answer } = await callUpstream(ctx, cfg, [
      { role: "system", content: "用一句中文描述这张图片的画面，不超过 40 字，不要客套话。" },
      { role: "user", content: "图片提示词：" + prompt },
    ]);
    return str(answer);
  } catch (_) {
    return "";
  }
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

  const userText = extractUserText(body);

  let cfg;
  try {
    cfg = readConfig(ctx.env);
  } catch (error) {
    return ctx.respond(sseResponse(sessionId,
      buildTextSSE(sessionId, "配置错误：" + error.message, { isNew: parsed.isNew })));
  }

  const history = loadHistory(ctx, sessionId);
  const messages = [{ role: "system", content: cfg.system }];
  for (const turn of history) {
    if (turn && turn.role && typeof turn.content === "string") messages.push(turn);
  }
  messages.push({ role: "user", content: userText || "(空输入)" });

  const finish = (sseBody, answerForHistory) => {
    saveHistory(ctx, sessionId, [
      ...history,
      { role: "user", content: userText },
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
    result = await callUpstream(ctx, cfg, messages, { tools: cfg.imageEnable });
  } catch (error) {
    const message = "（后端不可用：" + String((error && error.message) || error) + "）";
    notify(message);
    return ctx.respond(sseResponse(sessionId, buildTextSSE(sessionId, message, textOptions)));
  }

  // 出图判定：模型调工具优先；没有工具能力时退回句式兜底
  let imagePrompt = result.toolCall ? result.toolCall.prompt : "";
  if (!imagePrompt && cfg.imageEnable && (result.toolsUnsupported || !result.answer)) {
    if (looksLikeImageRequest(userText)) imagePrompt = userText;
  }

  if (imagePrompt) {
    try {
      const url = await generateImage(ctx, cfg, imagePrompt);
      const answer = cfg.imageDescribe
        ? (await describeImage(ctx, cfg, imagePrompt)) || "图片已生成。"
        : "已按你的描述生成图片。";
      return finish(
        buildImageSSE(sessionId, {
          prompt: imagePrompt,
          url,
          width: cfg.imageWidth,
          height: cfg.imageHeight,
          answer,
        }, textOptions),
        "[已生成图片] " + imagePrompt,
      );
    } catch (error) {
      const note = "图片生成失败：" + String((error && error.message) || error);
      notify(note);
      const fallback = result.answer ? result.answer + "\n\n" + note : note;
      return finish(buildTextSSE(sessionId, fallback, textOptions), fallback);
    }
  }

  const answer = result.answer || "（上游没有返回内容）";
  return finish(buildTextSSE(sessionId, answer, textOptions), answer);
}
