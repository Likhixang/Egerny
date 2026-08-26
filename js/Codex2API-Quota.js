/*
 * Codex2API Quota 额度监控 — Egern 新式小组件
 * 核心升级：
 *   - 官方 OpenAI / Codex 精细品牌矢量徽标
 *   - 纯正 Apple HIG 拟物磨砂玻璃卡片（自适应浅色/深色透明度与边框）
 *   - 智能 5h 滚动与 7d 周额度双窗口自适应
 *   - 适配全部主屏与锁屏尺寸 (systemSmall, systemMedium, systemLarge, accessory*)
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
    return fallbackRemaining >= 0.99 ? "额度充沛" : "恢复中";
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

function getPlanBadge(plan, windowType) {
  const p = (plan || "pro").toLowerCase();
  const winLabel = windowType === "7d" ? "7D" : "5H";
  if (p.includes("team")) {
    return {
      text: `TEAM · ${winLabel}`,
      svg: BRAND_ICONS.openai,
      bg: "#AF52DE",
    };
  }
  if (p.includes("enterprise") || p.includes("ent")) {
    return {
      text: `ENT · ${winLabel}`,
      svg: BRAND_ICONS.openai,
      bg: "#5856D6",
    };
  }
  return {
    text: `PRO · ${winLabel}`,
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
  const has5h = acc.usage_percent_5h !== undefined && acc.usage_percent_5h !== null;
  const usage5h = has5h ? Number(acc.usage_percent_5h) : null;
  const remainingFraction5h = usage5h !== null ? Math.max(0, Math.min(1, (100 - usage5h) / 100)) : 1.0;
  const reset5hAtMs = acc.reset_5h_at ? new Date(acc.reset_5h_at).getTime() : null;
  const reset5hTimeStr = reset5hAtMs ? formatTimeOnly(reset5hAtMs) : "--:--";
  const reset5hCountdownStr = formatCountdown(reset5hAtMs, remainingFraction5h);
  const billed5h = typeof acc.billed_5h === "number" ? acc.billed_5h : null;

  // 7d Window (周额度)
  const has7d = acc.usage_percent_7d !== undefined && acc.usage_percent_7d !== null;
  const usage7d = has7d ? Number(acc.usage_percent_7d) : null;
  const remainingFraction7d = usage7d !== null ? Math.max(0, Math.min(1, (100 - usage7d) / 100)) : 1.0;
  const reset7dAtMs = acc.reset_7d_at ? new Date(acc.reset_7d_at).getTime() : null;
  const reset7dTimeStr = reset7dAtMs ? formatShortDate(reset7dAtMs) : "--/--";
  const reset7dCountdownStr = formatCountdown(reset7dAtMs, remainingFraction7d);
  const billed7d = typeof acc.billed_7d === "number" ? acc.billed_7d : null;

  // 自动判断主力窗口
  let primaryWindow = "5h";
  if (has7d && !has5h) {
    primaryWindow = "7d";
  } else if (has5h && !has7d) {
    primaryWindow = "5h";
  } else if (has5h && has7d) {
    if (usage7d !== null && usage5h !== null && usage7d > usage5h && usage7d > 0) {
      primaryWindow = "7d";
    } else {
      primaryWindow = "5h";
    }
  }

  const primaryWindowLabel = primaryWindow === "7d" ? "周额度" : "5小时";
  const primaryRemainingFraction = primaryWindow === "7d" ? remainingFraction7d : remainingFraction5h;
  const primaryResetAtMs = primaryWindow === "7d" ? reset7dAtMs : reset5hAtMs;
  const primaryResetTimeStr = primaryWindow === "7d" ? reset7dTimeStr : reset5hTimeStr;
  const primaryResetCountdownStr = primaryWindow === "7d" ? reset7dCountdownStr : reset5hCountdownStr;
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
    primaryWindow,
    primaryWindowLabel,
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
    {
      id: 1,
      name: "team-main",
      email: "team-dev@openai.com",
      planType: "team",
      status: "ready",
      healthTier: "healthy",
      has5h: true,
      usagePercent5h: 18.5,
      remainingFraction5h: 0.815,
      reset5hAtMs: now + 3.5 * 3600 * 1000,
      reset5hTimeStr: formatTimeOnly(now + 3.5 * 3600 * 1000),
      reset5hCountdownStr: "3h 30m",
      billed5h: 0.42,
      has7d: false,
      usagePercent7d: null,
      remainingFraction7d: 1.0,
      reset7dAtMs: null,
      reset7dTimeStr: "--/--",
      reset7dCountdownStr: "额度充沛",
      billed7d: null,
      primaryWindow: "5h",
      primaryWindowLabel: "5小时",
      primaryRemainingFraction: 0.815,
      primaryResetAtMs: now + 3.5 * 3600 * 1000,
      primaryResetTimeStr: formatTimeOnly(now + 3.5 * 3600 * 1000),
      primaryResetCountdownStr: "3h 30m",
      statusColor: "#34C759",
      activeRequests: 1,
      totalRequests: 890,
      successRequests: 885,
      errorRequests: 5,
      creditEnabled: false,
      schedulerScore: 92,
      dispatchScore: 98,
    },
    {
      id: 2,
      name: "pro-weekly",
      email: "pro-user@openai.com",
      planType: "pro",
      status: "ready",
      healthTier: "healthy",
      has5h: true,
      usagePercent5h: 82.0,
      remainingFraction5h: 0.18,
      reset5hAtMs: now + 1.2 * 3600 * 1000,
      reset5hTimeStr: formatTimeOnly(now + 1.2 * 3600 * 1000),
      reset5hCountdownStr: "1h 12m",
      billed5h: 1.8,
      has7d: true,
      usagePercent7d: 91.5,
      remainingFraction7d: 0.085,
      reset7dAtMs: now + 2.1 * 86400 * 1000,
      reset7dTimeStr: formatShortDate(now + 2.1 * 86400 * 1000),
      reset7dCountdownStr: "2天 2h",
      billed7d: 14.5,
      primaryWindow: "7d",
      primaryWindowLabel: "周额度",
      primaryRemainingFraction: 0.085,
      primaryResetAtMs: now + 2.1 * 86400 * 1000,
      primaryResetTimeStr: formatShortDate(now + 2.1 * 86400 * 1000),
      primaryResetCountdownStr: "2天 2h",
      statusColor: "#FF3B30",
      activeRequests: 0,
      totalRequests: 1420,
      successRequests: 1390,
      errorRequests: 30,
      creditEnabled: false,
      schedulerScore: 75,
      dispatchScore: 90,
    },
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

  if (family === "accessoryCircular") {
    return renderAccessoryCircular(accounts[0]);
  } else if (family === "accessoryRectangular") {
    return renderAccessoryRectangular(accounts[0]);
  } else if (family === "accessoryInline") {
    return renderAccessoryInline(accounts[0]);
  } else if (family === "systemSmall") {
    return renderSmallWidget(accounts[0], updateTimeStr);
  } else if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderLargeWidget(accounts, snapshot?.stats, updateDateStr, maskEmailEnabled);
  } else {
    return renderMediumWidget(accounts, updateDateStr, maskEmailEnabled);
  }
}

// ── HIG 拟物卡片式布局 ──

function renderSmallWidget(account, updateTime) {
  const usedPercent = Math.round((1 - account.primaryRemainingFraction) * 100);
  const remainPercent = Math.round(account.primaryRemainingFraction * 100);
  const badge = getPlanBadge(account.planType, account.primaryWindow);
  const progressSvg = createProgressBarSvg(account.primaryRemainingFraction, account.statusColor, 6);

  return {
    type: "widget",
    padding: 12,
    gap: 8,
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
            gap: 4,
            padding: [3, 8, 3, 8],
            backgroundColor: badge.bg,
            borderRadius: 10,
            children: [
              { type: "image", src: badge.svg, width: 12, height: 12 },
              { type: "text", text: badge.text, font: { size: 10, weight: "heavy" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10, weight: "medium" }, textColor: "#8E8E93" },
        ],
      },
      {
        type: "stack",
        direction: "column",
        gap: 8,
        padding: [10, 10, 10, 10],
        backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
        borderWidth: 0.5,
        borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
        borderRadius: 13,
        flex: 1,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "start",
            children: [
              {
                type: "stack",
                direction: "column",
                gap: 1,
                children: [
                  { type: "text", text: "已用", font: { size: 10 }, textColor: "#8E8E93" },
                  { type: "text", text: `${usedPercent}%`, font: { size: 17, weight: "heavy" }, textColor: { light: "#1C1C1E", dark: "#FFFFFF" } },
                ],
              },
              { type: "spacer" },
              {
                type: "stack",
                direction: "column",
                alignItems: "end",
                gap: 1,
                children: [
                  { type: "text", text: `剩余 (${account.primaryWindow})`, font: { size: 10 }, textColor: "#8E8E93" },
                  { type: "text", text: `${remainPercent}%`, font: { size: 17, weight: "heavy" }, textColor: account.statusColor },
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
              { type: "text", text: formatSmallResetLabel(account.primaryResetAtMs, account.primaryWindow === "7d"), font: { size: 9 }, textColor: "#8E8E93" },
              { type: "spacer" },
              { type: "text", text: formatCountdown(account.primaryResetAtMs, account.primaryRemainingFraction), font: { size: 10, weight: "bold" }, textColor: account.statusColor },
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
  const badge = getPlanBadge(first.planType, first.primaryWindow);

  if (isSingle) {
    const isDual = first.has5h && first.has7d;
    const used5h = first.usagePercent5h !== null ? Math.round(first.usagePercent5h) : Math.round((1 - first.remainingFraction5h) * 100);
    const remain5h = Math.round(first.remainingFraction5h * 100);
    const used7d = first.usagePercent7d !== null ? Math.round(first.usagePercent7d) : Math.round((1 - first.remainingFraction7d) * 100);
    const remain7d = Math.round(first.remainingFraction7d * 100);

    const accountLabel = maskEmail(first.email || first.name, maskEmailEnabled);

    return {
      type: "widget",
      padding: [12, 14, 12, 14],
      gap: 8,
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
              padding: [3, 9, 3, 9],
              backgroundColor: badge.bg,
              borderRadius: 10,
              children: [
                { type: "image", src: badge.svg, width: 13, height: 13 },
                { type: "text", text: badge.text, font: { size: 11, weight: "heavy" }, textColor: "#FFFFFF" },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: "#8E8E93" },
          ],
        },
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            { type: "text", text: accountLabel, font: { size: 12, weight: "bold" }, maxLines: 1 },
            { type: "spacer" },
            { type: "text", text: `状态: ${first.healthTier}`, font: { size: 10 }, textColor: "#8E8E93" },
          ],
        },
        {
          type: "stack",
          direction: "column",
          gap: isDual ? 6 : 8,
          padding: [9, 12, 9, 12],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 13,
          flex: 1,
          children: isDual ? [
            {
              type: "stack",
              direction: "column",
              gap: 2,
              children: [
                {
                  type: "stack",
                  direction: "row",
                  alignItems: "center",
                  children: [
                    { type: "text", text: "5小时 滚动额度", font: { size: 10, weight: "semibold" } },
                    { type: "spacer" },
                    { type: "text", text: `余 ${remain5h}% (${first.reset5hCountdownStr})`, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction5h) },
                  ],
                },
                { type: "image", src: createProgressBarSvg(first.remainingFraction5h, getQuotaColor(first.remainingFraction5h), 5), height: 5 },
              ],
            },
            {
              type: "stack",
              direction: "column",
              gap: 2,
              children: [
                {
                  type: "stack",
                  direction: "row",
                  alignItems: "center",
                  children: [
                    { type: "text", text: "7天 周额度 (Weekly)", font: { size: 10, weight: "semibold" } },
                    { type: "spacer" },
                    { type: "text", text: `余 ${remain7d}% (${first.reset7dCountdownStr})`, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction7d) },
                  ],
                },
                { type: "image", src: createProgressBarSvg(first.remainingFraction7d, getQuotaColor(first.remainingFraction7d), 5), height: 5 },
              ],
            },
          ] : [
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
                    { type: "text", text: "已用", font: { size: 11 }, textColor: "#8E8E93" },
                    { type: "text", text: `${first.primaryWindow === "7d" ? used7d : used5h}%`, font: { size: 15, weight: "heavy" } },
                  ],
                },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "text", text: `${first.primaryWindowLabel}剩余`, font: { size: 11 }, textColor: "#8E8E93" },
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
                { type: "text", text: `重置 ${first.primaryResetTimeStr}`, font: { size: 10 }, textColor: "#8E8E93" },
                { type: "spacer" },
                { type: "text", text: first.primaryResetCountdownStr, font: { size: 10, weight: "bold" }, textColor: first.statusColor },
              ],
            },
          ],
        },
      ],
    };
  }

  const topTwo = accounts.slice(0, 2);
  return {
    type: "widget",
    padding: [12, 14, 12, 14],
    gap: 7,
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
            padding: [3, 9, 3, 9],
            backgroundColor: badge.bg,
            borderRadius: 10,
            children: [
              { type: "image", src: badge.svg, width: 13, height: 13 },
              { type: "text", text: badge.text, font: { size: 11, weight: "heavy" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: "#8E8E93" },
        ],
      },
      ...topTwo.map((acc) => {
        const remainPercent = Math.round(acc.primaryRemainingFraction * 100);
        const accountLabel = maskEmail(acc.email || acc.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(acc.primaryRemainingFraction, acc.statusColor, 5);

        return {
          type: "stack",
          direction: "column",
          gap: 3,
          padding: [7, 10, 7, 10],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 11,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: accountLabel, font: { size: 11, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `${acc.primaryWindowLabel}余 ${remainPercent}%`,
                  font: { size: 11, weight: "heavy" },
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
                { type: "text", text: `重置 ${formatSmallResetLabel(acc.primaryResetAtMs, acc.primaryWindow === "7d")}`, font: { size: 9 }, textColor: "#8E8E93" },
                { type: "spacer" },
                { type: "text", text: acc.primaryResetCountdownStr, font: { size: 9, weight: "semibold" }, textColor: acc.statusColor },
              ],
            },
          ],
        };
      }),
    ],
  };
}

function renderLargeWidget(accounts, stats, updateStr, maskEmailEnabled) {
  const isSingle = accounts.length === 1;
  const first = accounts[0];
  const badge = getPlanBadge(first.planType, first.primaryWindow);

  if (isSingle) {
    const used5h = first.usagePercent5h !== null ? Math.round(first.usagePercent5h) : Math.round((1 - first.remainingFraction5h) * 100);
    const remain5h = Math.round(first.remainingFraction5h * 100);
    const used7d = first.usagePercent7d !== null ? Math.round(first.usagePercent7d) : Math.round((1 - first.remainingFraction7d) * 100);
    const remain7d = Math.round(first.remainingFraction7d * 100);
    const accountLabel = maskEmail(first.email || first.name, maskEmailEnabled);

    return {
      type: "widget",
      padding: 14,
      gap: 10,
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
              padding: [3, 9, 3, 9],
              backgroundColor: badge.bg,
              borderRadius: 10,
              children: [
                { type: "image", src: badge.svg, width: 13, height: 13 },
                { type: "text", text: badge.text, font: { size: 12, weight: "heavy" }, textColor: "#FFFFFF" },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: "#8E8E93" },
          ],
        },
        {
          type: "stack",
          direction: "column",
          gap: 2,
          children: [
            { type: "text", text: accountLabel, font: { size: 14, weight: "heavy" }, maxLines: 1 },
            {
              type: "stack",
              direction: "row",
              gap: 8,
              children: [
                { type: "text", text: `调度: ${first.dispatchScore}`, font: { size: 10 }, textColor: "#8E8E93" },
                { type: "text", text: `状态: ${first.healthTier}`, font: { size: 10 }, textColor: "#8E8E93" },
                { type: "text", text: `请求: ${first.successRequests}`, font: { size: 10 }, textColor: "#8E8E93" },
              ],
            },
          ],
        },
        // 5小时卡片
        ...(first.has5h ? [{
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [10, 12, 10, 12],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: "5小时 滚动配额", font: { size: 13, weight: "bold" } },
                { type: "spacer" },
                { type: "text", text: `剩余 ${remain5h}%`, font: { size: 13, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction5h) },
              ],
            },
            { type: "image", src: createProgressBarSvg(first.remainingFraction5h, getQuotaColor(first.remainingFraction5h), 6), height: 6 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `已使用 ${used5h}% · 重置 ${first.reset5hTimeStr}`, font: { size: 10 }, textColor: "#8E8E93" },
                { type: "spacer" },
                { type: "text", text: first.reset5hCountdownStr, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction5h) },
              ],
            },
          ],
        }] : []),
        // 7天周额度卡片
        ...(first.has7d ? [{
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [10, 12, 10, 12],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: "7天 周额度 (Weekly)", font: { size: 13, weight: "bold" } },
                { type: "spacer" },
                { type: "text", text: `剩余 ${remain7d}%`, font: { size: 13, weight: "heavy" }, textColor: getQuotaColor(first.remainingFraction7d) },
              ],
            },
            { type: "image", src: createProgressBarSvg(first.remainingFraction7d, getQuotaColor(first.remainingFraction7d), 6), height: 6 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `已使用 ${used7d}% · 重置 ${first.reset7dTimeStr}`, font: { size: 10 }, textColor: "#8E8E93" },
                { type: "spacer" },
                { type: "text", text: first.reset7dCountdownStr, font: { size: 10, weight: "bold" }, textColor: getQuotaColor(first.remainingFraction7d) },
              ],
            },
          ],
        }] : []),
        // 底部集群汇总
        ...(stats ? [{
          type: "stack",
          direction: "row",
          alignItems: "center",
          padding: [9, 12, 9, 12],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "column",
              gap: 1,
              children: [
                { type: "text", text: "集群账号", font: { size: 10 }, textColor: "#8E8E93" },
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
                { type: "text", text: "今日调用 / RPM", font: { size: 10 }, textColor: "#8E8E93" },
                { type: "text", text: `${stats.todayRequests} 次 · ${stats.rpm ?? 0}`, font: { size: 11, weight: "bold" } },
              ],
            },
          ],
        }] : []),
      ],
    };
  }

  const topFour = accounts.slice(0, 4);
  return {
    type: "widget",
    padding: 14,
    gap: 10,
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
            padding: [3, 9, 3, 9],
            backgroundColor: badge.bg,
            borderRadius: 10,
            children: [
              { type: "image", src: badge.svg, width: 13, height: 13 },
              { type: "text", text: badge.text, font: { size: 12, weight: "heavy" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: "#8E8E93" },
        ],
      },
      ...topFour.map((acc) => {
        const remainPercent = Math.round(acc.primaryRemainingFraction * 100);
        const accountLabel = maskEmail(acc.email || acc.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(acc.primaryRemainingFraction, acc.statusColor, 6);

        return {
          type: "stack",
          direction: "column",
          gap: 4,
          padding: [9, 11, 9, 11],
          backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
          borderWidth: 0.5,
          borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: accountLabel, font: { size: 12, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `${acc.primaryWindowLabel}余 ${remainPercent}%`,
                  font: { size: 12, weight: "heavy" },
                  textColor: acc.statusColor,
                },
              ],
            },
            { type: "image", src: progressSvg, height: 6 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${formatSmallResetLabel(acc.primaryResetAtMs, acc.primaryWindow === "7d")}`, font: { size: 9 }, textColor: "#8E8E93" },
                { type: "spacer" },
                { type: "text", text: acc.primaryResetCountdownStr, font: { size: 9, weight: "semibold" }, textColor: acc.statusColor },
              ],
            },
          ],
        };
      }),
      ...(stats ? [{
        type: "stack",
        direction: "row",
        alignItems: "center",
        padding: [8, 12, 8, 12],
        backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
        borderWidth: 0.5,
        borderColor: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
        borderRadius: 12,
        children: [
          { type: "text", text: `集群可用: ${stats.availableAccounts}/${stats.totalAccounts}`, font: { size: 10 }, textColor: "#8E8E93" },
          { type: "spacer" },
          { type: "text", text: `今日: ${stats.todayRequests} 次 · RPM: ${stats.rpm ?? 0}`, font: { size: 10 }, textColor: "#8E8E93" },
        ],
      }] : []),
    ],
  };
}

function renderAccessoryCircular(account) {
  const remainPercent = Math.round((account?.primaryRemainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "stack",
        direction: "column",
        alignItems: "center",
        gap: 2,
        children: [
          { type: "image", src: "sf-symbol:crown.fill", width: 14, height: 14 },
          { type: "text", text: `${remainPercent}%`, font: { size: 11, weight: "bold" } },
        ],
      },
    ],
  };
}

function renderAccessoryRectangular(account) {
  const remainPercent = Math.round((account?.primaryRemainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:crown.fill", width: 12, height: 12 },
          { type: "text", text: `${account?.planType?.toUpperCase() || "CODEX"} (${account?.primaryWindowLabel || "5h"})`, font: { size: 12, weight: "bold" } },
        ],
      },
      {
        type: "text",
        text: `剩余 ${remainPercent}% · ${account?.primaryResetCountdownStr || "恢复中"}`,
        font: { size: 11 },
      },
    ],
  };
}

function renderAccessoryInline(account) {
  const remainPercent = Math.round((account?.primaryRemainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "text",
        text: `Codex(${account?.primaryWindow || "5h"}): 余${remainPercent}% (${account?.primaryResetCountdownStr || "OK"})`,
      },
    ],
  };
}

function renderErrorWidget(family, error, updateTime) {
  return {
    type: "widget",
    padding: 12,
    gap: 6,
    children: [
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
            padding: [2, 6, 2, 6],
            backgroundColor: "#FF3B30",
            borderRadius: 8,
            children: [
              { type: "image", src: "sf-symbol:exclamationmark.triangle.fill", width: 10, height: 10, color: "#FFFFFF" },
              { type: "text", text: "CODEX2API", font: { size: 10, weight: "bold" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10 }, textColor: "#8E8E93" },
        ],
      },
      {
        type: "stack",
        direction: "column",
        gap: 4,
        padding: 8,
        backgroundColor: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
        borderRadius: 10,
        children: [
          { type: "text", text: "连接异常", font: { size: 12, weight: "bold" }, textColor: "#FF3B30" },
          { type: "text", text: String(error).slice(0, 60), font: { size: 10 }, textColor: "#8E8E93", maxLines: 2 },
          { type: "text", text: "请在模块 Env 检查 SERVER_URL 与 Key", font: { size: 9 }, textColor: "#8E8E93" },
        ],
      },
    ],
  };
}
