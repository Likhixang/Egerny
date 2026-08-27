// ── Codex2API 官方项目高清徽标 ──
const CODEX2API_LOGO = "data:image/png;base64,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";

/*
 * Codex2API Quota 配额监控 — Egern 新式小组件
 * 核心设计系统：
 *   - 官方 OpenAI / Codex 精细品牌矢量徽标
 *   - 纯正 Apple HIG 拟物磨砂玻璃卡片（满宽 100% 呼吸感）
 *   - 大组件 (systemLarge) 智能三阶自适应：
 *       1. 单账号：满宽账号健康标头 + 5h滚动大卡片 + 7d周额度大卡片 + 底部集群状态汇总
 *       2. 双账号：上下两块全高平衡大卡片 + 底部集群状态汇总
 *       3. 多账号：4 账号高密度看板列表 + 底部集群状态汇总
 *   - 适配主屏全部尺寸 (systemSmall, systemMedium, systemLarge)
 */

// ── 官方精细矢量徽标 (Lobe Icons 官方 SVG 提取) ──
const BRAND_ICONS = {
  openai: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M9.205%208.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357%201.356-.523%202.117-.523%202.854%200%204.662%202.212%204.662%204.566%200%20.167%200%20.357-.024.547l-4.71-2.759a.797.797%200%2000-.856%200l-5.97%203.473zm10.609%208.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473%201.95-1.118a.433.433%200%2001.476%200l4.543%202.617c1.309.76%202.189%202.378%202.189%203.948%200%201.808-1.07%203.473-2.76%204.163zM7.802%2012.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545%201.95-4.472%204.591-4.472%201%200%201.927.333%202.712.928L8.23%205.067c-.285.166-.428.404-.428.737v6.898zM12%2015.128l-2.795-1.57v-3.33L12%208.658l2.795%201.57v3.33L12%2015.128zm1.796%207.23c-1%200-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974%201.142c.167.095.238.238.238.428v5.233c0%202.545-1.974%204.472-4.614%204.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482%204.482%200%20014.21%206.327v5.423c0%20.333.143.571.428.738l5.947%203.449-1.95%201.118a.432.432%200%2001-.476%200zm-.262%203.9c-2.688%200-4.662-2.021-4.662-4.519%200-.19.024-.38.047-.57l4.686%202.71c.286.167.571.167.856%200l5.97-3.448v2.26c0%20.19-.07.333-.237.428l-4.543%202.616c-.619.357-1.356.523-2.117.523zm5.899%202.83a5.947%205.947%200%20005.827-4.756C22.287%2018.339%2024%2015.84%2024%2013.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498%200-3.401-2.759-5.947-5.946-5.947-.642%200-1.26.095-1.88.31A5.962%205.962%200%200010.205%200a5.947%205.947%200%2000-5.827%204.757C1.713%205.447%200%207.945%200%2010.49c0%201.666.713%203.283%201.998%204.448-.119.5-.19%201-.19%201.499%200%203.401%202.759%205.946%205.946%205.946.642%200%201.26-.095%201.88-.309a5.96%205.96%200%20004.162%201.713z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
};

