/*
 * CLIProxy Quota 额度监控 — Egern 新式小组件
 * 功能特性：
 *   - 支持监控 CLIProxyAPI / cpa 各 AI 渠道（Gemini 5h、Claude 5h、Codex 等）额度
 *   - 适配全部主屏与锁屏尺寸：
 *       - systemSmall: 精致胶囊徽标 + 核心大数字 + SVG 进度条 + 重置倒计时
 *       - systemMedium: 宽屏卡片（单模型大字呼吸排版 / 双模型紧凑排版）
 *       - systemLarge / systemExtraLarge: 详细卡片列表（最多 4 账号）
 *       - accessoryCircular / accessoryRectangular / accessoryInline: 锁屏系列
 * 
 * 环境变量配置 (兼容 compat_arguments 与 env_schema):
 *   - SERVER_URL / ServerURL: CLIProxy API 地址 (默认 http://127.0.0.1:8317)
 *   - MANAGEMENT_KEY / ManagementKey: 管理密钥 (选填)
 *   - MASK_EMAIL / MaskEmail: 是否对账号邮箱打码 (默认 false)
 *   - FILTER / Filter: 筛选指定账号/模型关键字或数字序号 (选填)
 */

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

function formatCountdown(resetAtMs, fallback = 1.0) {
  if (!resetAtMs || isNaN(resetAtMs)) {
    return fallback >= 0.99 ? "额度充沛" : "恢复中";
  }
  const diffMs = resetAtMs - Date.now();
  if (diffMs <= 0) return "已重置";
  const mins = Math.floor(diffMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getQuotaColor(fraction) {
  if (fraction >= 0.4) return "#34C759"; // systemGreen
  if (fraction >= 0.15) return "#FF9500"; // systemOrange
  return "#FF3B30"; // systemRed
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

function getBadgeConfig(provider, name) {
  const p = (provider || "").toUpperCase();
  const n = (name || "").toUpperCase();
  if (n.includes("ANTIGRAVITY") || n.includes("GOOGLE") || p.includes("GEMINI")) {
    return { text: "GEMINI", icon: "sparkles", bg: "#007AFF" };
  }
  if (n.includes("CLAUDE") || p.includes("CLAUDE")) {
    return { text: "CLAUDE", icon: "bolt.fill", bg: "#FF9500" };
  }
  if (n.includes("TEAM")) {
    return { text: "TEAM", icon: "person.2.fill", bg: "#AF52DE" };
  }
  if (n.includes("PLUS") || n.includes("CODEX") || p.includes("OPENAI")) {
    return { text: "PLUS", icon: "atom", bg: "#34C759" };
  }
  if (n.includes("GROK")) {
    return { text: "GROK", icon: "slash.circle", bg: "#5856D6" };
  }
  return { text: "AI", icon: "sparkles", bg: "#007AFF" };
}

function createProgressBarSvg(fraction, color, height = 5) {
  const percent = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${height}' preserveAspectRatio='none'>
    <rect x='0' y='0' width='100' height='${height}' rx='${height / 2}' fill='rgba(120,120,128,0.24)'/>
    <rect x='0' y='0' width='${percent}' height='${height}' rx='${height / 2}' fill='${color}'/>
  </svg>`.replace(/\s+/g, " ");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function fetchWithTimeout(ctx, url, options = {}, timeoutMs = 4500) {
  try {
    return await ctx.http.get(url, { ...options, timeout: timeoutMs });
  } catch (e) {
    return null;
  }
}

async function fetchPostWithTimeout(ctx, url, body, options = {}, timeoutMs = 4500) {
  try {
    return await ctx.http.post(url, { ...options, body, timeout: timeoutMs });
  } catch (e) {
    return null;
  }
}

async function syncCLIProxyQuotaData(ctx) {
  const envUrl = ctx.env?.SERVER_URL || ctx.env?.ServerURL || ctx.env?.server_url || "";
  const managementKey = ctx.env?.MANAGEMENT_KEY || ctx.env?.ManagementKey || ctx.env?.management_key || "";
  const rawUrl = envUrl || ctx.storage.get("cliproxy_url") || "http://127.0.0.1:8317";
  const baseUrl = rawUrl.trim().replace(/\/+$/, "");

  if (!baseUrl) {
    return {
      models: [],
      readyCount: 0,
      totalCount: 0,
      totalSuccess: 0,
      totalFailed: 0,
      lastUpdated: Date.now(),
      error: "未配置 SERVER_URL",
    };
  }

  const headers = { "Content-Type": "application/json" };
  if (managementKey.trim()) {
    headers["Authorization"] = `Bearer ${managementKey.trim()}`;
  }

  try {
    let authRes = [];
    let fetchError = null;

    const authFetchRes = await fetchWithTimeout(ctx, `${baseUrl}/v0/management/auth-files`, { headers }, 5000);
    if (authFetchRes && authFetchRes.status === 200) {
      const data = await authFetchRes.json().catch(() => null);
      authRes = Array.isArray(data?.files) ? data.files : [];
    } else if (authFetchRes) {
      fetchError = authFetchRes.status === 401 ? "401 密钥错误" : `HTTP ${authFetchRes.status}`;
    } else {
      fetchError = "连接超时/无法访问";
    }

    let usageRes = {};
    const usageFetchRes = await fetchWithTimeout(ctx, `${baseUrl}/v0/management/api-key-usage`, { headers }, 4000);
    if (usageFetchRes && usageFetchRes.status === 200) {
      usageRes = await usageFetchRes.json().catch(() => ({}));
    }

    const modelList = [];
    const validFiles = authRes.filter((file) => !file.disabled && !file.unavailable && file.status !== "disabled");

    const quotaTasks = validFiles.map(async (file) => {
      const authIndex = file.auth_index || file.authIndex || file.name;
      const fileNameLower = (file.name || "").toLowerCase();
      const fileTypeLower = (file.type || file.provider || "").toLowerCase();
      const accountLabel = file.email || (file.name || "").replace(/\.json$/, "");

      // 1. Google / Gemini / Antigravity
      if (
        fileTypeLower.includes("antigravity") ||
        fileTypeLower.includes("gemini") ||
        fileNameLower.includes("antigravity") ||
        fileNameLower.includes("gemini") ||
        fileNameLower.includes("cloudcode")
      ) {
        try {
          const projectId = file.project_id || file.projectId || "";
          const reqBody = {
            authIndex,
            method: "POST",
            url: "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary",
            header: {
              Authorization: "Bearer $TOKEN$",
              "Content-Type": "application/json",
              "User-Agent": "antigravity/cli/1.0.13 (aidev_client; os_type=darwin; arch=arm64)",
            },
            data: JSON.stringify({ project: projectId }),
          };
          const res = await fetchPostWithTimeout(ctx, `${baseUrl}/v0/management/api-call`, reqBody, { headers }, 4000);
          if (res && res.status === 200) {
            const data = await res.json();
            const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body || {};
            const groups = Array.isArray(body.groups) ? body.groups : [];
            for (const group of groups) {
              const groupName = group.displayName || group.display_name || "Gemini";
              const isGeminiGroup =
                groupName.toLowerCase().includes("gemini") ||
                !groupName.toLowerCase().includes("claude");
              if (!isGeminiGroup) continue;

              const buckets = Array.isArray(group.buckets) ? group.buckets : [];
              const fiveHourBucket =
                buckets.find((b) => (b.window || "").toLowerCase().includes("5h") || (b.window || "").toLowerCase().includes("five")) ||
                buckets[0];
              if (fiveHourBucket) {
                const fractionRaw = fiveHourBucket.remainingFraction ?? fiveHourBucket.remaining_fraction ?? 1.0;
                const remainingFraction = Math.max(0, Math.min(1, Number(fractionRaw) || 0));
                const resetTime = fiveHourBucket.resetTime || fiveHourBucket.reset_time;
                const resetAtMs = resetTime ? new Date(resetTime).getTime() : null;
                const resetTimeStr = resetAtMs ? formatShortDate(resetAtMs) : formatShortDate(Date.now() + 18000000);
                const resetCountdownStr = formatCountdown(resetAtMs, remainingFraction);
                modelList.push({
                  id: `antigravity-${authIndex}-${groupName}`,
                  name: groupName,
                  shortName: groupName,
                  provider: "Gemini",
                  account: accountLabel,
                  remainingFraction,
                  resetAtMs,
                  resetTimeStr,
                  resetCountdownStr,
                  statusColor: getQuotaColor(remainingFraction),
                });
              }
            }
          }
        } catch (e) {}
      }

      // 2. Claude OAuth
      if (fileTypeLower.includes("claude") || fileNameLower.includes("claude")) {
        try {
          const reqBody = {
            authIndex,
            method: "GET",
            url: "https://api.anthropic.com/api/oauth/usage",
            header: {
              Authorization: "Bearer $TOKEN$",
              "Content-Type": "application/json",
              "anthropic-beta": "oauth-2025-04-20",
            },
          };
          const res = await fetchPostWithTimeout(ctx, `${baseUrl}/v0/management/api-call`, reqBody, { headers }, 4000);
          if (res && res.status === 200) {
            const data = await res.json();
            const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body || {};
            if (body.five_hour && typeof body.five_hour.utilization === "number") {
              const util = Number(body.five_hour.utilization) || 0;
              const remainingFraction = Math.max(0, Math.min(1, 1 - util / 100));
              const resetAtMs = body.five_hour.resets_at ? new Date(body.five_hour.resets_at).getTime() : null;
              const resetTimeStr = resetAtMs ? formatShortDate(resetAtMs) : formatShortDate(Date.now() + 18000000);
              const resetCountdownStr = formatCountdown(resetAtMs, remainingFraction);
              modelList.push({
                id: `claude-${authIndex}-5h`,
                name: "Claude Sonnet",
                shortName: "Sonnet",
                provider: "Claude",
                account: accountLabel,
                remainingFraction,
                resetAtMs,
                resetTimeStr,
                resetCountdownStr,
                statusColor: getQuotaColor(remainingFraction),
              });
            }
          }
        } catch (e) {}
      }
    });

    await Promise.all(quotaTasks);

    const succ =
      authRes.reduce((acc, f) => acc + (f.success || 0), 0) +
      Object.values(usageRes).reduce((acc, p) => acc + Object.values(p || {}).reduce((s, st) => s + (st.success || 0), 0), 0);
    const fail =
      authRes.reduce((acc, f) => acc + (f.failed || 0), 0) +
      Object.values(usageRes).reduce((acc, p) => acc + Object.values(p || {}).reduce((s, st) => s + (st.failed || 0), 0), 0);
    const readyCount = validFiles.length;

    if (!fetchError && modelList.length === 0 && authRes.length === 0) {
      fetchError = "未获取到可用模型配额";
    }

    const snapshot = {
      models: modelList,
      readyCount,
      totalCount: authRes.length,
      totalSuccess: succ,
      totalFailed: fail,
      lastUpdated: Date.now(),
      error: fetchError,
    };

    ctx.storage.setJSON("cliproxy_quota_snapshot", snapshot);
    return snapshot;
  } catch (err) {
    const prev = ctx.storage.getJSON("cliproxy_quota_snapshot");
    const snapshot = {
      models: prev?.models || [],
      readyCount: prev?.readyCount || 0,
      totalCount: prev?.totalCount || 0,
      totalSuccess: prev?.totalSuccess || 0,
      totalFailed: prev?.totalFailed || 0,
      lastUpdated: Date.now(),
      error: err?.message || "刷新失败",
    };
    ctx.storage.setJSON("cliproxy_quota_snapshot", snapshot);
    return snapshot;
  }
}

function getDisplayModels(snapshot) {
  if (!snapshot || !snapshot.models || snapshot.models.length === 0) {
    const now = Date.now();
    return [
      {
        id: "demo-1",
        name: "Gemini 2.5 Flash",
        shortName: "Flash",
        provider: "Google AI",
        account: "gemini-1@google.com",
        remainingFraction: 0.95,
        resetAtMs: now + 5400000,
        resetTimeStr: formatShortDate(now + 5400000),
        resetCountdownStr: "4h 04m",
        statusColor: "#34C759",
      },
      {
        id: "demo-2",
        name: "Gemini 2.5 Pro",
        shortName: "Pro",
        provider: "Google AI",
        account: "gemini-2@google.com",
        remainingFraction: 0.88,
        resetAtMs: now + 10800000,
        resetTimeStr: formatShortDate(now + 10800000),
        resetCountdownStr: "4h 42m",
        statusColor: "#34C759",
      },
    ];
  }

  return snapshot.models.map((m) => {
    const fraction = Math.max(0, Math.min(1, m.remainingFraction ?? 1.0));
    const resetTimeStr = m.resetAtMs ? formatShortDate(m.resetAtMs) : formatShortDate(Date.now() + 18000000);
    const resetCountdownStr = formatCountdown(m.resetAtMs, fraction);
    return {
      id: m.id || m.name,
      name: m.name || "AI Model",
      shortName: m.shortName || m.name,
      provider: m.provider || "AI",
      account: m.account || "默认账号",
      remainingFraction: fraction,
      resetAtMs: m.resetAtMs,
      resetTimeStr,
      resetCountdownStr,
      statusColor: getQuotaColor(fraction),
    };
  });
}

function filterModels(models, param) {
  if (!param || !param.trim() || models.length === 0) return models;
  const p = param.trim().toLowerCase();
  const num = parseInt(p, 10);
  if (!isNaN(num) && num >= 1 && num <= models.length) {
    return [models[num - 1]];
  }
  const matched = models.filter(
    (m) =>
      m.name.toLowerCase().includes(p) ||
      m.provider.toLowerCase().includes(p) ||
      m.account.toLowerCase().includes(p)
  );
  return matched.length > 0 ? matched : models;
}

export default async function(ctx) {
  const family = ctx.widgetFamily || "systemMedium";
  const maskEmailEnabled = (ctx.env?.MASK_EMAIL || ctx.env?.MaskEmail || ctx.env?.mask_email || "false").toLowerCase() === "true";
  const filterParam = ctx.env?.FILTER || ctx.env?.Filter || ctx.env?.filter || "";

  let snapshot = await syncCLIProxyQuotaData(ctx);
  if (!snapshot || (snapshot.error && (!snapshot.models || snapshot.models.length === 0))) {
    snapshot = ctx.storage.getJSON("cliproxy_quota_snapshot") || snapshot;
  }

  const lastUpdated = snapshot?.lastUpdated || Date.now();
  const updateTimeStr = formatTimeOnly(lastUpdated);
  const updateDateStr = formatShortDate(lastUpdated);

  // 错误状态呈现
  if (snapshot?.error && (!snapshot.models || snapshot.models.length === 0)) {
    return renderErrorWidget(family, snapshot.error, updateTimeStr);
  }

  let models = getDisplayModels(snapshot);
  if (filterParam) {
    models = filterModels(models, filterParam);
  }

  if (family === "accessoryCircular") {
    return renderAccessoryCircular(models[0]);
  } else if (family === "accessoryRectangular") {
    return renderAccessoryRectangular(models[0]);
  } else if (family === "accessoryInline") {
    return renderAccessoryInline(models[0]);
  } else if (family === "systemSmall") {
    return renderSmallWidget(models[0], updateTimeStr);
  } else if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderLargeWidget(models, updateDateStr, maskEmailEnabled);
  } else {
    return renderMediumWidget(models, updateDateStr, maskEmailEnabled);
  }
}

// ---------------- UI 布局渲染器 ----------------

function renderSmallWidget(model, updateTime) {
  const usedPercent = Math.round((1 - model.remainingFraction) * 100);
  const remainPercent = Math.round(model.remainingFraction * 100);
  const badge = getBadgeConfig(model.provider, model.name);
  const resetTime = formatTimeOnly(model.resetAtMs);
  const progressSvg = createProgressBarSvg(model.remainingFraction, model.statusColor, 6);

  return {
    type: "widget",
    padding: 12,
    gap: 8,
    backgroundColor: { light: "#F2F2F7", dark: "#1C1C1E" },
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
              { type: "image", src: `sf-symbol:${badge.icon}`, width: 10, height: 10, color: "#FFFFFF" },
              { type: "text", text: badge.text, font: { size: 10, weight: "bold" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10 }, textColor: "#8E8E93" },
        ],
      },
      {
        type: "stack",
        direction: "column",
        gap: 8,
        padding: 10,
        backgroundColor: { light: "#FFFFFF", dark: "rgba(255,255,255,0.08)" },
        borderRadius: 12,
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
                  { type: "text", text: `${usedPercent}%`, font: { size: 16, weight: "heavy" }, textColor: { light: "#000000", dark: "#FFFFFF" } },
                ],
              },
              { type: "spacer" },
              {
                type: "stack",
                direction: "column",
                alignItems: "end",
                gap: 1,
                children: [
                  { type: "text", text: "剩余 (5h)", font: { size: 10 }, textColor: "#8E8E93" },
                  { type: "text", text: `${remainPercent}%`, font: { size: 16, weight: "heavy" }, textColor: model.statusColor },
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
              { type: "text", text: resetTime, font: { size: 10 }, textColor: "#8E8E93" },
              { type: "spacer" },
              { type: "text", text: formatCountdown(model.resetAtMs, model.remainingFraction), font: { size: 10, weight: "bold" }, textColor: model.statusColor },
            ],
          },
        ],
      },
    ],
  };
}

function renderMediumWidget(models, updateStr, maskEmailEnabled) {
  const isSingle = models.length === 1;
  const firstModel = models[0];
  const badge = getBadgeConfig(firstModel?.provider || "GOOGLE", firstModel?.name || "");

  if (isSingle && firstModel) {
    const usedPercent = Math.round((1 - firstModel.remainingFraction) * 100);
    const remainPercent = Math.round(firstModel.remainingFraction * 100);
    const accountText = maskEmail(firstModel.account && firstModel.account !== "默认账号" ? firstModel.account : firstModel.name, maskEmailEnabled);
    const progressSvg = createProgressBarSvg(firstModel.remainingFraction, firstModel.statusColor, 6);

    return {
      type: "widget",
      padding: [12, 14, 12, 14],
      gap: 8,
      backgroundColor: { light: "#F2F2F7", dark: "#1C1C1E" },
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
              padding: [3, 9, 3, 9],
              backgroundColor: badge.bg,
              borderRadius: 10,
              children: [
                { type: "image", src: `sf-symbol:${badge.icon}`, width: 11, height: 11, color: "#FFFFFF" },
                { type: "text", text: badge.text, font: { size: 11, weight: "bold" }, textColor: "#FFFFFF" },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 11 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
          ],
        },
        {
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [8, 12, 8, 12],
          backgroundColor: { light: "#FFFFFF", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          flex: 1,
          children: [
            { type: "text", text: accountText, font: { size: 12, weight: "bold" }, maxLines: 1 },
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
                    { type: "text", text: "已用", font: { size: 11 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
                    { type: "text", text: `${usedPercent}%`, font: { size: 14, weight: "heavy" }, textColor: { light: "#000000", dark: "#FFFFFF" } },
                  ],
                },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "text", text: "5h 剩余", font: { size: 11 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
                    { type: "text", text: `${remainPercent}%`, font: { size: 16, weight: "heavy" }, textColor: firstModel.statusColor },
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
                { type: "text", text: `重置 ${firstModel.resetTimeStr}`, font: { size: 10 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
                { type: "spacer" },
                { type: "text", text: `恢复倒计时 ${firstModel.resetCountdownStr}`, font: { size: 10, weight: "bold" }, textColor: firstModel.statusColor },
              ],
            },
          ],
        },
      ],
    };
  }

  const topTwo = models.slice(0, 2);
  return {
    type: "widget",
    padding: [12, 14, 12, 14],
    gap: 7,
    backgroundColor: { light: "#F2F2F7", dark: "#1C1C1E" },
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
            padding: [3, 9, 3, 9],
            backgroundColor: badge.bg,
            borderRadius: 10,
            children: [
              { type: "image", src: `sf-symbol:${badge.icon}`, width: 11, height: 11, color: "#FFFFFF" },
              { type: "text", text: badge.text, font: { size: 11, weight: "bold" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 11 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
        ],
      },
      ...topTwo.map((m) => {
        const remainPercent = Math.round(m.remainingFraction * 100);
        const accountText = maskEmail(m.account && m.account !== "默认账号" ? m.account : m.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(m.remainingFraction, m.statusColor, 5);

        return {
          type: "stack",
          direction: "column",
          gap: 3,
          padding: [6, 10, 6, 10],
          backgroundColor: { light: "#FFFFFF", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 10,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: accountText, font: { size: 11, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 3,
                  alignItems: "center",
                  children: [
                    { type: "image", src: "sf-symbol:circle.lefthalf.filled", width: 10, height: 10, color: m.statusColor },
                    { type: "text", text: `剩余 ${remainPercent}%`, font: { size: 10, weight: "bold" }, textColor: m.statusColor },
                  ],
                },
              ],
            },
            { type: "image", src: progressSvg, height: 5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${m.resetTimeStr}`, font: { size: 9 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
                { type: "spacer" },
                { type: "text", text: m.resetCountdownStr, font: { size: 9, weight: "semibold" }, textColor: m.statusColor },
              ],
            },
          ],
        };
      }),
    ],
  };
}

