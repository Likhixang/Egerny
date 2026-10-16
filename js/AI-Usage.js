/* AI Usage 聚合监控 — Egern 原生 Widget DSL
 * 真实配额 / 余额；未知为 null；无演示数据；仅访问显式配置的服务。
 * 接口、凭据和验证边界：../markdown/AI-Usage.md
 */

const PROVIDER_LOGOS = {
  "cliproxyapi": "data:image/png;base64,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",
  "codex2api": "data:image/png;base64,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",
  "axonhub": "data:image/png;base64,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",
  "sub2api": "data:image/png;base64,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",
  "newapi": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAPBklEQVR42q1ae5BkVXn//b5z7r19e967LBBDCeUDk13UItEIQbIzkkQ0aClVPYmaoGx0fROUEMBH9XSVGkOkgNIYWZD4KAOZTiJGfJBSZhcJotmIEMBC1hJEasVl593d93HO+fJHz+zO7E7PDMYzdapmerrv+Z6/7/d9p4FnulQNVLn85ymq6XDRPnckm79yuDN360i28JORonVoJFv4wtDizJmo1+WG3fujno+rq+jOKas4+sxnsjb/oXpdMDEBkAEARor22VC8AfDnw7nnsTpIQhDyxe8FdR+cS0e+vUrQXbcNwNvTHcsTXFCtMP4lUD7Gz79+9sh7apMGzfFAQH+9CqgakB4AtnQW/1gFV9CYV8BUoMUiaAzUa1tDuGI2HfgUANRVZUezydpDNS1++pUJY8xbBfgNSgRAEXwJr3oIwv/WoM3Y6L/x5tctAMBkbdKMN8f9r0eBJeGHZg6eZqpDVyMyNVCgrQWFasFqX6Le/4ydzp9OD51wL1QFzSa1CbA57jsXfflvK33brnSdabjgFWSAKkFKLAZiEoAC57LHFHr9jxf3f/qMZqOY2jllx/aNuV9dgW6cC0g/snD4zxCnn2KcbtXWdFhysLJvwGhZPKKt+VfObnnW49D9EfiSUqEkqLrrtoHc8zEr0VAZHAiYVUdAFWBQKComMrQpXJndV7rykuoXX3v3ZkJK1hGeIP1IZ+4j7B++BfBbtTXjQBEAYCU1oSiegM//qCu8WvAl5ZJk3WUlUYoF1IAUULByk4akGKExmXea5QvOGntmFCX7sjfffjmb4x71OtdLcFnH8mG4PXcjK4Mf1NacR1EoSAtVRRSpKjJ17dfNVLc+0RWeR9xNUrVeF+x5zWGqPGJsRQkJRO8fQ0OhsbkrvA+OSTp0dXHxN/aw0VDUJ3oqsVoBBYG9BqQfbk3fJOngW7U1UwIwEFl6gAYmAwZZ6/1z/Sf+APv3RyuFP7L2jgpBDYpPwVRIMBzrgbU2KQYkimyxjCpDbysuvuMWNCYUtaaspQSPsb4F6UYWDn+M/Vuu0tZMCTJa8X/PvkGj7fk7Z/q2nHes5dfC+AlM4AM/O/s/42TwvDybK9mFoU2Cn5ZJOhzlnZl/qnzuVbu0PmXZWJ3YcgzauJGFw+PsH7lKO3MlgNWHiVCL3Kni/Ud8tu6awERjQguxb3IuO5BUBqMAdV1rc8NNkSjP5sukuvXi9lu+8QE2xpzunLLHe0BVAOiWdvtZKuFBCAdRFgC5UkHHvmEbFmeaswNbx1fWhnWtWK8LG43Q3nX7qZEMfNVGlRdm2ZwTit2UFwAV0luT2Nxlr0hv/sMprU0aLtUJOaIIqUGza1npH0ZZhFXCd98hcDlo7HUrqcSGON1ohMnapKnefMHjrfbCztLld1TSLVZBt8mcoFeIAhDKzYd23TaA7TVdzgdZtuRIe/7lUumraXvWg7THBGNgpU9C3nlwJh28dwlq/GaVGG+Oe62rDP/zBTPRjd9+dVm2bkwqIxYwTsElO/beQiOlK1xcGTltkEMfZIMBtaZ0FWg2l7ClrMNYIKwZ1gESg+RXl7iQecakq8Gg9bqgDsQ37tztitZH48qAJY3bTD5AjCmLxSASXdJ589RpaNaC1lUE4+N+eHH6xYwq52lnIUBo1oRbLcHAqc0lb+9wQmNCtT5lo5vO/VCRLX4kToYsIG4jLxDCEBBsPJDS2vcTVGBvF9tHFqevlb6RS3Vxxq0RPgprqD60DaLnPd3ff3CJy+gmcJBL4abHUAiivtewMeayt919c5IMXpxnc14oRtdNaFUrFiH42ciG5/Ifz52RU1UrcY7XRp0McUmJC+CYrTESxLk+8XRf31NrCdTb5NS13ktQ0Rj1Wps0yezwO8q8/UAc9ZugCOxae80tMHQhhKgyPFKU5jUAIP7gzMuSED8nnss1LihxQRyzNQkRkkKeWGKSsgnLCwCMLBzeMdKefvYqb6xUAgCbZxRQ7AqAE7HLSvfMBaFRAArh6wFAkpJjiUkRFRqiAjhul9SkFEQFD3Upwl7ZhO1lScp3QeX8JW5xXG6xOe61PmXjm876H1dmn42SIVEVv14uKGDgCkJ51vTu/UMSFXxpnCni8jjLIy6IqADiEohKbQPAToxuJniWIfZ8IJzV/bXX50aDQunBj7iy3RJjjZLauy4YlsHBmPjkfuCFEud4ftQqEWdYK/67OwfifJPQOTVla4AMzcychjh9DlR/t6v48WG0DK+oQfpuOuvnGsKtNh4kVHyXJKy9FeKNTQHKiyRx3BZ3/JIH1lKAiDMgKTgIACeOrgGhdZWdU2qhSoyNuSbpGfmdjFJA7POTzsxp+0gHUmuTamrHDAaAZheZYG8MPgcpsmGVFgNCns9z7p3LIRJDtRd0eVsdMK61eM89Zw2esxGEnnqwc1qiem5BdzmsPQPeUyiPGI9r82p18mfDnOlxDlEHy1/c/0AUpTuKshN4LJ05WoR8HFVNXiz+i41KWFJ7lyaFUAtIEZ5zwf4nq7eT7SNKLFnx3O/Onolq9SIHN+YOud9CXzVGBqAoum5PzAtYST+Dp1sfP+W+9ncMeIdvhS/fc0714BG4XaoL5Tsf/DqidAdcEUD0BgwKKCa1SUHZoLenFoWauHJyMYszAHy/1oQ0jyYqREMRZZhPc8xbJ1k0jdirgS+759vIAiGHo7R9RHUxfGTCai718KgCgFfcbUO4HCQ3bOdVgo1yFBT2DCGAUFUfVxJbluWrAXz/l9uwqsLuAx5Ed+PNk3qyj/JzmIe/MYxfShG44L6J1P7dibPJ/msuYmvNY7Z3YyBh9KgrOyqU9UGDBiKS88Lb5g+KjU4OrlT20FpVg61UxXU6D5uy/0XNGsKqPKjXZefohOwbRVgefF1+zeKrTV/f14L3wELr7KuvHLoXUNa0GxZNrH6GqpKk6iU/OaksywPWmH4XnBLHy6RQH8X9pswXb7RRwccjxie70inQy20UFJ1QraTbS7c4CvbfWZtU0xxfotSNRtjXaAQAqE1OGqCG6kO4Nznc6QBYyKPBB2qTarY/BG30ouHLJ6vvgOyQph8IPUTSZST6uY0L/DC28jLJuy19zxWgsTVAppcD/HavrG+Od7k/G5ze89bODymYftsetidrasabXe+sXwKLAMShW3m59uhKSQSFko9IWpi7oo4iKsBu9e1RzByNzrZCv6Sv3PW5+T9ojtPXJnXNON27FwIoTzpkbj/hKdwBANt+ucEUcNkeyWBMMXG3B1i7Bhhjxbm8UNj7LXPdx6Izn5p4MPhS181+VY0okMJeV5vUl25/aC8BJbC6Lozugweo2xb087mP/NHX1u3/CUBRhiFVDgRVHPXC6nyUKBVfth/97v8+dkBueGffk3GBu/sQa1QgLNGGtXdJg/m2H7Tpmc86uFhvNMbc7htg16TLAH7/Tj45to+/WPlaz/VwkwBQwp8SxVXrFYE0XM1GBaAE2FRJ+dbYvjEnABAX/EJSgnGONQndkZ0TSSkSZju+j+mHL/v71mv2vJ3l7t0a9aqum577b691m3SJfxu2CkACjuuXCYICV1CBySXaqzyZ6X+E2eyJqiYSFRp65kGXGzHKgpiOD/0a33JVY/6cPXvWVoKgbmj5o5mznJ+/d3RutDr2leJtMkDnOvdHW069V+t1kXod5rLL2Iny8Il+WMYFwrrJXABJaWg7DlGuff2m8vXGhxfG9uxhWa+rxa+6GmNe61MWgefCFSBEjuvKFICpkBpdxwYDMCEElPU6CCCuFNkDURQ/rywzJUV0g7m8hhBMFAuJ3GflW668unrr5KSa8XEEbNrygNbUoIlQXnLwJcYm3wsux7FFVVWDjar0ZedRowsvmtjypXKiMaECUHc8DDYazKLcvzd1wqSUEK0bRt1uLXEiplUG2/Fxv01vufay7IrxcfquQZ7Bndf2vSSopFwk0QCB47sywgSYCpW8gp88PZ/YMdH9zPIzupajv/7d7X8Y7E/ftdDOSiGjzZhRNahQQrWSmHYn//R7Pll5d7dwbewJXe4Lrprf4rPyUYoZDr5c5QHV4Gy6xfrO9Jft9SddqDU1bHYrOlciRrMGAWBmt+Z3pXHyslaeOR47ZllPEtINpEk01+rc8I491XcsVV+//uxULRt0/q8OfVTSrR9wnelVZwb1IYqq4oN70pRyJrYMHD7Sya2cThPUh7ZDx5sspPAXaqt8fEgrNsrVbZTUcQHEJRnliLKZvDzBpm+/+S2dt4836SdratYbv7NBp+996rlqK5f6YiFAuvcDoECBYEwFgZIHn9X4ycFDeLjJZeHXvCNbttoX35S9IDb2W5GYU1pl1p0mbyotNRgxCBoW4eLT33grn1pmmmt0YIYNuuLS2TujZGDMFfOe6E4GVUOgWNLECMXChdH1225b/37gyCC2a7W/+FLlkbyzOMa2+9EJqFibq4sK1Q09UVCY+bAF8aAN5Z93L2vWGAjsRjd03jc3EVWHxlyx4EljQEEAvI1SoUl8KDvjXeH1OOF7XvItK3FRc/hAOdt6eej4r2xDYtPS0hZwUQFdr2InBWGyoHGmZwPAoRNX+053a8Q9LN375i6SpL/us7YDjdHuINNFlSETIE+HsvOq6LqRf13Ok7Vktb1H4jxCiwG87pt/UlyaQiYqJh5aKB0CguMRtnU8Zqcq1pVcXMlEta4C7BU2WOpft98YxH4uuNIDKgSdkciikthQFN8p3Oyu9LqTDqwnfO9r1pUjcSjrdZXzvxZfp1n5Oy4Ln01Ldk4MsR1ysVQKw6hQjXP1cd6lISMhiUPHqynxmWUPLAkS2BhzenlxGWzyJYTgNfhgJBaT9tlAmUNeXinpx0bTa086oDU16wn/jL4rsRIS73p5drq19g0IuMCr7kjEpoaAKpAHF6zI/YsaPnTeXdHXV1pQ3zu/DdX0Whj7Ji1KMIoAC4S8XBCaL8IVn+A16U+XRywr0eb//2UPAHWo7KiBK7H9vrP0N4Pg2S64IUNbRMSTL76HjywjDUHVy7QPxv8liAaqZhgdwPuyQ8h9Ivh3WDPJj/IJANBJNRzf/O3Pr/QVlzpURndCxvb1du/UTrWjbwRxABfChPcE1ReK8sdBww9UuN+o+S9ezR8dyZtJNXgIuhmrr1z/B3AALVF3ZL/PAAAAAElFTkSuQmCC",
  "deepseek": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAALVBMVEVMaXEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAR6B4TAAAADnRSTlMALQv22Vvpx0SGGnGynGfKAxsAAAEkSURBVHja1ZLNTcMxDMV/f4seKtGoypELHqETMAJiEsQoTMAMnQjlwgGJ+mAEQkARh3zDBM0l/sh7tl8MJ3HC/9C1GWBT7MHsYGYAlnJIALEbWBrXHsAEeJkpr4CAjOUKSwqWWKZysXsy9XcAzZZLxQOw7Lo5N/56Wfwo86Sbu8zlLCFNmY8LDFxZHrfzFK5GBGTrMcbdIOJtKW6uQCZ0tToOUgnyrQ0pRT0HCM8+JDb9rX92yFnrBghfHCtaGlaBFW+N6r6K5VnxplVItaOmQSxU6+K/TwoIrIr5PbQB4u1Hh+nqlhT7OOYF5RwQo7TqFeHwBD9YeaudinXKy+NzDYUAe8Ie7cu7jHscsxlrQv7saEt0MdqHleLNdZ0GbAFXTvX8Api5WAwKCx6/AAAAAElFTkSuQmCC",
  "agy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAJFBMVEVMaXEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/eFplAAAAC3RSTlMAEyq8ntZFgGPr9xkf/HEAAADxSURBVHjapZIxjsIwEEUfwwJazSX2CLkEEhKNG+6TI+xRptpm74BouEeaaAskROHEsceBFeAq8Zv/53s08OxZTJ9q9CH9SX6P2gwwAK2BZrgATcEz0LpUgqu0qvkdhbkQ/yvANRHX+4HiLvgowDQ8Nk9bFUDrvK9aFUczYO9ZZQNYAXDo4BfAwqhYA/QdMLdwAaAvQTtdhTGvjDs1mPTe6q9wHIACVz9GcYXJq37gKcaXqJxi0sYHSyrLvb5AYm+3698g0BZOEEBBoMlHlHLJzHYChrhMyUsU5xTrTKgEEOBz+QN7Dy7H3UJgW/c+88K5AUIKK+4yaBibAAAAAElFTkSuQmCC"
};