function formatTimeOnly(ts) {
  if (!ts || isNaN(ts)) return "--:--";
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${min}`;
}

function formatShortDate(ts) {
  if (!ts || isNaN(ts)) return "--/--";
  const d = new Date(ts);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const h = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
}

function formatSmallResetLabel(ts, isWeekly) {
  if (!ts || isNaN(ts)) return "--:--";
  const d = new Date(ts);
  if (isWeekly) {
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${m}-${day}`;
  }
  const h = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${min}`;
}

function formatCountdown(resetAtMs, fallbackRemaining = 1.0) {
  if (!resetAtMs || isNaN(resetAtMs)) {
    return fallbackRemaining >= 0.99 ? "配额充沛" : "恢复中";
  }
  const diffMs = resetAtMs - Date.now();
  if (diffMs <= 0) return "已重置";
  const totalMins = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;

  if (days > 0) {
    return `${days}天 ${hours > 0 ? `${hours}h ` : ""}${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getQuotaColor(fraction) {
  if (fraction >= 0.45) return "#34C759"; // 绿色
  if (fraction >= 0.15) return "#FF9500"; // 橙色
  return "#FF3B30"; // 红色
}

function maskEmail(str, enabled) {
  if (!enabled || !str) return str;
  if (!str.includes("@")) {
    if (str.length <= 4) return str;
    return `${str.slice(0, 2)}***${str.slice(-2)}`;
  }
  const atIdx = str.indexOf("@");
  const name = str.slice(0, atIdx);
  const domain = str.slice(atIdx);
  if (name.length <= 1) {
    return `${name}***${domain}`;
  } else if (name.length <= 3) {
    return `${name[0]}***${domain}`;
  } else if (name.length <= 6) {
    return `${name.slice(0, 1)}***${name.slice(-1)}${domain}`;
  } else {
    return `${name.slice(0, 2)}***${name.slice(-2)}${domain}`;
  }
}

function getHeaderBadge(accounts) {
  if (!accounts || accounts.length === 0) {
    return { text: "CODEX2API", svg: BRAND_ICONS.codex2api, bg: "#10A37F" };
  }
  if (accounts.length === 1) {
    return getAccountBadge(accounts[0]);
  }
  return {
    text: `CODEX2API · ${accounts.length} 账号`,
    svg: BRAND_ICONS.codex2api,
    bg: "#10A37F",
  };
}

function getAccountBadge(acc) {
  const p = (acc?.planType || acc?.plan || acc?.provider || "").toLowerCase();
  const n = (acc?.name || "").toLowerCase();

  if (n.includes("grok") || p.includes("grok")) {
    return {
      text: "GROK",
      svg: BRAND_ICONS.grok,
      bg: "#151515",
    };
  }
  if (n.includes("claude") || p.includes("claude")) {
    return {
      text: "CLAUDE",
      svg: BRAND_ICONS.claude,
      bg: "#D97706",
    };
  }
  if (p.includes("team")) {
    return {
      text: "TEAM",
      svg: BRAND_ICONS.openai,
      bg: "#AF52DE",
    };
  }
  if (p.includes("plus")) {
    return {
      text: "PLUS",
      svg: BRAND_ICONS.openai,
      bg: "#10A37F",
    };
  }
  if (p.includes("enterprise") || p.includes("ent")) {
    return {
      text: "ENTERPRISE",
      svg: BRAND_ICONS.openai,
      bg: "#5856D6",
    };
  }
  return {
    text: "PRO",
    svg: BRAND_ICONS.openai,
    bg: "#10A37F",
  };
}

function createProgressBarSvg(fraction, color, height = 6) {
  const percent = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${height}' preserveAspectRatio='none'>
    <rect x='0' y='0' width='100' height='${height}' rx='${height / 2}' fill='rgba(120,120,128,0.18)'/>
    <rect x='0' y='0' width='${percent}' height='${height}' rx='${height / 2}' fill='${color}'/>
  </svg>`.replace(/\s+/g, " ");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function parseAccountItem(acc) {
  const name = acc.name || `account-${acc.id}`;
  const email = acc.email || "";
  const planType = (acc.plan_type || acc.plan || "pro").toLowerCase();
  const status = acc.status || "ready";
  const healthTier = acc.health_tier || "healthy";

  // 5h Window
  const has5h = acc.usage_percent_5h !== undefined && acc.usage_percent_5h !== null && !isNaN(Number(acc.usage_percent_5h));
  const usage5h = has5h ? Number(acc.usage_percent_5h) : 0;
  const remainingFraction5h = has5h ? Math.max(0, Math.min(1, (100 - usage5h) / 100)) : 1.0;
  const reset5hAtMs = acc.reset_5h_at ? new Date(acc.reset_5h_at).getTime() : null;
  const reset5hTimeStr = reset5hAtMs ? formatTimeOnly(reset5hAtMs) : "--:--";
  const reset5hCountdownStr = formatCountdown(reset5hAtMs, remainingFraction5h);
  const billed5h = typeof acc.billed_5h === "number" ? acc.billed_5h : null;

  // 7d Window (周额度)
  const has7d = acc.usage_percent_7d !== undefined && acc.usage_percent_7d !== null && !isNaN(Number(acc.usage_percent_7d));
  const usage7d = has7d ? Number(acc.usage_percent_7d) : 0;
  const remainingFraction7d = has7d ? Math.max(0, Math.min(1, (100 - usage7d) / 100)) : 1.0;
  const reset7dAtMs = acc.reset_7d_at ? new Date(acc.reset_7d_at).getTime() : null;
  const reset7dTimeStr = reset7dAtMs ? formatShortDate(reset7dAtMs) : "--/--";
  const reset7dCountdownStr = formatCountdown(reset7dAtMs, remainingFraction7d);
  const billed7d = typeof acc.billed_7d === "number" ? acc.billed_7d : null;

  // 智能额度语义判定 (基于订阅方案及窗口组合精准判定)
  const isPro = planType.includes("pro") && !planType.includes("plus");
  const isFree = planType.includes("free") || planType.includes("guest");

  let fullQuotaWindow = "7d";
  let fullQuotaLabel = "7D";
  let fullFraction = remainingFraction7d;
  let fullUsedPercent = usage7d;
  let fullResetAtMs = reset7dAtMs;
  let fullResetTimeStr = reset7dTimeStr;
  let fullResetCountdownStr = reset7dCountdownStr;

  let secondaryLabel = "5H";
  let isSecondarySpark = false;

  // Small 小组件专属推荐展示
  let smallLabel = "7D";
  let smallFraction = fullFraction;
  let smallUsedPercent = fullUsedPercent;
  let smallResetAtMs = fullResetAtMs;
  let smallResetCountdownStr = fullResetCountdownStr;
  let smallIsWeekly = true;

  if (isFree) {
    fullQuotaWindow = "30d";
    fullQuotaLabel = "30D";
    fullFraction = has7d ? remainingFraction7d : remainingFraction5h;
    fullUsedPercent = has7d ? usage7d : usage5h;
    fullResetAtMs = has7d ? reset7dAtMs : reset5hAtMs;
    fullResetTimeStr = has7d ? reset7dTimeStr : reset5hTimeStr;
    fullResetCountdownStr = has7d ? reset7dCountdownStr : reset5hCountdownStr;
    secondaryLabel = "5H";

    smallLabel = has5h ? "5H" : "30D";
    smallFraction = has5h ? remainingFraction5h : fullFraction;
    smallUsedPercent = has5h ? usage5h : fullUsedPercent;
    smallResetAtMs = has5h ? reset5hAtMs : fullResetAtMs;
    smallResetCountdownStr = has5h ? reset5hCountdownStr : fullResetCountdownStr;
    smallIsWeekly = !has5h;
  } else if (isPro) {
    fullQuotaWindow = "7d";
    fullQuotaLabel = "7D";
    fullFraction = has7d ? remainingFraction7d : (usage7d !== null ? remainingFraction7d : 1.0);
    fullUsedPercent = has7d ? usage7d : 0;
    fullResetAtMs = reset7dAtMs;
    fullResetTimeStr = reset7dTimeStr;
    fullResetCountdownStr = reset7dCountdownStr;
    secondaryLabel = "Spark 5H";
    isSecondarySpark = true;

    smallLabel = "7D";
    smallFraction = fullFraction;
    smallUsedPercent = fullUsedPercent;
    smallResetAtMs = fullResetAtMs;
    smallResetCountdownStr = fullResetCountdownStr;
    smallIsWeekly = true;
  } else if (has7d && has5h) {
    fullQuotaWindow = "7d";
    fullQuotaLabel = "7D";
    fullFraction = remainingFraction7d;
    fullUsedPercent = usage7d;
    fullResetAtMs = reset7dAtMs;
    fullResetTimeStr = reset7dTimeStr;
    fullResetCountdownStr = reset7dCountdownStr;
    secondaryLabel = "5H";

    // 非 Pro 账号 (Plus/Team等) 在 Small 小组件展示 5H
    smallLabel = "5H";
    smallFraction = remainingFraction5h;
    smallUsedPercent = usage5h;
    smallResetAtMs = reset5hAtMs;
    smallResetCountdownStr = reset5hCountdownStr;
    smallIsWeekly = false;
  } else if (has7d) {
    fullQuotaWindow = "7d";
    fullQuotaLabel = "7D";
    fullFraction = remainingFraction7d;
    fullUsedPercent = usage7d;
    fullResetAtMs = reset7dAtMs;
    fullResetTimeStr = reset7dTimeStr;
    fullResetCountdownStr = reset7dCountdownStr;
    secondaryLabel = "5H";

    smallLabel = "7D";
    smallFraction = fullFraction;
    smallUsedPercent = fullUsedPercent;
    smallResetAtMs = fullResetAtMs;
    smallResetCountdownStr = fullResetCountdownStr;
    smallIsWeekly = true;
  } else {
    fullQuotaWindow = "5h";
    fullQuotaLabel = "5H";
    fullFraction = remainingFraction5h;
    fullUsedPercent = usage5h;
    fullResetAtMs = reset5hAtMs;
    fullResetTimeStr = reset5hTimeStr;
    fullResetCountdownStr = reset5hCountdownStr;
    secondaryLabel = "5H";

    smallLabel = "5H";
    smallFraction = fullFraction;
    smallUsedPercent = fullUsedPercent;
    smallResetAtMs = fullResetAtMs;
    smallResetCountdownStr = fullResetCountdownStr;
    smallIsWeekly = false;
  }

  const primaryRemainingFraction = fullFraction;
  const primaryResetAtMs = fullResetAtMs;
  const primaryResetTimeStr = fullResetTimeStr;
  const primaryResetCountdownStr = fullResetCountdownStr;
  const statusColor = getQuotaColor(primaryRemainingFraction);

  return {
    id: acc.id,
    name,
    email,
    planType,
    status,
    healthTier,
    has5h,
    usagePercent5h: usage5h,
    remainingFraction5h,
    reset5hAtMs,
    reset5hTimeStr,
    reset5hCountdownStr,
    billed5h,
    has7d,
    usagePercent7d: usage7d,
    remainingFraction7d,
    reset7dAtMs,
    reset7dTimeStr,
    reset7dCountdownStr,
    billed7d,
    primaryWindow: fullQuotaWindow,
    primaryWindowLabel: fullQuotaLabel,
    fullQuotaWindow,
    fullQuotaLabel,
    fullFraction,
    fullUsedPercent,
    fullResetAtMs,
    fullResetTimeStr,
    fullResetCountdownStr,
    secondaryLabel,
    isSecondarySpark,
    smallLabel,
    smallFraction,
    smallUsedPercent,
    smallResetAtMs,
    smallResetCountdownStr,
    smallIsWeekly,
    primaryRemainingFraction,
    primaryResetAtMs,
    primaryResetTimeStr,
    primaryResetCountdownStr,
    statusColor,
    activeRequests: Number(acc.active_requests) || 0,
    totalRequests: Number(acc.total_requests) || 0,
    successRequests: Number(acc.success_requests) || 0,
    errorRequests: Number(acc.error_requests) || 0,
    creditEnabled: Boolean(acc.credit_enabled),
    schedulerScore: Number(acc.scheduler_score) || 0,
    dispatchScore: Number(acc.dispatch_score) || 0,
  };
}

async function fetchWithTimeout(ctx, url, options = {}, timeoutMs = 4500) {
  try {
    return await ctx.http.get(url, { ...options, timeout: timeoutMs });
  } catch (e) {
    return null;
  }
}

async function syncCodexQuotaData(ctx) {
  const envUrl = ctx.env?.SERVER_URL || ctx.env?.ServerURL || ctx.env?.server_url || "";
  const adminKey = ctx.env?.ADMIN_KEY || ctx.env?.AdminKey || ctx.env?.admin_key || ctx.env?.MANAGEMENT_KEY || "";
  const rawUrl = envUrl || ctx.storage.get("codex2api_url") || "http://127.0.0.1:8080";
  const baseUrl = rawUrl.trim().replace(/\/+$/, "");

  if (!baseUrl) {
    return {
      accounts: [],
      lastUpdated: Date.now(),
      error: "未配置 SERVER_URL",
    };
  }

  const headers = { "Content-Type": "application/json" };
  if (adminKey.trim()) {
    headers["X-Admin-Key"] = adminKey.trim();
    headers["Authorization"] = `Bearer ${adminKey.trim()}`;
  }

  try {
    let accRes = null;
    let fetchError = null;

    const accFetch = await fetchWithTimeout(ctx, `${baseUrl}/api/admin/accounts`, { headers }, 5000);
    if (accFetch && accFetch.status === 200) {
      accRes = await accFetch.json().catch(() => null);
    } else if (accFetch) {
      fetchError = accFetch.status === 401 ? "401 密钥错误" : `HTTP ${accFetch.status}`;
    } else {
      fetchError = "连接超时/无法访问";
    }

    let statsRes = null;
    const statsFetch = await fetchWithTimeout(ctx, `${baseUrl}/api/admin/stats`, { headers }, 4000);
    if (statsFetch && statsFetch.status === 200) {
      statsRes = await statsFetch.json().catch(() => null);
    }

    let usageRes = null;
    const usageFetch = await fetchWithTimeout(ctx, `${baseUrl}/api/admin/usage/stats`, { headers }, 4000);
    if (usageFetch && usageFetch.status === 200) {
      usageRes = await usageFetch.json().catch(() => null);
    }

    let rawAccounts = [];
    if (Array.isArray(accRes)) {
      rawAccounts = accRes;
    } else if (accRes && Array.isArray(accRes.accounts)) {
      rawAccounts = accRes.accounts;
    } else if (accRes && Array.isArray(accRes.data)) {
      rawAccounts = accRes.data;
    }

    const parsedAccounts = rawAccounts.map(parseAccountItem);
    const availableCount = parsedAccounts.filter(
      (a) => a.healthTier !== "banned" && a.status !== "error" && a.status !== "disabled"
    ).length;

    const totalCount = statsRes?.total && statsRes.total > 0 ? statsRes.total : parsedAccounts.length;
    const availableFinal = statsRes?.available && statsRes.available > 0 ? statsRes.available : availableCount;
    const errorFinal = statsRes?.error !== undefined ? statsRes.error : Math.max(0, totalCount - availableFinal);

    const stats = {
      totalAccounts: totalCount,
      availableAccounts: availableFinal,
      errorAccounts: errorFinal,
      todayRequests: statsRes?.today_requests ?? usageRes?.today_requests ?? 0,
      totalRequests: usageRes?.total_requests ?? 0,
      totalTokens: usageRes?.total_tokens ?? 0,
      todayTokens: usageRes?.today_tokens ?? 0,
      rpm: usageRes?.rpm ?? 0,
      tpm: usageRes?.tpm ?? 0,
      errorRate: usageRes?.error_rate ?? 0,
    };

    if (!fetchError && parsedAccounts.length === 0 && (!accRes || rawAccounts.length === 0)) {
      fetchError = "未获取到账号 (0 个)";
    }

    const snapshot = {
      accounts: parsedAccounts,
      stats,
      lastUpdated: Date.now(),
      error: fetchError,
    };

    ctx.storage.setJSON("codex2api_quota_snapshot", snapshot);
    return snapshot;
  } catch (err) {
    const prev = ctx.storage.getJSON("codex2api_quota_snapshot");
    const snapshot = {
      accounts: prev?.accounts || [],
      stats: prev?.stats,
      lastUpdated: Date.now(),
      error: err?.message || "刷新失败",
    };
    ctx.storage.setJSON("codex2api_quota_snapshot", snapshot);
    return snapshot;
  }
}

function getDemoAccounts() {
  const now = Date.now();
  return [
    parseAccountItem({
      id: 1,
      name: "codex-pro",
      email: "pro-dev@openai.com",
      plan_type: "pro",
      status: "ready",
      health_tier: "healthy",
      usage_percent_5h: 5.0,
      reset_5h_at: new Date(now + 4.1 * 3600 * 1000).toISOString(),
      usage_percent_7d: 18.0,
      reset_7d_at: new Date(now + 2.4 * 86400 * 1000).toISOString(),
      dispatch_score: 99,
    }),
    parseAccountItem({
      id: 2,
      name: "codex-plus",
      email: "plus-user@openai.com",
      plan_type: "plus",
      status: "ready",
      health_tier: "healthy",
      usage_percent_5h: 35.0,
      reset_5h_at: new Date(now + 3.2 * 3600 * 1000).toISOString(),
      usage_percent_7d: 55.0,
      reset_7d_at: new Date(now + 4.1 * 86400 * 1000).toISOString(),
      dispatch_score: 95,
    }),
  ];
}

function filterAccounts(accounts, param) {
  if (!param || !param.trim() || accounts.length === 0) return accounts;
  const p = param.trim().toLowerCase();
  const num = parseInt(p, 10);
  if (!isNaN(num) && num >= 1 && num <= accounts.length) {
    return [accounts[num - 1]];
  }
  const matched = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(p) ||
      a.email.toLowerCase().includes(p) ||
      a.planType.toLowerCase().includes(p) ||
      a.primaryWindow.toLowerCase().includes(p)
  );
  return matched.length > 0 ? matched : accounts;
}

export default async function(ctx) {
  const family = ctx.widgetFamily || "systemMedium";
  const maskEmailEnabled = (ctx.env?.MASK_EMAIL || ctx.env?.MaskEmail || ctx.env?.mask_email || "false").toLowerCase() === "true";
  const filterParam = ctx.env?.FILTER || ctx.env?.Filter || ctx.env?.filter || "";

  let snapshot = await syncCodexQuotaData(ctx);
  if (!snapshot || (snapshot.error && (!snapshot.accounts || snapshot.accounts.length === 0))) {
    snapshot = ctx.storage.getJSON("codex2api_quota_snapshot") || snapshot;
  }

  const lastUpdated = snapshot?.lastUpdated || Date.now();
  const updateTimeStr = formatTimeOnly(lastUpdated);
  const updateDateStr = formatShortDate(lastUpdated);

  // 错误状态呈现
  if (snapshot?.error && (!snapshot.accounts || snapshot.accounts.length === 0)) {
    return renderErrorWidget(family, snapshot.error, updateTimeStr);
  }

  let accounts = snapshot?.accounts && snapshot.accounts.length > 0 ? snapshot.accounts : getDemoAccounts();
  if (filterParam) {
    accounts = filterAccounts(accounts, filterParam);
  }

  if (family === "systemSmall") {
    return renderSmallWidget(accounts[0], updateTimeStr);
  } else if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderLargeWidget(accounts, snapshot?.stats, updateDateStr, maskEmailEnabled);
  } else {
    return renderMediumWidget(accounts, updateDateStr, maskEmailEnabled);
  }
}

// ── 设计系统色彩规范 (纯白 #FFFFFF & 纯黑 #151515) ──
const C = {
  textPrimary: { light: "#151515", dark: "#FFFFFF" },
  textSecondary: { light: "#6E6E73", dark: "#98989D" },
  textTertiary: { light: "#8E8E93", dark: "#636366" },

  widgetBg: { light: "#FFFFFF", dark: "#151515" },
  cardBg: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
  cardBorder: { light: "rgba(0, 0, 0, 0.06)", dark: "rgba(255, 255, 255, 0.08)" },
};

// ── HIG 拟物卡片式布局 ──

function createMicroBadge(badge) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 5],
    backgroundColor: badge.bg,
    borderRadius: 5,
    children: [
      { type: "image", src: badge.svg, width: 9, height: 9 },
      { type: "text", text: badge.text, font: { size: 8.5, weight: "heavy" }, textColor: "#FFFFFF" },
    ],
  };
}

function renderSmallWidget(account, updateTime) {
  // 小尺寸小组件：Pro 账号展示周全额度；非 Pro 账号展示 5小时滚动短期额度
  const fraction = account.smallFraction !== undefined ? account.smallFraction : account.primaryRemainingFraction;
  const usedPercent = account.smallUsedPercent !== null && account.smallUsedPercent !== undefined ? Math.round(account.smallUsedPercent) : Math.round((1 - fraction) * 100);
  const remainPercent = Math.round(fraction * 100);
  const statusColor = getQuotaColor(fraction);
  const resetAtMs = account.smallResetAtMs !== undefined ? account.smallResetAtMs : account.primaryResetAtMs;
  const resetCountdownStr = account.smallResetCountdownStr || account.primaryResetCountdownStr;
  const accBadge = getAccountBadge(account);
  const progressSvg = createProgressBarSvg(fraction, statusColor, 6);
  const accountLabel = maskEmail(account.email || account.name, true);
  const windowTag = account.smallLabel || account.primaryWindowLabel;

  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 12,
    gap: 8,
    children: [
      // 顶部 Header (Codex2API 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: CODEX2API_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "text", text: "Codex2API", font: { size: "caption1", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10, weight: "medium" }, textColor: C.textSecondary },
        ],
      },
      // 核心卡片容器
      {
        type: "stack",
        direction: "column",
        gap: 6,
        padding: 10,
        backgroundColor: C.cardBg,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        borderRadius: 13,
        flex: 1,
        children: [
          // 账号前微型徽标色条 + 全额度标识
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 4,
            children: [
              createMicroBadge(accBadge),
              { type: "text", text: accountLabel, font: { size: 11, weight: "bold" }, maxLines: 1 },
            ],
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              {
                type: "stack",
                direction: "row",
                gap: 3,
                alignItems: "center",
                children: [
                  { type: "text", text: "已用", font: { size: 10 }, textColor: C.textSecondary },
                  { type: "text", text: `${usedPercent}%`, font: { size: 15, weight: "heavy" }, textColor: C.textPrimary },
                ],
              },
              { type: "spacer" },
              {
                type: "stack",
                direction: "row",
                gap: 3,
                alignItems: "center",
                children: [
                  { type: "text", text: windowTag, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
                  { type: "text", text: `${remainPercent}%`, font: { size: 16, weight: "heavy" }, textColor: statusColor },
                ],
              },
            ],
          },
          { type: "image", src: progressSvg, height: 5.5 },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "text", text: `重置 ${formatSmallResetLabel(resetAtMs, Boolean(account.smallIsWeekly))}`, font: { size: 9 }, textColor: C.textSecondary },
              { type: "spacer" },
              { type: "text", text: resetCountdownStr, font: { size: 9.5, weight: "bold" }, textColor: statusColor },
            ],
          },
        ],
      },
    ],
  };
}

function renderMediumWidget(accounts, updateStr, maskEmailEnabled) {
  const isSingle = accounts.length === 1;
  const first = accounts[0];

  if (isSingle && first) {
    // 单账号场景：只要有 7d 或者 Pro/Plus 方案，默认始终呈现「双配额」完整看板
    const isDual = (first.has5h && first.has7d) || first.has7d || first.isSecondarySpark || first.planType.includes("pro") || first.planType.includes("plus");
    const accBadge = getAccountBadge(first);
    const used5h = first.usagePercent5h !== null ? Math.round(first.usagePercent5h) : Math.round((1 - first.remainingFraction5h) * 100);
    const remain5h = Math.round(first.remainingFraction5h * 100);
    const used7d = first.usagePercent7d !== null ? Math.round(first.usagePercent7d) : Math.round((1 - first.remainingFraction7d) * 100);
    const remain7d = Math.round(first.remainingFraction7d * 100);
    const accountLabel = maskEmail(first.email || first.name, maskEmailEnabled);

    if (isDual) {
      // 单账号双配额专属卡片：唯一母卡片包含账号标头，内部包含 7D 和 Spark 5H 两个完整独立三行进度块
      return {
        type: "widget",
        backgroundColor: C.widgetBg,
        padding: [12, 14, 12, 14],
        gap: 8,
        children: [
          // 顶部 Header (Codex2API 官方 Logo)
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 6,
            children: [
              { type: "image", src: CODEX2API_LOGO, width: 15, height: 15, borderRadius: 3.5 },
              { type: "text", text: "Codex2API 配额", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
              {
                type: "stack",
                padding: [2, 5],
                borderRadius: 4,
                backgroundColor: C.cardBg,
                children: [
                  { type: "text", text: `${accounts.length} 账号`, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
                ],
              },
              { type: "spacer" },
              { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: C.textSecondary },
            ],
          },
          // 单一核心母卡片（只出现一次账号身份，彻底消除双账号误解）
          {
            type: "stack",
            direction: "column",
            gap: 7,
            padding: [10, 12, 10, 12],
            backgroundColor: C.cardBg,
            borderWidth: 0.5,
            borderColor: C.cardBorder,
            borderRadius: 13,
            flex: 1,
            children: [
              // 1. 唯一账号身份标头
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                children: [
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    gap: 5,
                    children: [
                      createMicroBadge(accBadge),
                      { type: "text", text: accountLabel, font: { size: 11.5, weight: "bold" }, maxLines: 1 },
                    ],
                  },
                  { type: "spacer" },
                  { type: "text", text: `评分 ${first.dispatchScore}`, font: { size: 10 }, textColor: C.textSecondary },
                ],
              },
              // 2. 7D 独立配额块 (行1: 标签+余量 / 行2: 满宽进度条 / 行3: 重置时间+倒计时)
              {
                type: "stack",
                direction: "column",
                gap: 2.5,
                children: [
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    children: [
                      { type: "text", text: first.fullQuotaLabel, font: { size: 10.5, weight: "bold" }, textColor: C.textPrimary },
                      { type: "spacer" },
                      { type: "text", text: `余 ${remain7d}%`, font: { size: 10.5, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction7d) },
                    ],
                  },
                  { type: "image", src: createProgressBarSvg(first.remainingFraction7d, getQuotaColor(first.remainingFraction7d), 4.5), height: 4.5 },
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    children: [
                      { type: "text", text: `重置 ${first.reset7dTimeStr}`, font: { size: 9 }, textColor: C.textSecondary },
                      { type: "spacer" },
                      { type: "text", text: first.reset7dCountdownStr, font: { size: 9, weight: "semibold" }, textColor: getQuotaColor(first.remainingFraction7d) },
                    ],
                  },
                ],
              },
              // 3. Spark 5H / 5H 独立配额块 (行1: 标签+余量 / 行2: 满宽进度条 / 行3: 重置时间+倒计时)
              {
                type: "stack",
                direction: "column",
                gap: 2.5,
                children: [
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    children: [
                      { type: "text", text: first.secondaryLabel, font: { size: 10.5, weight: "bold" }, textColor: C.textPrimary },
                      { type: "spacer" },
                      { type: "text", text: `余 ${remain5h}%`, font: { size: 10.5, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction5h) },
                    ],
                  },
                  { type: "image", src: createProgressBarSvg(first.remainingFraction5h, getQuotaColor(first.remainingFraction5h), 4.5), height: 4.5 },
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    children: [
                      { type: "text", text: `重置 ${first.reset5hTimeStr}`, font: { size: 9 }, textColor: C.textSecondary },
                      { type: "spacer" },
                      { type: "text", text: first.reset5hCountdownStr, font: { size: 9, weight: "semibold" }, textColor: getQuotaColor(first.remainingFraction5h) },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    // 单主力窗口模式
    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [12, 14, 12, 14],
      gap: 8,
      children: [
        // 顶部 Header (Codex2API 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CODEX2API_LOGO, width: 15, height: 15, borderRadius: 3.5 },
            { type: "text", text: "Codex2API 配额", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${accounts.length} 账号`, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        // 核心卡片容器
        {
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [9, 12, 9, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 13,
          flex: 1,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              gap: 5,
              children: [
                createMicroBadge(accBadge),
                { type: "text", text: accountLabel, font: { size: 12, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                { type: "text", text: `状态: ${first.healthTier}`, font: { size: 10 }, textColor: C.textSecondary },
              ],
            },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "text", text: "已用", font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: `${first.primaryWindow === "7d" ? used7d : used5h}%`, font: { size: 15, weight: "heavy" }, textColor: C.textPrimary },
                  ],
                },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "text", text: `${first.primaryWindowLabel} 剩余`, font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: `${first.primaryWindow === "7d" ? remain7d : remain5h}%`, font: { size: 17, weight: "heavy" }, textColor: first.statusColor },
                  ],
                },
              ],
            },
            { type: "image", src: createProgressBarSvg(first.primaryRemainingFraction, first.statusColor, 6), height: 6 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${first.primaryResetTimeStr}`, font: { size: 10 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: `恢复倒计时 ${first.primaryResetCountdownStr}`, font: { size: 10, weight: "bold" }, textColor: first.statusColor },
              ],
            },
          ],
        },
      ],
    };
  }

  // 双账号等高卡片排版
  const topTwo = accounts.slice(0, 2);
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [12, 14, 12, 14],
    gap: 7,
    children: [
      // 顶部 Header (Codex2API 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: CODEX2API_LOGO, width: 15, height: 15, borderRadius: 3.5 },
          { type: "text", text: "Codex2API 配额", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: `${accounts.length} 账号`, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: C.textSecondary },
        ],
      },
      ...topTwo.map((acc) => {
        const accBadge = getAccountBadge(acc);
        const fraction = acc.smallFraction !== undefined ? acc.smallFraction : acc.primaryRemainingFraction;
        const remainPercent = Math.round(fraction * 100);
        const accountLabel = maskEmail(acc.email || acc.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(fraction, acc.statusColor, 5);
        const label = acc.smallLabel || acc.primaryWindowLabel;

        return {
          type: "stack",
          direction: "column",
          gap: 3,
          padding: [7, 10, 7, 10],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 11,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                {
                  type: "stack",
                  direction: "row",
                  alignItems: "center",
                  gap: 5,
                  children: [
                    createMicroBadge(accBadge),
                    { type: "text", text: accountLabel, font: { size: 11, weight: "bold" }, maxLines: 1 },
                  ],
                },
                { type: "spacer" },
                {
                  type: "text",
                  text: `${label} ${remainPercent}%`,
                  font: { size: 11, weight: "heavy" },
                  textColor: getQuotaColor(fraction),
                },
              ],
            },
            { type: "image", src: progressSvg, height: 5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${formatSmallResetLabel(acc.smallResetAtMs || acc.primaryResetAtMs, Boolean(acc.smallIsWeekly))}`, font: { size: 9 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: acc.smallResetCountdownStr || acc.primaryResetCountdownStr, font: { size: 9, weight: "semibold" }, textColor: getQuotaColor(fraction) },
              ],
            },
          ],
        };
      }),
    ],
  };
}