function renderLargeWidget(models, updateStr, maskEmailEnabled) {
  const firstModel = models[0];
  const badge = getBadgeConfig(firstModel?.provider || "GOOGLE", firstModel?.name || "");
  const topFour = models.slice(0, 4);

  return {
    type: "widget",
    padding: 16,
    gap: 10,
    backgroundColor: { light: "#F2F2F7", dark: "#1C1C1E" },
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
            padding: [3, 10, 3, 10],
            backgroundColor: badge.bg,
            borderRadius: 10,
            children: [
              { type: "image", src: `sf-symbol:${badge.icon}`, width: 12, height: 12, color: "#FFFFFF" },
              { type: "text", text: badge.text, font: { size: 12, weight: "bold" }, textColor: "#FFFFFF" },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 12 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
        ],
      },
      ...topFour.map((m) => {
        const remainPercent = Math.round(m.remainingFraction * 100);
        const accountText = maskEmail(m.account && m.account !== "默认账号" ? m.account : m.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(m.remainingFraction, m.statusColor, 6);

        return {
          type: "stack",
          direction: "column",
          gap: 6,
          padding: [10, 12, 10, 12],
          backgroundColor: { light: "#FFFFFF", dark: "rgba(255,255,255,0.08)" },
          borderRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: accountText, font: { size: 13, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "image", src: "sf-symbol:circle.lefthalf.filled", width: 12, height: 12, color: m.statusColor },
                    { type: "text", text: `剩余 ${remainPercent}%`, font: { size: 12, weight: "heavy" }, textColor: m.statusColor },
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
                { type: "text", text: `重置 ${m.resetTimeStr}`, font: { size: 10 }, textColor: { light: "#8E8E93", dark: "#8E8E93" } },
                { type: "spacer" },
                { type: "text", text: m.resetCountdownStr, font: { size: 10, weight: "bold" }, textColor: m.statusColor },
              ],
            },
          ],
        };
      }),
    ],
  };
}

