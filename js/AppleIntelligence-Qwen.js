/* Apple 智能换模型（问千问） — Egern 模块脚本
 *
 * 国行 Apple 智能在用户选择「问千问」后，Siri 以明文 HTTPS 直接调用：
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/responses
 *   POST https://prod-yabuli.qianwen.com/v1/sessions/sess_xxx/responses
 * 该域名无证书 pinning，也没有 Private Cloud Compute 的 OHTTP/HPKE 端到端层。
 *
 * 本脚本在请求发出前拦截，改发到自定义 provider，再按原样 SSE 事件壳回包。
 * 协议细节与抓包依据见 ../markdown/AppleIntelligence-Qwen.md
 */

const TARGET_HOST = "prod-yabuli.qianwen.com";
const PATH_RE = /^\/v1\/sessions(\/sess_[^/?#]+)?\/responses$/;
const STORE_PREFIX = "AIQ:hist:";
const MAX_TURNS = 20;

const DEFAULT_SYSTEM =
  "你是用户的私人助理，回答要简洁、准确、口语化。只输出最终答案，不要解释推理过程。";

function str(value) {
  return value === undefined || value === null ? "" : String(value).trim();
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

  return {
    providerUrl,
    apiKey: str(e.API_KEY),
    model,
    temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 2) : 0.7,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 300) * 1000 : 120000,
    system: str(e.SYSTEM_PROMPT) || DEFAULT_SYSTEM,
    reportModel: str(e.REPORT_MODEL) || "qwenapp-apple-tqa",
    continueUrl: str(e.CONTINUE_URL),
    notifyOnError: str(e.NOTIFY_ON_ERROR) === "true",
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

async function callUpstream(ctx, cfg, messages) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
  const resp = await ctx.http.post(cfg.providerUrl, {
    headers,
    body: {
      model: cfg.model,
      messages,
      temperature: cfg.temperature,
      stream: false,
    },
    timeout: cfg.timeoutMs,
  });
  const raw = await resp.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error("上游返回非 JSON（HTTP " + resp.status + "）");
  }
  if (resp.status >= 400) {
    const msg = (data && (data.error && (data.error.message || data.error))) || raw.slice(0, 200);
    throw new Error("上游 HTTP " + resp.status + "：" + String(msg).slice(0, 200));
  }
  const answer = unwrapAnswer(pickAnswer(data));
  if (!answer) throw new Error("上游没有返回可用的 choices[0].message.content");
  return answer;
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
  const h = () => hex32();
  const a = h();
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

function buildSSE(sessionId, answer, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const reportModel = options.reportModel || "qwenapp-apple-tqa";
  const continueUrl = options.continueUrl || "";
  const isNew = Boolean(options.isNew);
  const respId = "resp_" + hex32();
  const choiceId = "choice_" + uuid();

  // Siri 期望的正文本身是一个 JSON 字符串（符合 response_format.json_schema）
  const inner = JSON.stringify({
    content: answer,
    isRequestingUserInput: false,
    summary: makeSummary(answer),
    suggestions: ["", "", ""],
  });

  const messageItem = () => ({
    type: "message",
    message: {
      role: "assistant",
      content: [{ text: { annotations: [], value: inner }, type: "text" }],
    },
  });

  const out = [];

  if (isNew) {
    out.push(event("session.created", {
      expires_at: now + 600,
      expires_after: { seconds: 600, anchor: "last_active_at" },
      last_active_at: now,
      created_at: now,
      id: sessionId,
      object: "session",
    }));
  }

  out.push(event("session.response.created", {
    notices: [],
    session_id: sessionId,
    created_at: now,
    model: reportModel,
    id: respId,
    choices: [],
    object: "session.response",
  }));

  out.push(event("session.response.choices[].added", {
    index: 0,
    choice: { output: [], id: choiceId, continue_url: continueUrl, status: "incomplete" },
  }));

  out.push(event("session.response.choices[].items[].added", {
    choice_index: 0,
    item: { type: "message", message: { role: "assistant", content: [] } },
    index: 0,
  }));

  out.push(event("session.response.choices[].items[].message.content[].added", {
    item_index: 0,
    choice_index: 0,
    index: 0,
    content: { text: { annotations: [], value: "" }, type: "text" },
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
    content: { text: { annotations: [], value: inner }, type: "text" },
  }));

  out.push(event("session.response.choices[].items[].done", {
    choice_index: 0,
    item: messageItem(),
    index: 0,
  }));

  const completed = {
    index: 0,
    choice: {
      output: [messageItem()],
      moderation: [],
      id: choiceId,
      continue_url: continueUrl,
      status: "completed",
    },
  };
  out.push(event("session.response.choices[].completed", completed));
  out.push(event("session.response.choices[].done", completed));

  out.push(event("session.response.done", {
    notices: [],
    session_id: sessionId,
    created_at: now,
    model: reportModel,
    id: respId,
    choices: [completed.choice],
    object: "session.response",
  }));

  return out.join("");
}

function sseResponse(sessionId, answer, options) {
  return {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream;charset=UTF-8",
      "Cache-Control": "no-cache",
      "x-session-id": sessionId,
      "x-request-id": hex32(),
    },
    body: buildSSE(sessionId, answer, options),
  };
}

/* ------------------------------------------------------------ 入口 */

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
    return ctx.respond(sseResponse(sessionId, "配置错误：" + error.message, {
      isNew: parsed.isNew,
      reportModel: "qwenapp-apple-tqa",
    }));
  }

  const history = loadHistory(ctx, sessionId);
  const messages = [{ role: "system", content: cfg.system }];
  for (const turn of history) {
    if (turn && turn.role && typeof turn.content === "string") messages.push(turn);
  }
  messages.push({ role: "user", content: userText || "(空输入)" });

  let answer;
  try {
    answer = await callUpstream(ctx, cfg, messages);
  } catch (error) {
    const message = String((error && error.message) || error);
    if (cfg.notifyOnError) {
      try {
        ctx.notify({ title: "Apple 智能换模型", body: message.slice(0, 200) });
      } catch (_) {
        /* 通知失败忽略 */
      }
    }
    return ctx.respond(sseResponse(sessionId, "（后端不可用：" + message + "）", {
      isNew: parsed.isNew,
      reportModel: cfg.reportModel,
      continueUrl: cfg.continueUrl,
    }));
  }

  saveHistory(ctx, sessionId, [
    ...history,
    { role: "user", content: userText },
    { role: "assistant", content: answer },
  ]);

  return ctx.respond(sseResponse(sessionId, answer, {
    isNew: parsed.isNew,
    reportModel: cfg.reportModel,
    continueUrl: cfg.continueUrl,
  }));
}