// ── 大尺寸小组件 (systemLarge) 三阶排版 ──
function renderLargeWidget(accounts, stats, updateStr, maskEmailEnabled) {
  const isSingle = accounts.length === 1;
  const isDual = accounts.length === 2;
  const first = accounts[0];

  // 1. 单账号专属旗舰看板（满宽账号标头 + 5h大卡片 + 7d大卡片 + 底部集群状态汇总）
  if (isSingle) {
    const accBadge = getAccountBadge(first);
    const used5h = first.usagePercent5h !== null ? Math.round(first.usagePercent5h) : Math.round((1 - first.remainingFraction5h) * 100);
    const remain5h = Math.round(first.remainingFraction5h * 100);
    const used7d = first.usagePercent7d !== null ? Math.round(first.usagePercent7d) : Math.round((1 - first.remainingFraction7d) * 100);
    const remain7d = Math.round(first.remainingFraction7d * 100);
    const accountLabel = maskEmail(first.email || first.name, maskEmailEnabled);

    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [14, 16, 14, 16],
      gap: 10,
      children: [
        // 顶栏 (Codex2API 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CODEX2API_LOGO, width: 16, height: 16, borderRadius: 4 },
            { type: "text", text: "Codex2API 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${accounts.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        // 账号标头卡片（横向 100% 满宽布局）
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          padding: [9, 12, 9, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "column",
              gap: 3,
              flex: 1,
              children: [
                {
                  type: "stack",
                  direction: "row",
                  alignItems: "center",
                  gap: 6,
                  children: [
                    createMicroBadge(accBadge),
                    { type: "text", text: accountLabel, font: { size: 15, weight: "heavy" }, maxLines: 1 },
                  ],
                },
                {
                  type: "stack",
                  direction: "row",
                  gap: 8,
                  children: [
                    { type: "text", text: `调度评分: ${first.dispatchScore}`, font: { size: 10 }, textColor: C.textSecondary },
                    { type: "text", text: `状态: ${first.healthTier}`, font: { size: 10 }, textColor: C.textSecondary },
                    { type: "text", text: `成功请求: ${first.successRequests}`, font: { size: 10 }, textColor: C.textSecondary },
                  ],
                },
              ],
            },
          ],
        },
        // 1. 全额度卡片 (周全额度 / 月全额度)
        {
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [10, 12, 10, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: first.fullQuotaLabel, font: { size: 12, weight: "bold" } },
                { type: "spacer" },
                { type: "text", text: `剩余 ${remain7d}%`, font: { size: 13, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction7d) },
              ],
            },
            { type: "image", src: createProgressBarSvg(first.remainingFraction7d, getQuotaColor(first.remainingFraction7d), 6.5), height: 6.5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `已使用 ${used7d}% · 重置 ${first.reset7dTimeStr}`, font: { size: 10 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: first.reset7dCountdownStr, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction7d) },
              ],
            },
          ],
        },
        // 2. 次级额度卡片 (Pro账号显示Spark 5小时，其他账号显示5小时滚动额度)
        {
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [10, 12, 10, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: first.secondaryLabel, font: { size: 12, weight: "bold" } },
                { type: "spacer" },
                { type: "text", text: `剩余 ${remain5h}%`, font: { size: 13, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction5h) },
              ],
            },
            { type: "image", src: createProgressBarSvg(first.remainingFraction5h, getQuotaColor(first.remainingFraction5h), 6.5), height: 6.5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `已使用 ${used5h}% · 重置 ${first.reset5hTimeStr}`, font: { size: 10 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: first.reset5hCountdownStr, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction5h) },
              ],
            },
          ],
        },
        // 底部集群状态看板
        ...(stats ? [{
          type: "stack",
          direction: "row",
          alignItems: "center",
          padding: [8, 12, 8, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "column",
              gap: 1,
              children: [
                { type: "text", text: "集群账号", font: { size: 10 }, textColor: C.textSecondary },
                { type: "text", text: `${stats.availableAccounts}/${stats.totalAccounts} 可用`, font: { size: 11, weight: "bold" }, textColor: "#34C759" },
              ],
            },
            { type: "spacer" },
            {
              type: "stack",
              direction: "column",
              alignItems: "end",
              gap: 1,
              children: [
                { type: "text", text: "今日调用 / RPM", font: { size: 10 }, textColor: C.textSecondary },
                { type: "text", text: `${stats.todayRequests} 次 · ${stats.rpm ?? 0}`, font: { size: 11, weight: "bold" } },
              ],
            },
          ],
        }] : []),
      ],
    };
  }

  // 2. 双账号专属双大卡片排版
  if (isDual) {
    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [14, 16, 14, 16],
      gap: 10,
      children: [
        // 顶栏 (Codex2API 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CODEX2API_LOGO, width: 16, height: 16, borderRadius: 4 },
            { type: "text", text: "Codex2API 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${accounts.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        ...accounts.map((acc) => {
          const accBadge = getAccountBadge(acc);
          const used5h = acc.usagePercent5h !== null ? Math.round(acc.usagePercent5h) : Math.round((1 - acc.remainingFraction5h) * 100);
          const remain5h = Math.round(acc.remainingFraction5h * 100);
          const used7d = acc.usagePercent7d !== null ? Math.round(acc.usagePercent7d) : Math.round((1 - acc.remainingFraction7d) * 100);
          const remain7d = Math.round(acc.remainingFraction7d * 100);
          const usedPercent = acc.primaryWindow === "7d" ? used7d : used5h;
          const remainPercent = acc.primaryWindow === "7d" ? remain7d : remain5h;
          const accountLabel = maskEmail(acc.email || acc.name, maskEmailEnabled);
          const progressSvg = createProgressBarSvg(acc.primaryRemainingFraction, acc.statusColor, 6);

          return {
            type: "stack",
            direction: "column",
            gap: 8,
            padding: [12, 12, 12, 12],
            backgroundColor: C.cardBg,
            borderWidth: 0.5,
            borderColor: C.cardBorder,
            borderRadius: 13,
            flex: 1,
            children: [
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                children: [
                  {
                    type: "stack",
                    direction: "row",
                    alignItems: "center",
                    gap: 6,
                    children: [
                      createMicroBadge(accBadge),
                      {
                        type: "stack",
                        direction: "column",
                        gap: 1,
                        children: [
                          { type: "text", text: accountLabel, font: { size: 13, weight: "heavy" }, maxLines: 1 },
                          { type: "text", text: `状态: ${acc.healthTier} · 评分 ${acc.dispatchScore}`, font: { size: 9.5 }, textColor: C.textSecondary },
                        ],
                      },
                    ],
                  },
                  { type: "spacer" },
                  {
                    type: "stack",
                    direction: "column",
                    alignItems: "end",
                    gap: 1,
                    children: [
                      { type: "text", text: `${acc.primaryWindowLabel}余 ${remainPercent}%`, font: { size: 15, weight: "heavy" }, textColor: acc.statusColor },
                      { type: "text", text: `已用 ${usedPercent}%`, font: { size: 10 }, textColor: C.textSecondary },
                    ],
                  },
                ],
              },
              { type: "image", src: progressSvg, height: 6 },
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                children: [
                  { type: "text", text: `重置 ${formatSmallResetLabel(acc.primaryResetAtMs, acc.primaryWindow === "7d")}`, font: { size: 10 }, textColor: C.textSecondary },
                  { type: "spacer" },
                  { type: "text", text: acc.primaryResetCountdownStr, font: { size: 10, weight: "bold" }, textColor: acc.statusColor },
                ],
              },
            ],
          };
        }),
        ...(stats ? [{
          type: "stack",
          direction: "row",
          alignItems: "center",
          padding: [7, 12, 7, 12],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 10,
          children: [
            { type: "text", text: `集群: ${stats.availableAccounts}/${stats.totalAccounts} 可用`, font: { size: 10, weight: "bold" }, textColor: "#34C759" },
            { type: "spacer" },
            { type: "text", text: `今日: ${stats.todayRequests} 次 · RPM: ${stats.rpm ?? 0}`, font: { size: 10 }, textColor: C.textSecondary },
          ],
        }] : []),
      ],
    };
  }

  // 3. 3~4 个多账号紧凑列表
  const topFour = accounts.slice(0, 4);
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [14, 16, 14, 16],
    gap: 8,
    children: [
      // 顶栏 (Codex2API 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: CODEX2API_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "text", text: "Codex2API 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: `${accounts.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
        ],
      },
      ...topFour.map((acc) => {
        const accBadge = getAccountBadge(acc);
        const remainPercent = Math.round(acc.primaryRemainingFraction * 100);
        const accountLabel = maskEmail(acc.email || acc.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(acc.primaryRemainingFraction, acc.statusColor, 5);

        return {
          type: "stack",
          direction: "column",
          gap: 4,
          padding: [8, 11, 8, 11],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              gap: 5,
              children: [
                createMicroBadge(accBadge),
                { type: "text", text: accountLabel, font: { size: 11.5, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `${acc.primaryWindowLabel}余 ${remainPercent}%`,
                  font: { size: 11.5, weight: "heavy" },
                  textColor: acc.statusColor,
                },
              ],
            },
            { type: "image", src: progressSvg, height: 5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${formatSmallResetLabel(acc.primaryResetAtMs, acc.primaryWindow === "7d")}`, font: { size: 9.5 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: acc.primaryResetCountdownStr, font: { size: 9.5, weight: "bold" }, textColor: acc.statusColor },
              ],
            },
          ],
        };
      }),
      ...(stats ? [{
        type: "stack",
        direction: "row",
        alignItems: "center",
        padding: [7, 11, 7, 11],
        backgroundColor: C.cardBg,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        borderRadius: 10,
        children: [
          { type: "text", text: `集群可用: ${stats.availableAccounts}/${stats.totalAccounts}`, font: { size: 10 }, textColor: C.textSecondary },
          { type: "spacer" },
          { type: "text", text: `今日: ${stats.todayRequests} 次 · RPM: ${stats.rpm ?? 0}`, font: { size: 10 }, textColor: C.textSecondary },
        ],
      }] : []),
    ],
  };
}

function renderErrorWidget(family, error, updateTime) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 12,
    gap: 6,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: CODEX2API_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "text", text: "Codex2API", font: { size: 11, weight: "bold" }, textColor: C.textPrimary },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10 }, textColor: C.textSecondary },
        ],
      },
      {
        type: "stack",
        direction: "column",
        gap: 4,
        padding: 8,
        backgroundColor: C.cardBg,
        borderRadius: 10,
        children: [
          { type: "text", text: "连接异常", font: { size: 12, weight: "bold" }, textColor: "#FF3B30" },
          { type: "text", text: String(error).slice(0, 60), font: { size: 10 }, textColor: C.textSecondary, maxLines: 2 },
          { type: "text", text: "请在模块 Env 检查 SERVER_URL 与 Key", font: { size: 9 }, textColor: C.textSecondary },
        ],
      },
    ],
  };
}