function renderAccessoryCircular(model) {
  const remainPercent = Math.round((model?.remainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "stack",
        direction: "column",
        alignItems: "center",
        gap: 2,
        children: [
          { type: "image", src: "sf-symbol:sparkles", width: 14, height: 14 },
          { type: "text", text: `${remainPercent}%`, font: { size: 11, weight: "bold" } },
        ],
      },
    ],
  };
}

function renderAccessoryRectangular(model) {
  const remainPercent = Math.round((model?.remainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:sparkles", width: 12, height: 12 },
          { type: "text", text: model?.name || "Gemini 5h", font: { size: 12, weight: "bold" } },
        ],
      },
      {
        type: "text",
        text: `剩余 ${remainPercent}% · ${model?.resetCountdownStr || "恢复中"}`,
        font: { size: 11 },
      },
    ],
  };
}

function renderAccessoryInline(model) {
  const remainPercent = Math.round((model?.remainingFraction || 1.0) * 100);
  return {
    type: "widget",
    children: [
      {
        type: "text",
        text: `${model?.name || "Gemini"}: 5h余${remainPercent}% (${model?.resetCountdownStr || "OK"})`,
      },
    ],
  };
}

function renderErrorWidget(family, error, updateTime) {
  return {
    type: "widget",
    padding: 12,
    gap: 6,
    backgroundColor: { light: "#F2F2F7", dark: "#1C1C1E" },
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
              { type: "text", text: "CLIPROXY", font: { size: 10, weight: "bold" }, textColor: "#FFFFFF" },
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
        backgroundColor: { light: "#FFFFFF", dark: "rgba(255,255,255,0.08)" },
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