// 配置、HTTP 与指标归一化。所有余额/配额只来自上游，不生成演示数据。
const PROVIDER_METAS = {
  cliproxyapi: { title: "CLIProxyAPI", logo: PROVIDER_LOGOS.cliproxyapi },
  codex2api: { title: "Codex2API", logo: PROVIDER_LOGOS.codex2api },
  axonhub: { title: "AxonHub", logo: PROVIDER_LOGOS.axonhub },
  sub2api: { title: "Sub2API", logo: PROVIDER_LOGOS.sub2api },
  newapi: { title: "New API", logo: PROVIDER_LOGOS.newapi },
  deepseek: { title: "DeepSeek", logo: PROVIDER_LOGOS.deepseek },
  agy: { title: "Agy Tools", logo: PROVIDER_LOGOS.agy },
};

function envText(env, ...keys) {
  for (const key of keys) {
    if (env[key] !== undefined && env[key] !== null && String(env[key]).trim()) return String(env[key]).trim();
  }
  return "";
}

function normalizeProvider(value) {
  const key = String(value || "CLIProxyAPI").trim().toLowerCase().replace(/[\s_-]+/g, "");
  return ({ cliproxy: "cliproxyapi", agytools: "agy" })[key] || key;
}

function readConfig(ctx) {
  const env = ctx.env || {};
  const provider = normalizeProvider(envText(env, "PROVIDER", "provider"));
  if (!PROVIDER_METAS[provider]) throw new Error("不支持的平台，请在 PROVIDER 中选择服务平台");
  const rawUrl = envText(env, "SERVER_URL", "server_url") || (provider === "deepseek" ? "https://api.deepseek.com" : "");
  if (!rawUrl) throw new Error("请填写 SERVER_URL（手机可访问的服务地址，不是服务器自身的 localhost）");
  // 不自动猜端口，不向另一个 origin 回退，也不接受 URL 内嵌凭据。
  if (/[\\\u0000-\u0020]/.test(rawUrl)) throw new Error("SERVER_URL 不能包含空白、反斜杠或控制字符");
  if (!/^https?:\/\/[^\s/?#@]+(?::\d+)?(?:\/[^\s?#]*)?$/i.test(rawUrl)) throw new Error("SERVER_URL 必须是 http(s) 地址，不能包含账号密码、query 或 fragment");
  let baseUrl = rawUrl.replace(/\/+$/, "");
  const suffixes = {
    cliproxyapi: /\/v(?:0|8)\/management$/i,
    codex2api: /\/api\/admin$/i,
    axonhub: /\/admin(?:\/graphql)?$/i,
    sub2api: /\/(?:api\/v1|v1)$/i,
    newapi: /\/(?:api|v1)$/i,
    deepseek: /\/v1$/i,
  };
  if (suffixes[provider]) baseUrl = baseUrl.replace(suffixes[provider], "");
  const apiKey = envText(env, "API_KEY", "api_key", "MANAGEMENT_KEY", "ADMIN_KEY").replace(/^Bearer\s+/i, "");
  const modeValue = envText(env, "AUTH_MODE").toLowerCase();
  const mode = ({ "api key": "api_key", "api-key": "api_key", "user token": "user", "admin key": "admin" })[modeValue] || modeValue || "auto";
  if (!["auto", "admin", "api_key", "user"].includes(mode)) throw new Error("AUTH_MODE 只能是 Auto / Admin / API Key / User");
  const email = envText(env, "EMAIL", "email");
  const password = String(env.PASSWORD ?? env.password ?? "");
  const userId = envText(env, "USER_ID");
  const maskAccount = envText(env, "MASK_ACCOUNT", "MaskAccount", "mask_account").toLowerCase() === "true";
  return { provider, baseUrl, apiKey, mode, email, password, userId, maskAccount, filter: envText(env, "FILTER") };
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean" || (typeof value === "string" && !value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function timestampMs(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = numberOrNull(value);
  const ms = numeric !== null ? (numeric < 1e12 ? numeric * 1000 : numeric) : Date.parse(value);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function percentMetric(label, used, resetAt) {
  const n = numberOrNull(used);
  return { label, kind: "percent", remaining: n === null || n < 0 ? null : Math.max(0, Math.min(1, 1 - n / 100)), used: n, resetAt: timestampMs(resetAt) };
}

function balanceMetric(label, remaining, currency, total) {
  return { label, kind: currency ? "balance" : "number", remaining: numberOrNull(remaining), currency: currency || "", total: numberOrNull(total) };
}

function accountRecord(raw = {}) {
  return { id: String(raw.id ?? raw.name ?? "account"), name: String(raw.name || raw.email || "账号"), email: String(raw.email || ""), provider: String(raw.provider || ""), plan: String(raw.plan || ""), status: raw.status || "unknown", statusLabel: raw.statusLabel || "", metrics: raw.metrics || [], error: raw.error || null };
}

function statusFrom(value, disabled, unavailable) {
  const s = String(value || "").toLowerCase();
  if (disabled || ["disabled", "inactive", "banned"].includes(s)) return "disabled";
  if (unavailable || ["error", "abnormal", "expired", "unauthorized", "cooldown", "rate_limited", "quota_exhausted"].includes(s)) return "error";
  if (["ready", "active", "enabled", "healthy", "ok"].includes(s)) return "ready";
  return "unknown";
}

function httpError(status) {
  const hints = { 400: "请求参数不匹配", 401: "凭据无效或已过期", 403: "权限不足或远程管理未开放", 404: "接口不存在，请核对服务类型和地址", 429: "请求过于频繁，请稍后刷新" };
  const error = new Error(`HTTP ${status} · ${hints[status] || "服务返回异常"}`);
  error.status = status;
  return error;
}

async function requestJSON(ctx, url, options = {}) {
  let response;
  try {
    const { method = "GET", ...rest } = options;
    response = await ctx.http[method.toLowerCase()](url, { timeout: 5000, redirect: "error", credentials: "omit", ...rest });
  } catch (_) {
    throw new Error("连接失败或超时，请检查地址、网络和 TLS 证书");
  }
  if (!response || response.status < 200 || response.status >= 300) throw httpError(response?.status || 0);
  try { return await response.json(); } catch (_) { throw new Error("接口返回的不是有效 JSON，请检查服务地址"); }
}

function authHeaders(key, extra = {}) {
  return { Accept: "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}), ...extra };
}

function requireKey(config) {
  if (!config.apiKey) throw new Error("请填写 API_KEY，凭据类型以当前平台说明为准");
}

function filterAccounts(accounts, filter) {
  if (!filter) return accounts;
  const terms = filter.split(/[,，]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  return accounts.flatMap((acc, index) => {
    const identity = [acc.name, acc.email, acc.provider, acc.plan].join(" ").toLowerCase();
    if (terms.some(term => /^\d+$/.test(term) ? index + 1 === Number(term) : identity.includes(term))) return [acc];
    const metrics = (acc.metrics || []).filter(metric => terms.some(term => !/^\d+$/.test(term) && String(metric.label || "").toLowerCase().includes(term)));
    return metrics.length ? [{ ...acc, metrics }] : [];
  });
}

// 非加密指纹只用于缓存隔离，不用于鉴权；不持久化密钥、密码、请求头或原始 API 响应。
function cacheFingerprint(text) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    b = Math.imul(b ^ text.charCodeAt(i), 2246822519);
  }
  return `${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
}

function redactSnapshot(snapshot, config) {
  const secrets = [config.apiKey, config.password].filter(Boolean).sort((a, b) => b.length - a.length);
  return JSON.parse(JSON.stringify(snapshot, (key, value) => {
    if (typeof value !== "string") return value;
    let text = value;
    secrets.forEach(secret => { text = text.split(secret).join("[REDACTED]"); });
    return text.replace(/Bearer\s+[^\s"<>]+/gi, "Bearer [REDACTED]");
  }));
}

function cacheKey(config) {
  return `ai_usage_v2_${cacheFingerprint(JSON.stringify([config.provider, config.baseUrl, config.mode, config.email, config.userId, config.apiKey, config.password, config.filter]))}`;
}


// CLIProxyAPI official management API adapter.
// v0 is tried first for existing deployments; v8 is used only after a 404.

const CLIPROXY_CODEX_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const CLIPROXY_CODEX_HEADERS = {
  Authorization: "Bearer $TOKEN$",
  "Content-Type": "application/json",
  "User-Agent": "codex-tui/0.149.1 (Mac OS 26.5.2; arm64) iTerm.app/3.6.11 (codex-tui; 0.149.1)",
};
const CLIPROXY_QUOTA_CONCURRENCY = 6;
const CLIPROXY_MAX_QUOTA_ACCOUNTS = 6;
const CLIPROXY_UNKNOWN_METRIC = "配额（未知）";

function cliproxyManagementHeaders(config) {
  return authHeaders("", { "X-Management-Key": config.apiKey });
}

function cliproxyErrorMessage(error) {
  return String(error?.message || "CLIProxyAPI 请求失败").replace(/Bearer\s+[^\s"<>]+/gi, "Bearer [REDACTED]");
}

async function cliproxyManagementJSON(ctx, config, v0Path, v8Path) {
  const headers = cliproxyManagementHeaders(config);
  try {
    return await requestJSON(ctx, `${config.baseUrl}/v0/management${v0Path}`, { headers });
  } catch (error) {
    // A credential/auth failure is not a version probe. Never retry 401/403.
    if (error?.status !== 404) throw error;
    return requestJSON(ctx, `${config.baseUrl}/v8/management${v8Path}`, { headers });
  }
}

async function cliproxyGenericJSON(ctx, config, v0Path, v8Path, body) {
  const headers = cliproxyManagementHeaders(config);
  let response;
  try {
    response = await ctx.http.post(`${config.baseUrl}/v0/management${v0Path}`, {
      timeout: 4000, redirect: "error", credentials: "omit", headers, body,
    });
  } catch (_) {
    throw new Error("连接失败或超时，请检查地址、网络和 TLS 证书");
  }
  if (response?.status === 404) {
    try {
      response = await ctx.http.post(`${config.baseUrl}/v8/management${v8Path}`, {
        timeout: 4000, redirect: "error", credentials: "omit", headers, body,
      });
    } catch (_) {
      throw new Error("连接失败或超时，请检查地址、网络和 TLS 证书");
    }
  }
  if (!response || response.status < 200 || response.status >= 300) throw httpError(response?.status || 0);
  try { return await response.json(); } catch (_) { throw new Error("接口返回的不是有效 JSON，请检查服务地址"); }
}

function cliproxyJSONBody(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) { return null; }
  }
  return null;
}

function cliproxyUnknownMetric(detail = "该账号类型暂无已适配配额接口") {
  const metric = percentMetric(CLIPROXY_UNKNOWN_METRIC, null, null);
  metric.detail = detail;
  return metric;
}

function cliproxyAuthRecord(raw) {
  const type = String(raw?.type || raw?.provider || "").trim();
  const email = String(raw?.email || "").trim();
  const claims = raw?.id_token && typeof raw.id_token === "object" ? raw.id_token : {};
  const plan = String(raw?.plan || raw?.plan_type || claims.plan_type || "").trim();
  const statusValue = raw?.status || (raw?.disabled ? "disabled" : raw?.unavailable ? "error" : "unknown");
  const unavailable = raw?.unavailable === true || ["error", "abnormal", "expired", "unauthorized", "cooldown", "rate_limited"].includes(String(statusValue).toLowerCase());
  const id = raw?.auth_index ?? raw?.id ?? raw?.name ?? "account";
  return {
    raw,
    record: accountRecord({
      id,
      name: raw?.name || email || raw?.label || raw?.account || "账号",
      email,
      provider: type,
      plan,
      status: statusFrom(statusValue, raw?.disabled === true, unavailable),
      statusLabel: String(raw?.status_message || raw?.status || ""),
      metrics: [],
    }),
  };
}

function cliproxyCodexWindowMetrics(payload) {
  if (!payload || typeof payload !== "object") return [];
  const windows = [];
  const add = (label, window) => {
    if (!window || typeof window !== "object") return;
    const rawUsed = window.used_percent ?? window.usedPercent;
    const used = numberOrNull(rawUsed);
    const seconds = numberOrNull(window.limit_window_seconds ?? window.limitWindowSeconds);
    let windowLabel = label;
    if (seconds !== null && seconds >= 28 * 86400 && seconds <= 31 * 86400) windowLabel = "月窗配额";
    else if (seconds !== null && seconds >= 6 * 86400 && seconds <= 8 * 86400) windowLabel = "7D 配额";
    else if (seconds !== null && seconds >= 4 * 3600 && seconds <= 6 * 3600) windowLabel = "5H 配额";
    const explicitReset = timestampMs(window.reset_at ?? window.resetAt);
    const afterSeconds = numberOrNull(window.reset_after_seconds ?? window.resetAfterSeconds);
    const resetAt = explicitReset ?? (afterSeconds !== null && afterSeconds >= 0 ? Date.now() + afterSeconds * 1000 : null);
    windows.push(percentMetric(label === "Codex 配额" ? windowLabel : `${label} · ${windowLabel}`, used, resetAt));
  };
  const addRateLimit = (label, rate) => {
    if (!rate || typeof rate !== "object") return;
    const primary = rate.primary_window ?? rate.primaryWindow;
    const secondary = rate.secondary_window ?? rate.secondaryWindow;
    add(label, primary);
    add(label, secondary);
  };
  addRateLimit("Codex 配额", payload.rate_limit ?? payload.rateLimit);
  addRateLimit("Codex Code Review 配额", payload.code_review_rate_limit ?? payload.codeReviewRateLimit);
  const additional = payload.additional_rate_limits ?? payload.additionalRateLimits;
  if (Array.isArray(additional)) {
    for (const item of additional) {
      const name = String(item?.limit_name ?? item?.limitName ?? item?.metered_feature ?? item?.meteredFeature ?? "附加配额");
      addRateLimit(name, item?.rate_limit ?? item?.rateLimit);
    }
  }
  return windows;
}

function cliproxyHasCodex(raw) {
  return String(raw?.type || raw?.provider || "").trim().toLowerCase() === "codex" && Boolean(raw?.auth_index);
}

async function cliproxyFetchCodexQuota(ctx, config, raw) {
  const authIndex = String(raw.auth_index);
  const result = await cliproxyGenericJSON(ctx, config, "/api-call", "/requests/api-call", {
    auth_index: authIndex,
    method: "GET",
    url: CLIPROXY_CODEX_USAGE_URL,
    header: {
      ...CLIPROXY_CODEX_HEADERS,
      ...((raw.chatgpt_account_id || raw.metadata?.chatgpt_account_id || raw.attributes?.chatgpt_account_id || raw.id_token?.chatgpt_account_id) ? { "Chatgpt-Account-Id": String(raw.chatgpt_account_id || raw.metadata?.chatgpt_account_id || raw.attributes?.chatgpt_account_id || raw.id_token?.chatgpt_account_id) } : {}),
    },
  });
  const statusCode = numberOrNull(result?.status_code);
  if (statusCode === null || statusCode < 200 || statusCode >= 300) {
    const error = new Error(`Codex 配额请求失败（上游 HTTP ${statusCode ?? "unknown"}）`);
    error.status = statusCode;
    throw error;
  }
  const payload = cliproxyJSONBody(result.body);
  if (!payload) throw new Error("Codex 配额响应不是有效 JSON");
  const metrics = cliproxyCodexWindowMetrics(payload);
  return metrics.length ? metrics : [cliproxyUnknownMetric("Codex 配额响应未包含可识别的 usage window")];
}

function cliproxySupportsQuota(raw) {
  return ["codex", "claude"].includes(String(raw?.type || raw?.provider || "").toLowerCase()) && Boolean(raw?.auth_index);
}

async function cliproxyFetchQuota(ctx, config, raw) {
  if (cliproxyHasCodex(raw)) return cliproxyFetchCodexQuota(ctx, config, raw);
  const result = await cliproxyGenericJSON(ctx, config, "/api-call", "/requests/api-call", {
    auth_index: String(raw.auth_index), method: "GET", url: "https://api.anthropic.com/api/oauth/usage",
    header: { Authorization: "Bearer $TOKEN$", "Content-Type": "application/json", Accept: "application/json", "anthropic-beta": "oauth-2025-04-20", "User-Agent": "claude-cli/2.1.280 (external, cli)" },
  });
  const status = numberOrNull(result?.status_code);
  if (status === null || status < 200 || status >= 300) throw new Error(`Claude 配额请求失败（上游 HTTP ${status ?? "unknown"}）`);
  const data = cliproxyJSONBody(result.body);
  if (!data) throw new Error("Claude 配额响应不是有效 JSON");
  const metrics = [];
  for (const [key,label] of [["five_hour","5H 配额"],["seven_day","7D 配额"],["seven_day_opus","Opus 7D"],["seven_day_sonnet","Sonnet 7D"]]) {
    if (data[key] && typeof data[key] === "object") metrics.push(percentMetric(label, data[key].utilization, data[key].resets_at));
  }
  return metrics.length ? metrics : [cliproxyUnknownMetric("Claude 未返回可识别窗口")];
}

async function cliproxyMapWithLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = await worker(items[index], index); }
      catch (error) { results[index] = { error }; }
    }
  });
  await Promise.all(runners);
  return results;
}

async function fetchCLIProxyData(ctx, config) {
  requireKey(config);
  if (!["auto", "admin"].includes(config.mode)) throw new Error("CLIProxyAPI 请使用 Auto 或 Admin 模式的管理密钥");

  const response = await cliproxyManagementJSON(ctx, config, "/auth-files", "/credentials");
  if (!Array.isArray(response?.files)) throw new Error("CLIProxyAPI 账号结构不匹配（缺少 files）");

  const mapped = response.files.map(cliproxyAuthRecord);
  const selected = new Set(filterAccounts(mapped.map(item => ({ ...item.record, metrics: cliproxyHasCodex(item.raw) ? [{label: "Codex 配额 5H 7D 月窗 Code Review"}] : String(item.raw?.type || item.raw?.provider || "").trim().toLowerCase() === "claude" ? [{label: "Claude 配额 5H 7D Opus Sonnet"}] : [] })), config.filter).map(item => item.id));
  const quotaTargets = mapped.filter(item => (!config.filter || selected.has(item.record.id)) && cliproxySupportsQuota(item.raw) && item.record.status !== "disabled").slice(0, CLIPROXY_MAX_QUOTA_ACCOUNTS);
  const quotaResults = await cliproxyMapWithLimit(quotaTargets, CLIPROXY_QUOTA_CONCURRENCY, item => cliproxyFetchQuota(ctx, config, item.raw));
  const quotaById = new Map(quotaTargets.map((item, index) => [String(item.raw.auth_index), quotaResults[index]]));

  return mapped.map(item => {
    const key = String(item.raw?.auth_index ?? "");
    if (cliproxySupportsQuota(item.raw) && quotaById.has(key)) {
      const result = quotaById.get(key);
      if (result?.error) {
        item.record.error = cliproxyErrorMessage(result.error);
        item.record.metrics = [cliproxyUnknownMetric("配额读取失败；未猜测额度")];
      } else {
        item.record.metrics = result;
      }
    } else {
      item.record.metrics = [cliproxyUnknownMetric(cliproxySupportsQuota(item.raw) ? (item.record.status === "disabled" ? "已禁用，未请求配额" : "本次最多读取 6 个账号配额；请用 FILTER 选择关注账号") : "该账号类型暂无已适配配额接口")];
    }
    delete item.raw;
    return accountRecord(item.record);
  });
}


// Codex2API: james-6-23/codex2api docs/API.md, admin/key_usage_public.go.
async function fetchCodex2APIData(ctx, config) {
  requireKey(config);
  const mode = config.mode === "auto" ? "admin" : config.mode;
  if (!["admin", "api_key"].includes(mode)) throw new Error("Codex2API 请选 Admin（管理密钥）或 API Key（公开自助用量）");
  if (mode === "admin") {
    const response = await requestJSON(ctx, `${config.baseUrl}/api/admin/accounts`, { headers: authHeaders("", { "X-Admin-Key": config.apiKey }) });
    if (!Array.isArray(response?.accounts)) throw new Error("Codex2API 账号结构不匹配（缺少 accounts）");
    return response.accounts.map(raw => accountRecord({
      id: raw.id, name: raw.name, email: raw.email, provider: raw.channel || "Codex", plan: raw.plan_type,
      status: statusFrom(raw.status, raw.enabled === false, ["banned", "risky"].includes(raw.health_tier)),
      statusLabel: raw.health_tier ? String(raw.health_tier) : "",
      metrics: [percentMetric("5H 配额", raw.usage_percent_5h, raw.reset_5h_at), percentMetric(raw.usage_window_7d_kind === "monthly" ? "月窗配额" : "7D 配额", raw.usage_percent_7d, raw.reset_7d_at)],
    }));
  }
  const response = await requestJSON(ctx, `${config.baseUrl}/api/key-usage/summary`, { headers: authHeaders(config.apiKey) });
  if (!response?.key || typeof response.key !== "object") throw new Error("Codex2API 公开用量结构不匹配；需在后台启用 API Key 自助用量页");
  const key = response.key;
  const limit = numberOrNull(key.quota_limit), used = numberOrNull(key.quota_used);
  const metrics = [{ ...balanceMetric("Key 累计余额", limit !== null && limit > 0 && used !== null ? Math.max(0, limit - used) : null, "USD", limit > 0 ? limit : null), used, detail: limit === 0 ? "Key 未设累计额度上限" : "累计美元额度 · 非周配额" }];
  if (Array.isArray(response.model_request_usage)) {
    for (const rule of response.model_request_usage) {
      const metric = balanceMetric(`${rule.model || "模型"} ${rule.window || "窗口"} 剩余次数`, rule.remaining, "", rule.limit);
      metric.used = numberOrNull(rule.used);
      metric.resetAt = timestampMs(rule.reset_at);
      metric.detail = `请求次数${rule.timezone ? " · " + rule.timezone : ""}`;
      metrics.push(metric);
    }
  }
  return [accountRecord({ id: "codex2api-key", name: key.name || "API Key", provider: "Codex2API", status: statusFrom(key.status), statusLabel: key.status === "active" ? "已读取" : String(key.status || ""), metrics })];
}


// AxonHub official unstable GraphQL adapter.
// Sources (looplj/axonhub, unstable):
// - frontend/src/lib/api-client.ts (/admin/auth/signin)
// - frontend/src/lib/auth-session.ts + frontend/src/gql/graphql.ts (/admin/graphql, Bearer JWT)
// - internal/server/gql/axonhub.graphql (queryChannels, providerQuotaStatus, APIKeyQuota schema)
// - internal/server/gql/ent.graphql (ProviderQuotaStatus fields)
// Provider quota is read from providerQuotaStatus.quotaData._limits[].usageRatio.
// periodQuota is deliberately ignored: the upstream code documents it as an estimate, not balance.

const AXONHUB_GRAPHQL_QUERY = `
  query WidgetProviderQuotas($input: QueryChannelInput!) {
    queryChannels(input: $input) {
      edges {
        node {
          id
          name
          type
          providerQuotaStatus {
            providerType
            status
            ready
            nextResetAt
            nextCheckAt
            updatedAt
            accountKey
            quotaData
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

function axonhubGraphQLError(data) {
  if (!data || !Array.isArray(data.errors) || !data.errors.length) return "";
  return data.errors.map(error => String(error?.message || "GraphQL 请求失败")).join("；");
}

function axonhubObject(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  }
  return null;
}

function axonhubLoginRequired(config) {
  if (!config.email || !config.password) throw new Error("AxonHub User/Admin 模式需 EMAIL 与 PASSWORD，或填写已有 API_KEY / JWT");
}

async function axonhubGetToken(ctx, config, mode) {
  if (config.apiKey) return config.apiKey;
  if (mode === "api_key") requireKey(config);
  axonhubLoginRequired(config);
  const response = await requestJSON(ctx, `${config.baseUrl}/admin/auth/signin`, {
    method: "POST",
    headers: authHeaders("", { "Content-Type": "application/json" }),
    body: { email: config.email, password: config.password },
  });
  if (!response || typeof response.token !== "string" || !response.token.trim()) {
    throw new Error("AxonHub 登录失败：响应缺少顶层 token");
  }
  // Deliberately scoped to this invocation; never written to storage or returned.
  return response.token.trim();
}

function axonhubStatus(value, ready) {
  const status = String(value || "").toLowerCase();
  if (["disabled", "inactive", "banned"].includes(status)) return "disabled";
  if (["exhausted", "error", "failed"].includes(status)) return "error";
  if (ready === true || ["available", "warning", "ready", "active", "ok"].includes(status)) return "ready";
  return "unknown";
}

function axonhubStatusLabel(value, ready) {
  const status = String(value || "").trim();
  if (status) return status;
  if (ready === true) return "ready";
  return "unknown";
}

function axonhubLimitMetrics(quotaStatus, channelName) {
  const quotaData = axonhubObject(quotaStatus?.quotaData);
  // _limits and usageRatio are the official normalized quota fields. Do not
  // interpret requestCount, totalTokens, cost, or periodQuota as a balance.
  const limits = Array.isArray(quotaData?._limits) ? quotaData._limits : [];
  return limits.map((limit, index) => {
    const ratio = numberOrNull(limit?.usageRatio);
    const validRatio = ratio !== null && ratio >= 0 && ratio <= 1 ? ratio : null;
    const window = String(limit?.window || limit?.type || `窗口 ${index + 1}`);
    const type = String(limit?.type || "");
    const label = channelName ? `${channelName} · ${window} 配额` : `${window} 配额`;
    const detailParts = [type, limit?.status, "AxonHub usageRatio"].filter(Boolean).map(String);
    return {
      label,
      kind: "percent",
      remaining: validRatio === null ? null : 1 - validRatio,
      used: validRatio === null ? null : validRatio * 100,
      resetAt: timestampMs(limit?.nextResetAt ?? quotaStatus?.nextResetAt),
      detail: detailParts.join(" · "),
    };
  });
}

function axonhubAccountKey(channel, quotaStatus) {
  const accountKey = String(quotaStatus?.accountKey || "").trim();
  return accountKey || `channel:${String(channel?.id || channel?.name || "unknown")}`;
}

function axonhubAddChannel(accounts, channel) {
  const quotaStatus = channel?.providerQuotaStatus;
  const key = axonhubAccountKey(channel, quotaStatus);
  let account = accounts.get(key);
  const channelName = String(channel?.name || channel?.id || "AxonHub channel");
  if (!account) {
    const statusValue = quotaStatus?.status;
    const status = axonhubStatus(statusValue, quotaStatus?.ready);
    account = {
      id: key,
      name: String(quotaStatus?.accountKey || channelName),
      email: "",
      provider: "AxonHub",
      plan: String(quotaStatus?.providerType || channel?.type || ""),
      status,
      statusLabel: axonhubStatusLabel(statusValue, quotaStatus?.ready),
      metrics: [],
      error: null,
    };
    accounts.set(key, account);
  }
  const metrics = axonhubLimitMetrics(quotaStatus, channelName);
  const seen = new Set(account.metrics.map(metric => `${metric.label}|${metric.resetAt || ""}`));
  for (const metric of metrics) {
    const metricKey = `${metric.label}|${metric.resetAt || ""}`;
    if (!seen.has(metricKey)) {
      account.metrics.push(metric);
      seen.add(metricKey);
    }
  }
  return account;
}

async function axonhubQueryChannels(ctx, config, token) {
  const headers = authHeaders(token, { "Content-Type": "application/json" });
  const channels = [];
  let after = null;
  let page = 0;
  while (page++ < 1000) {
    const input = { first: 100 };
    if (after) input.after = after;
    const response = await requestJSON(ctx, `${config.baseUrl}/admin/graphql`, {
      method: "POST",
      headers,
      body: { query: AXONHUB_GRAPHQL_QUERY, variables: { input }, operationName: "WidgetProviderQuotas" },
    });
    const graphqlError = axonhubGraphQLError(response);
    if (graphqlError) throw new Error(`AxonHub GraphQL 查询失败：${graphqlError}`);
    const connection = response?.data?.queryChannels;
    if (!connection || !Array.isArray(connection.edges) || !connection.pageInfo) {
      throw new Error("AxonHub GraphQL 响应结构不匹配：缺少 queryChannels");
    }
    for (const edge of connection.edges) if (edge?.node) channels.push(edge.node);
    if (connection.pageInfo.hasNextPage !== true) break;
    const next = connection.pageInfo.endCursor;
    if (!next || next === after) throw new Error("AxonHub 分页游标无效");
    after = next;
  }
  if (page > 1000) throw new Error("AxonHub 分页超过安全上限");
  return channels;
}

async function fetchAxonHubData(ctx, config) {
  const requestedMode = config.mode || "auto";
  if (!["auto", "admin", "api_key", "user"].includes(requestedMode)) throw new Error("AxonHub mode 只能是 auto / admin / api_key / user");
  const mode = requestedMode === "auto"
    ? (config.email && config.password && !config.apiKey ? "user" : config.apiKey ? "admin" : "user")
    : requestedMode;
  if (mode === "api_key" && !config.apiKey) requireKey(config);
  const token = await axonhubGetToken(ctx, config, mode);
  const channels = await axonhubQueryChannels(ctx, config, token);
  const accounts = new Map();
  for (const channel of channels) axonhubAddChannel(accounts, channel);
  return Array.from(accounts.values()).map(accountRecord);
}


// Sub2API: Wei-Shaw/sub2api backend/internal/server/routes/{gateway,auth}.go
// gateway_handler.go 的 /v1/usage 返回原始对象；面板接口使用 {code:0,data}。
async function fetchSub2APIData(ctx, config) {
  const mode = config.mode === "auto" ? (config.email && config.password && !config.apiKey ? "user" : "api_key") : config.mode;
  if (!["api_key", "user"].includes(mode)) throw new Error("Sub2API 请选择 API Key（调用密钥）或 User（用户 JWT / 邮箱登录）");
  if (mode === "user") {
    let token = config.apiKey;
    if (!token) {
      if (!config.email || !config.password) throw new Error("Sub2API User 模式需用户访问令牌，或 EMAIL 与 PASSWORD");
      const login = await requestJSON(ctx, `${config.baseUrl}/api/v1/auth/login`, { method: "POST", headers: authHeaders("", { "Content-Type": "application/json" }), body: { email: config.email, password: config.password } });
      if (login?.data?.requires_2fa) throw new Error("Sub2API 需要 2FA，请先在网页登录，再填写用户访问令牌");
      if (login?.code !== 0 || !login.data?.access_token) throw new Error("Sub2API 登录失败；启用验证码 / MFA 时请使用用户访问令牌");
      token = login.data.access_token;
    }
    const response = await requestJSON(ctx, `${config.baseUrl}/api/v1/auth/me`, { headers: authHeaders(token) });
    if (response?.code !== 0 || !response?.data || typeof response.data !== "object") throw new Error("Sub2API 用户资料结构不匹配");
    const user = response.data;
    return [accountRecord({ id: user.id, name: user.username || user.email, email: user.email, provider: "Sub2API", status: statusFrom(user.status), metrics: [balanceMetric("钱包余额", user.balance, "USD")] })];
  }
  requireKey(config);
  const data = await requestJSON(ctx, `${config.baseUrl}/v1/usage`, { headers: authHeaders(config.apiKey) });
  if (!data || !["quota_limited", "unrestricted"].includes(data.mode)) throw new Error("Sub2API 用量结构不匹配（缺少 mode）");
  const metrics = [];
  if (data.quota && typeof data.quota === "object") metrics.push({ ...balanceMetric("Key 累计余额", data.quota.remaining, data.quota.unit || "USD", data.quota.limit), used: numberOrNull(data.quota.used) });
  if (Array.isArray(data.rate_limits)) {
    for (const window of data.rate_limits) {
      metrics.push({ ...balanceMetric(`${String(window.window || "窗口").toUpperCase()} 余额`, window.remaining, "USD", window.limit), used: numberOrNull(window.used), resetAt: timestampMs(window.reset_at) });
    }
  }
  if (data.subscription && typeof data.subscription === "object") {
    const sub = data.subscription;
    for (const [key, label] of [["daily", "日"], ["weekly", "周"], ["monthly", "月"]]) {
      const limit = numberOrNull(sub[`${key}_limit_usd`]), used = numberOrNull(sub[`${key}_usage_usd`]);
      if (limit !== null && limit > 0) metrics.push({ ...balanceMetric(`${label}订阅余额`, used !== null ? Math.max(0, limit - used) : null, "USD", limit), used });
    }
  }
  if (!metrics.length) {
    const remaining = numberOrNull(data.balance ?? data.remaining);
    metrics.push({ ...balanceMetric("钱包 / 订阅余额", remaining !== null && remaining >= 0 ? remaining : null, data.unit || "USD"), detail: remaining === -1 ? "订阅未设额度上限" : "" });
  }
  const expiry = timestampMs(data.expires_at || data.subscription?.expires_at);
  const expired = expiry !== null && expiry <= Date.now();
  return [accountRecord({ id: "sub2api-key", name: data.planName || "API Key", provider: "Sub2API", status: expired || data.isValid === false ? "error" : statusFrom(data.status || (data.isValid === true ? "active" : "unknown")), error: expired ? "API Key / 订阅已过期" : null, metrics })];
}


// New API: router/api-router.go + controller/token.go, controller/user.go.
// quota 是站点内部额度单位；不假设 QuotaPerUnit，也不伪装美元/周配额。
async function fetchNewAPIData(ctx, config) {
  requireKey(config);
  const mode = config.mode === "auto" ? "api_key" : config.mode;
  if (!["api_key", "user"].includes(mode)) throw new Error("New API 请选 API Key（模型调用密钥）或 User（后台访问令牌）");
  if (mode === "user") {
    if (config.userId && !/^[1-9]\d*$/.test(config.userId)) throw new Error("USER_ID 如需填写，必须为正整数");
    const response = await requestJSON(ctx, `${config.baseUrl}/api/user/self`, { headers: authHeaders(config.apiKey, config.userId ? { "New-Api-User": config.userId } : {}) });
    if (response?.success !== true || !response.data || typeof response.data !== "object") throw new Error("New API 用户信息读取失败，请检查后台访问令牌和权限");
    const data = response.data;
    return [accountRecord({ id: data.id, name: data.display_name || data.username, email: data.email, provider: "New API", status: data.status === 1 ? "ready" : data.status === undefined ? "unknown" : "disabled", metrics: [{ ...balanceMetric("账户剩余额度", data.quota, ""), used: numberOrNull(data.used_quota), detail: "站点额度单位 · 非美元" }] })];
  }
  const response = await requestJSON(ctx, `${config.baseUrl}/api/usage/token/`, { headers: authHeaders(config.apiKey) });
  if (response?.success === false || response?.code === false || !response?.data || response.data.object !== "token_usage") throw new Error("New API 令牌额度结构不匹配，请确认使用模型调用 API Key");
  const data = response.data;
  const expiredAt = timestampMs(data.expires_at);
  const expired = expiredAt !== null && expiredAt <= Date.now();
  const metric = { ...balanceMetric("令牌剩余额度", data.unlimited_quota ? null : data.total_available, "", data.unlimited_quota ? null : data.total_granted), used: numberOrNull(data.total_used), detail: data.unlimited_quota ? "令牌未设上限 · 仍受账户余额约束" : "站点额度单位 · 非美元" };
  const metrics = [metric];
  if (data.user_quota && typeof data.user_quota === "object") metrics.push({ ...balanceMetric("账户剩余额度", data.user_quota.total_available, ""), used: numberOrNull(data.user_quota.total_used), detail: "站点额度单位 · 非美元" });
  return [accountRecord({ id: "newapi-key", name: data.name || "API Key", provider: "New API", status: expired ? "error" : "ready", statusLabel: expired ? "已过期" : data.unlimited_quota ? "未设上限" : "已读取", error: expired ? "API Key 已过期" : null, metrics })];
}


// DeepSeek: https://api-docs.deepseek.com/api/get-user-balance
async function fetchDeepSeekData(ctx, config) {
  requireKey(config);
  if (!["auto", "api_key"].includes(config.mode)) throw new Error("DeepSeek 请使用 API Key 模式与官方模型调用密钥");
  const data = await requestJSON(ctx, `${config.baseUrl}/user/balance`, { headers: authHeaders(config.apiKey) });
  if (!Array.isArray(data?.balance_infos)) throw new Error("DeepSeek 余额结构不匹配（缺少 balance_infos）");
  if (typeof data.is_available !== "boolean") throw new Error("DeepSeek 余额结构不匹配（缺少 is_available）");
  return [accountRecord({
    id: "deepseek-balance", name: "DeepSeek", provider: "DeepSeek", status: data.is_available ? "ready" : "error",
    statusLabel: data.is_available ? "可调用" : "余额不足",
    metrics: data.balance_infos.map(info => balanceMetric("账户余额", info.total_balance, info.currency)),
  })];
}


// Antigravity-Manager (lbjlaq/Antigravity-Manager) adapter.
// Sources checked with gh api (main):
// - https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/proxy/server.rs
//   GET /api/accounts -> { accounts: AccountResponse[], current_account_id }
//   The response includes the persisted quota snapshot on each account.
// - https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/proxy/middleware/auth.rs
//   Management routes require Authorization: Bearer <admin_password>; when
//   admin_password is unset, the server falls back to api_key. A user token is
//   not an admin credential for this route.
// - https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/models/quota.rs
//   quota_groups[].buckets[].remaining_fraction is already a 0..1 remainder;
//   legacy quota.models[].percentage is a 0..100 remainder.
//
// This deliberately performs only GET /api/accounts. Do not call
// /api/accounts/refresh or /api/accounts/:accountId/quota: those handlers fetch
// upstream quota and persist it, so they are not read-only.

function agyMetricDetail(quota, observedAt) {
  const lastUpdated = timestampMs(quota?.last_updated);
  const observed = timestampMs(observedAt) || lastUpdated;
  if (observed !== null && observed < Date.now() - 5 * 60 * 1000) {
    return `服务缓存 · ${new Date(observed).toISOString()}`;
  }
  return undefined;
}

function agyRemainingFraction(value) {
  const n = numberOrNull(value);
  return n !== null && n >= 0 && n <= 1 ? n : null;
}

function agyQuotaMetrics(quota) {
  if (!quota || typeof quota !== "object") return [];
  const metrics = [];

  if (Array.isArray(quota.quota_groups)) {
    for (const group of quota.quota_groups) {
      if (!group || typeof group !== "object" || !Array.isArray(group.buckets)) continue;
      for (const bucket of group.buckets) {
        if (!bucket || typeof bucket !== "object") continue;
        const bucketName = bucket.display_name || bucket.bucket_id || bucket.window || "配额";
        const groupName = group.display_name || "配额";
        metrics.push({
          label: `${groupName} · ${bucketName}`,
          kind: "percent",
          remaining: agyRemainingFraction(bucket.remaining_fraction),
          resetAt: timestampMs(bucket.reset_time),
          detail: agyMetricDetail(quota, bucket.observed_at),
        });
      }
    }
  }

  // Older servers expose only models[].percentage. Prefer quota_groups when it
  // yielded buckets, otherwise retain every legacy model supplied by upstream.
  if (!metrics.length && Array.isArray(quota.models)) {
    for (const model of quota.models) {
      if (!model || typeof model !== "object") continue;
      const percentage = numberOrNull(model.percentage);
      metrics.push({
        label: model.display_name || model.name || "模型配额",
        kind: "percent",
        remaining: percentage !== null && percentage >= 0 && percentage <= 100 ? percentage / 100 : null,
        resetAt: timestampMs(model.reset_time),
        detail: agyMetricDetail(quota),
      });
    }
  }

  return metrics;
}

function agyAccountStatus(account, quota) {
  if (account?.disabled || account?.proxy_disabled) return "disabled";
  if (account?.validation_blocked || quota?.is_forbidden) return "error";
  if (quota && typeof quota === "object") return "ready";
  return "unknown";
}

function agyAccountStatusLabel(account, quota, status) {
  if (status === "disabled") {
    return account.disabled_reason || account.proxy_disabled_reason || "已禁用";
  }
  if (status === "error") {
    return quota?.forbidden_reason || account.validation_blocked_reason || "配额不可用";
  }
  if (status === "ready") return agyMetricDetail(quota) ? "服务缓存" : "可用";
  return "暂无配额快照";
}

async function fetchAgyData(ctx, config) {
  if (config.mode === "user") {
    throw new Error("Agy Tools 管理接口不接受普通用户 token，请使用 Admin 密码或 API Key");
  }

  // auth.rs gives admin_password precedence over api_key for strict management
  // routes. This also mirrors its api_key fallback when no admin password is set.
  const credential = config.mode === "api_key"
    ? config.apiKey
    : (config.password || config.apiKey);
  if (!credential) throw new Error("Agy Tools 请填写 PASSWORD（admin_password）或 API_KEY");

  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const data = await requestJSON(ctx, `${baseUrl}/api/accounts`, {
    method: "GET",
    headers: authHeaders(credential),
  });
  if (!data || !Array.isArray(data.accounts)) {
    throw new Error("Agy Tools 账号结构不匹配（GET /api/accounts 缺少 accounts）");
  }

  return data.accounts.map((account, index) => {
    const quota = account && typeof account.quota === "object" ? account.quota : null;
    const status = agyAccountStatus(account, quota);
    const error = status === "error"
      ? (quota?.forbidden_reason || account.validation_blocked_reason || "账号配额不可用")
      : null;
    return accountRecord({
      id: account?.id || account?.email || `agy-account-${index + 1}`,
      name: account?.name || account?.email || `账号 ${index + 1}`,
      email: account?.email || "",
      provider: "Agy Tools",
      plan: quota?.subscription_tier || "",
      status,
      statusLabel: agyAccountStatusLabel(account, quota, status),
      metrics: agyQuotaMetrics(quota),
      error,
    });
  });
}


/* Egern native Widget DSL. Concatenation-safe: UI constants/functions only, no exports,
 * I/O, third-party dependencies, runtime fixtures, HTML, or animation. Entry point:
 * renderUsageWidget(ctx, snapshot, meta, options). See official widgets DSL documentation.
 */
const UI_USAGE_COLORS = {
  background: { light: '#FFFFFF', dark: '#151515' },
  card: { light: '#F3F3F5', dark: '#252527' },
  primary: { light: '#171717', dark: '#FFFFFF' },
  secondary: { light: '#616167', dark: '#ACACB3' },
  neutral: { light: '#616167', dark: '#ACACB3' },
  good: { light: '#16713D', dark: '#54D38A' },
  warning: { light: '#925000', dark: '#FFBC56' },
  danger: { light: '#AF201A', dark: '#FF7D75' },
};
const UI_USAGE_FAMILIES = ['systemSmall', 'systemMedium', 'systemLarge', 'systemExtraLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'];

function uiUsageText(value, fallback) {
  return value === null || value === undefined || value === '' ? (fallback || '') : String(value);
}
function uiUsageNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function uiUsageISO(value) {
  const number = uiUsageNumber(value);
  if (number === null) return null;
  const date = new Date(number);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function uiUsageTextNode(text, size, color, weight, mono, lines) {
  const font = { size: size || 12, weight: weight || 'regular' };
  if (mono) font.family = 'Menlo';
  return { type: 'text', text: uiUsageText(text), font, textColor: color || UI_USAGE_COLORS.primary,
    maxLines: lines || 1, minScale: 0.8 };
}
function uiUsageStack(children, direction, gap, extra) {
  return Object.assign({ type: 'stack', direction: direction || 'column', alignItems: 'start', gap: gap === undefined ? 4 : gap, children: children.filter(Boolean) }, extra || {});
}
function uiUsageDate(timestamp, format, size) {
  const date = uiUsageISO(timestamp);
  return date ? { type: 'date', date, format: format || 'relative', font: { size: size || 11, family: 'Menlo' },
    textColor: UI_USAGE_COLORS.secondary, maxLines: 1, minScale: 0.8 } : null;
}
function uiUsageNormalize(snapshot) {
  const source = snapshot || {};
  const accounts = (Array.isArray(source.accounts) ? source.accounts : []).map((item, index) => {
    const account = item || {};
    const status = ['ready', 'disabled', 'error', 'unknown'].includes(account.status) ? account.status : 'unknown';
    const metrics = (Array.isArray(account.metrics) ? account.metrics : []).filter(item => item && ['percent', 'balance', 'number'].includes(item.kind)).map(item => {
      let remaining = uiUsageNumber(item.remaining);
      // Invalid percentages are unknown, not silently clamped into an apparently valid quota.
      if (item.kind === 'percent' && remaining !== null && (remaining < 0 || remaining > 1)) remaining = null;
      return { label: uiUsageText(item.label, '指标'), kind: item.kind, remaining,
        used: uiUsageNumber(item.used), total: uiUsageNumber(item.total), currency: uiUsageText(item.currency),
        resetAt: uiUsageISO(item.resetAt) ? item.resetAt : null, detail: uiUsageText(item.detail) };
    });
    // Preserve source order among known values, then unknown values: no invented primary metric.
    const ordered = metrics.filter(item => item.remaining !== null).concat(metrics.filter(item => item.remaining === null));
    return { id: uiUsageText(account.id), name: uiUsageText(account.name, `账号 ${index + 1}`),
      email: uiUsageText(account.email), provider: uiUsageText(account.provider), plan: uiUsageText(account.plan), status,
      statusLabel: uiUsageText(account.statusLabel), metrics: ordered, error: uiUsageText(account.error) };
  });
  return { provider: uiUsageText(source.provider), providerTitle: uiUsageText(source.providerTitle), accounts,
    lastUpdated: uiUsageISO(source.lastUpdated) ? source.lastUpdated : null, stale: source.stale === true,
    error: uiUsageText(source.error) };
}
function uiUsagePrivacy(snapshot) {
  // Mask all identities, including short names and identities embedded in API error/detail strings.
  const tokens = [];
  snapshot.accounts.forEach(account => {
    [account.email, account.name, account.id].forEach(value => { if (value && value.length >= 3) tokens.push(value); });
  });
  tokens.sort((a, b) => b.length - a.length);
  function scrub(value) {
    let text = value;
    tokens.forEach(token => { text = text.split(token).join('•••'); });
    return text.replace(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/g, '•••');
  }
  const result = Object.assign({}, snapshot, { error: scrub(snapshot.error), providerTitle: scrub(snapshot.providerTitle) });
  result.accounts = snapshot.accounts.map((account, index) => Object.assign({}, account, {
    id: '', name: `账号 •••${index + 1}`, email: '', plan: scrub(account.plan), provider: scrub(account.provider),
    error: scrub(account.error), statusLabel: scrub(account.statusLabel),
    metrics: account.metrics.map(metric => Object.assign({}, metric, { label: scrub(metric.label), detail: scrub(metric.detail), currency: scrub(metric.currency) })),
  }));
  return result;
}
function uiUsageFormatNumber(number) {
  if (number === null) return '—';
  // Keep raw balance/count semantics. No pseudo percentages or assumed currency conversion.
  const absolute = Math.abs(number);
  if (absolute !== 0 && absolute < 0.001) return number.toExponential(2);
  const places = absolute < 1 ? 4 : 2;
  return String(Number(number.toFixed(places)));
}
function uiUsageValue(metric) {
  if (!metric || metric.remaining === null) return '—';
  if (metric.kind === 'percent') {
    if (metric.remaining > 0 && metric.remaining < 0.001) return '<0.1%';
    if (metric.remaining < 1 && metric.remaining > 0.999) return '>99.9%';
    return `${Number((metric.remaining * 100).toFixed(1))}%`;
  }
  const value = uiUsageFormatNumber(metric.remaining);
  return metric.kind === 'balance' && metric.currency ? `${metric.currency} ${value}` : value;
}
function uiUsageRisk(metric, account) {
  if (account && (account.error || account.status === 'error')) return { text: '账号异常', color: UI_USAGE_COLORS.danger };
  if (!metric || metric.remaining === null) return { text: '未知', color: UI_USAGE_COLORS.neutral };
  if (account && (account.status === 'unknown' || account.status === 'disabled')) return { text: account.status === 'disabled' ? '已禁用' : '状态未知', color: UI_USAGE_COLORS.neutral };
  if (metric.remaining <= 0) return { text: metric.kind === 'balance' && metric.remaining < 0 ? '余额不足' : '已耗尽', color: UI_USAGE_COLORS.danger };
  if (metric.kind === 'percent' && metric.remaining < 0.15) return { text: '即将耗尽', color: UI_USAGE_COLORS.danger };
  if (metric.kind === 'percent' && metric.remaining < 0.4) return { text: '剩余偏低', color: UI_USAGE_COLORS.warning };
  return { text: '剩余', color: metric.kind === 'percent' ? UI_USAGE_COLORS.good : UI_USAGE_COLORS.primary };
}
function uiUsageStatus(account, stale) {
  if (account.status === 'disabled') return { text: '已禁用', color: UI_USAGE_COLORS.neutral };
  if (account.error || account.status === 'error') return { text: account.statusLabel || '账号异常', color: UI_USAGE_COLORS.danger };
  if (account.status === 'unknown') return { text: '状态未知', color: UI_USAGE_COLORS.neutral };
  if (stale) return { text: '缓存', color: UI_USAGE_COLORS.warning };
  return { text: account.statusLabel || '就绪', color: UI_USAGE_COLORS.secondary };
}
function uiUsageIssue(snapshot) {
  const failed = snapshot.accounts.filter(account => account.error || account.status === 'error').length;
  return snapshot.error || failed ? `部分失败${failed ? ` · ${failed} 个账号` : ''}` : '';
}
function uiUsageState(snapshot, options) {
  if (snapshot.accounts.length) return null;
  if (snapshot.error) return { title: options.baseUrl ? '加载失败' : '配置有误', detail: snapshot.error, color: UI_USAGE_COLORS.danger };
  if (!options.baseUrl) return { title: '未配置', detail: '请在模块 Env 填写服务地址与密钥', color: UI_USAGE_COLORS.warning };
  return { title: '暂无账号', detail: '未返回账号，请检查服务账号与权限', color: UI_USAGE_COLORS.neutral };
}
function uiUsageHeader(snapshot, meta, small) {
  const children = [{ type: 'image', src: meta.logo || 'sf-symbol:chart.bar.xaxis', width: small ? 14 : 17, height: small ? 14 : 17, borderRadius: 4 },
    Object.assign(uiUsageTextNode(meta.title, small ? 13 : 15, UI_USAGE_COLORS.primary, 'bold'), { flex: 1 })];
  if (!small) children.push(uiUsageTextNode(`${snapshot.accounts.length} 个账号`, 12, UI_USAGE_COLORS.secondary));
  return uiUsageStack(children, 'row', 5, { alignItems: 'center' });
}
function uiUsageFreshness(snapshot, small) {
  const date = uiUsageDate(snapshot.lastUpdated, 'relative', 11);
  const label = snapshot.stale ? '缓存 · 上次更新' : '更新';
  return uiUsageStack([uiUsageTextNode(date ? label : (snapshot.stale ? '缓存 · 更新时间未知' : '尚未更新'), 11,
    snapshot.stale ? UI_USAGE_COLORS.warning : UI_USAGE_COLORS.secondary), date], 'row', small ? 3 : 5);
}
function uiUsageMetric(metric, account, size, showExtra) {
  const risk = uiUsageRisk(metric, account);
  const children = [uiUsageStack([Object.assign(uiUsageTextNode(metric.label, 12, UI_USAGE_COLORS.secondary, 'medium'), { flex: 1 }),
    uiUsageTextNode(risk.text, 11, risk.color, 'medium')], 'row', 4),
    Object.assign(uiUsageTextNode(uiUsageValue(metric), size, risk.color, 'bold', true), { minScale: 0.55 })];
  if (metric.kind === 'percent' && metric.remaining !== null) {
    const segments = [];
    if (metric.remaining > 0) segments.push(uiUsageStack([], 'row', 0, { flex: metric.remaining, height: 4, backgroundColor: risk.color, borderRadius: 2 }));
    if (metric.remaining < 1) segments.push(uiUsageStack([], 'row', 0, { flex: 1 - metric.remaining, height: 4 }));
    children.push(uiUsageStack(segments, 'row', 0, { height: 4, backgroundColor: { light: '#DDDEE3', dark: '#444449' }, borderRadius: 2 }));
  }
  if (showExtra) {
    if (metric.resetAt !== null) children.push(uiUsageStack([uiUsageTextNode('重置', 11, UI_USAGE_COLORS.secondary), uiUsageDate(metric.resetAt, 'relative', 11)], 'row', 3));
    else if (metric.detail) children.push(uiUsageTextNode(metric.detail, 11, UI_USAGE_COLORS.secondary));
    else if (metric.used !== null || metric.total !== null) {
      const used = metric.used !== null ? `已用 ${uiUsageFormatNumber(metric.used)}` : '';
      const total = metric.total !== null ? `总量 ${uiUsageFormatNumber(metric.total)}` : '';
      children.push(uiUsageTextNode([used, total].filter(Boolean).join(' · '), 11, UI_USAGE_COLORS.secondary, 'regular', true));
    }
  }
  return uiUsageStack(children, 'column', 3, { flex: 1 });
}
function uiUsageCard(account, snapshot, count, small) {
  const status = uiUsageStatus(account, snapshot.stale);
  const metrics = account.metrics.slice(0, count);
  const title = uiUsageTextNode(account.email || account.name, 12, UI_USAGE_COLORS.primary, 'semibold');
  const children = [uiUsageStack([Object.assign(title, { flex: 1 }), uiUsageTextNode(status.text, 11, status.color, 'medium')], 'row', 3)];
  if (metrics.length) children.push(uiUsageStack(metrics.map(metric => uiUsageMetric(metric, account, small ? 25 : count > 1 ? 18 : 23, true)), 'row', 10));
  else children.push(uiUsageTextNode(account.status === 'disabled' ? '已禁用 · 无指标' : '暂无指标 · 未知', 14, UI_USAGE_COLORS.neutral, 'medium'));
  if (account.error && !small) children.push(uiUsageTextNode(account.error, 11, UI_USAGE_COLORS.danger));
  const hidden = account.metrics.length - metrics.length;
  if (hidden > 0) children.push(uiUsageTextNode(`另有 ${hidden} 项指标`, 11, UI_USAGE_COLORS.secondary));
  return uiUsageStack(children, 'column', small ? 4 : 6,
    { padding: small ? 0 : 10, backgroundColor: small ? UI_USAGE_COLORS.background : UI_USAGE_COLORS.card, borderRadius: small ? 0 : 12, borderWidth: small ? 0 : 0.5, borderColor: { light: '#00000012', dark: '#FFFFFF18' }, flex: 1 });
}
function uiUsageLock(snapshot, meta, family, options) {
  const state = uiUsageState(snapshot, options);
  const account = snapshot.accounts[0];
  const metric = account && account.metrics[0];
  const status = account ? uiUsageStatus(account, snapshot.stale) : null;
  const issue = uiUsageIssue(snapshot);
  const risk = metric ? uiUsageRisk(metric, account) : { color: UI_USAGE_COLORS.neutral, text: '未知' };
  const hidden = snapshot.accounts.length > 1 ? ` +${snapshot.accounts.length - 1}账号` : '';
  const hiddenMetrics = account && account.metrics.length > 1 ? ` +${account.metrics.length - 1}项` : '';
  const flags = [snapshot.stale ? '缓存' : '', issue ? '部分失败' : '', status && status.text !== '就绪' && status.text !== '缓存' ? status.text : ''].filter(Boolean).join(' · ');
  const value = metric ? uiUsageValue(metric) : '—';
  if (family === 'accessoryInline') {
    const label = state ? `${meta.title} · ${state.title}` : `${meta.title} ${metric ? metric.label : '无指标'} ${value} ${risk.text}${hidden}${hiddenMetrics}${flags ? ` · ${flags}` : ''}`;
    const children = [uiUsageTextNode(label, 12, state ? state.color : risk.color, 'medium', false)];
    if (snapshot.stale) children.push(uiUsageDate(snapshot.lastUpdated, 'relative', 11) || uiUsageTextNode('更新时间未知', 11, UI_USAGE_COLORS.neutral));
    return uiUsageStack(children, 'row', 3);
  }
  if (family === 'accessoryCircular') {
    const children = [uiUsageTextNode(state ? state.title : (flags || metric && metric.label || meta.title), 10, state ? state.color : UI_USAGE_COLORS.secondary, 'medium'),
      uiUsageTextNode(state ? '—' : value, 18, state ? state.color : risk.color, 'bold', true),
      uiUsageTextNode(state ? '查看配置' : `${risk.text}${hidden}${hiddenMetrics}`, 10, risk.color, 'medium')];
    if (snapshot.stale) children.push(uiUsageDate(snapshot.lastUpdated, 'relative', 10) || uiUsageTextNode('更新时间未知', 10, UI_USAGE_COLORS.neutral));
    return uiUsageStack(children, 'column', 1, { alignItems: 'center' });
  }
  const children = [uiUsageTextNode(state ? `${meta.title} · ${state.title}` : `${account.email || account.name}${hidden} · ${flags || status.text}`, 12, state ? state.color : UI_USAGE_COLORS.primary, 'semibold')];
  if (state) children.push(uiUsageTextNode(state.detail, 11, UI_USAGE_COLORS.secondary, 'regular', false, 2));
  else children.push(uiUsageTextNode(metric ? `${metric.label} ${value} · ${risk.text}${hiddenMetrics}` : '暂无指标 · 未知', 14, risk.color, 'bold', true));
  if (snapshot.stale) children.push(uiUsageFreshness(snapshot, true));
  else if (metric && metric.resetAt !== null) children.push(uiUsageStack([uiUsageTextNode('重置', 11, UI_USAGE_COLORS.secondary), uiUsageDate(metric.resetAt, 'relative', 11)], 'row', 3));
  return uiUsageStack(children, 'column', 2);
}
function renderUsageWidget(ctx, snapshot, meta, options) {
  const family = ctx && UI_USAGE_FAMILIES.includes(ctx.widgetFamily) ? ctx.widgetFamily : 'systemMedium';
  const opts = { maskAccount: !!(options && options.maskAccount === true), baseUrl: uiUsageText(options && options.baseUrl).trim() };
  let data = uiUsageNormalize(snapshot);
  if (opts.maskAccount) data = uiUsagePrivacy(data);
  const provider = { title: uiUsageText(meta && meta.title, data.providerTitle || data.provider || 'AI 用量'),
    logo: meta && typeof meta.logo === 'string' && meta.logo.startsWith('data:') ? meta.logo : null };
  const root = { type: 'widget', children: [], gap: 6, refreshAfter: new Date(Date.now() + 5 * 60000).toISOString() };
  // No credentials in widget URLs; leave configuration/navigation untouched outside the UI.
  if (/^https?:\/\//i.test(opts.baseUrl) && !/^https?:\/\/[^/]*@/i.test(opts.baseUrl)) root.url = opts.baseUrl;
  if (family.startsWith('accessory')) {
    root.padding = family === 'accessoryCircular' ? 2 : 0;
    root.children.push(uiUsageLock(data, provider, family, opts));
    return root;
  }
  const small = family === 'systemSmall';
  const state = uiUsageState(data, opts);
  root.backgroundColor = UI_USAGE_COLORS.background;
  root.padding = small ? 11 : 13;
  root.children.push(uiUsageHeader(data, provider, small));
  if (state) {
    root.children.push(uiUsageTextNode(state.title, small ? 19 : 23, state.color, 'bold'));
    root.children.push(uiUsageTextNode(state.detail, 12, UI_USAGE_COLORS.secondary, 'regular', false, small ? 2 : 3));
  } else {
    const limit = small ? 1 : family === 'systemMedium' ? 2 : family === 'systemLarge' ? 4 : 8;
    const visible = data.accounts.slice(0, limit);
    const cards = visible.map(account => uiUsageCard(account, data, small ? 1 : 2, small));
    if (small) root.children.push(cards[0]);
    else if (family === 'systemMedium') root.children.push(uiUsageStack(cards, 'row', 8, { flex: 1 }));
    else {
      const columns = family === 'systemExtraLarge' ? 4 : 2;
      const rows = [];
      for (let index = 0; index < cards.length; index += columns) rows.push(uiUsageStack(cards.slice(index, index + columns), 'row', 8, { flex: 1 }));
      root.children.push(uiUsageStack(rows, 'column', 8, { flex: 1 }));
    }
    const hiddenAccounts = data.accounts.length - visible.length;
    const issue = uiUsageIssue(data);
    if (hiddenAccounts || issue) root.children.push(uiUsageTextNode([hiddenAccounts ? `另有 ${hiddenAccounts} 个账号` : '', issue].filter(Boolean).join(' · '), 11,
      issue ? UI_USAGE_COLORS.warning : UI_USAGE_COLORS.secondary, 'medium'));
  }
  root.children.push(uiUsageFreshness(data, small));
  return root;
}


const ADAPTERS = {
  cliproxyapi: fetchCLIProxyData,
  codex2api: fetchCodex2APIData,
  axonhub: fetchAxonHubData,
  sub2api: fetchSub2APIData,
  newapi: fetchNewAPIData,
  deepseek: fetchDeepSeekData,
  agy: fetchAgyData,
};

async function syncAIUsage(ctx, config) {
  const key = cacheKey(config);
  try {
    const accounts = await ADAPTERS[config.provider](ctx, config);
    if (!Array.isArray(accounts)) throw new Error("服务返回的账号结构不匹配");
    const snapshot = redactSnapshot({ provider: config.provider, providerTitle: PROVIDER_METAS[config.provider].title, accounts, lastUpdated: Date.now(), error: null, stale: false }, config);
    try { ctx.storage?.setJSON(key, snapshot); } catch (_) { /* 缓存不可用不影响本次真实结果。 */ }
    return snapshot;
  } catch (error) {
    const failure = redactSnapshot({ error: String(error?.message || "读取失败") }, config).error;
    let cached;
    try { cached = ctx.storage?.getJSON(key); } catch (_) { cached = null; }
    // 只使用同配置、六小时内的归一化快照；失败时间不能覆盖最后成功时间。
    const age = Date.now() - (cached?.lastUpdated || 0);
    if (cached?.provider === config.provider && Array.isArray(cached.accounts) && cached.accounts.length && age >= 0 && age <= 6 * 3600000) {
      return { ...cached, stale: true, error: failure };
    }
    return { provider: config.provider, providerTitle: PROVIDER_METAS[config.provider].title, accounts: [], lastUpdated: null, error: failure, stale: false };
  }
}

export default async function(ctx) {
  let config;
  try {
    config = readConfig(ctx);
  } catch (error) {
    const provider = normalizeProvider(envText(ctx.env || {}, "PROVIDER", "provider"));
    return renderUsageWidget(ctx, { accounts: [], lastUpdated: null, error: error.message, stale: false }, PROVIDER_METAS[provider] || { title: "AI Usage" }, { maskAccount: true, baseUrl: "" });
  }
  const snapshot = await syncAIUsage(ctx, config);
  const filtered = { ...snapshot, accounts: filterAccounts(snapshot.accounts, config.filter) };
  if (config.filter && snapshot.accounts.length && !filtered.accounts.length) filtered.error = "没有匹配 FILTER 的账号或模型";
  return renderUsageWidget(ctx, filtered, PROVIDER_METAS[config.provider], { maskAccount: config.maskAccount, baseUrl: config.baseUrl });
}
