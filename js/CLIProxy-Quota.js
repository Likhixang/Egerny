// ── CLIProxy 官方项目高清徽标 ──
const CLIPROXY_LOGO = "data:image/png;base64,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";

/*
 * CLIProxy Quota 配额监控 — Egern 新式小组件
 * 核心设计系统：
 *   - 官方精细 AI 品牌矢量徽标（Gemini、Claude、OpenAI、DeepSeek、Grok）
 *   - 纯正 Apple HIG 拟物磨砂玻璃卡片
 *   - 大组件 (systemLarge) 智能三阶自适应：
 *       1. 单账号：大字仪表盘 + 5h进度卡片 + 底部「重置机制 / 配额状态」双辅助看板
 *       2. 双账号：上下两块全高平衡大卡片
 *       3. 多账号：4 账号高密度看板列表
 *   - 适配主屏全部尺寸 (systemSmall, systemMedium, systemLarge)
 */

// ── 官方精细矢量徽标 (Lobe Icons 官方 SVG 提取) ──
const BRAND_ICONS = {
  cliproxy: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M4%205h16a2%202%200%200%201%202%202v2a2%202%200%200%201-2%202H4a2%202%200%200%201-2-2V7a2%202%200%200%201%202-2zm0%208h16a2%202%200%200%201%202%202v2a2%202%200%200%201-2%202H4a2%202%200%200%201-2-2v-2a2%202%200%200%201%202-2zm2-5h2v2H6V8zm0%208h2v2H6v-2zm12-8h-2v2h2V8zm0%208h-2v2h2v-2z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  antigravity: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M21.751%2022.607c1.34%201.005%203.35.335%201.508-1.508C17.73%2015.74%2018.904%201%2012.037%201%205.17%201%206.342%2015.74.815%2021.1c-2.01%202.009.167%202.511%201.507%201.506%205.192-3.517%204.857-9.714%209.715-9.714%204.857%200%204.522%206.197%209.714%209.715z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  gemini: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M20.616%2010.835a14.147%2014.147%200%2001-4.45-3.001%2014.111%2014.111%200%2001-3.678-6.452.503.503%200%2000-.975%200%2014.134%2014.134%200%2001-3.679%206.452%2014.155%2014.155%200%2001-4.45%203.001c-.65.28-1.318.505-2.002.678a.502.502%200%20000%20.975c.684.172%201.35.397%202.002.677a14.147%2014.147%200%20014.45%203.001%2014.112%2014.112%200%20013.679%206.453.502.502%200%2000.975%200c.172-.685.397-1.351.677-2.003a14.145%2014.145%200%20013.001-4.45%2014.113%2014.113%200%20016.453-3.678.503.503%200%20000-.975%2013.245%2013.245%200%2001-2.003-.678z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  claude: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M4.709%2015.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0%2011.784l.055-.352.48-.321.686.06%201.52.103%202.278.158%201.652.097%202.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686%201.908%201.476%202.491%201.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97%202.97%200%2001-.104-.729L6.283.134%206.696%200l.996.134.42.364.62%201.414%201.002%202.229%201.555%203.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286%201.851-.559%202.903-.364%201.942h.212l.243-.242.985-1.306%201.652-2.064.73-.82.85-.904.547-.431h1.033l.76%201.129-.34%201.166-1.064%201.347-.881%201.142-1.264%201.7-.79%201.36.073.11.188-.02%202.856-.606%201.543-.28%201.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061%201.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093%201.068%202.006%201.81%202.509%202.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649%202.345%203.521.122%201.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674%207.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434%201.967-2.18%202.945-1.726%201.845-.414.164-.717-.37.067-.662.401-.589%202.388-3.036%201.44-1.882.93-1.086-.006-.158h-.055L4.132%2018.56l-1.13.146-.487-.456.061-.746.231-.243%201.908-1.312-.006.006z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  openai: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M9.205%208.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357%201.356-.523%202.117-.523%202.854%200%204.662%202.212%204.662%204.566%200%20.167%200%20.357-.024.547l-4.71-2.759a.797.797%200%2000-.856%200l-5.97%203.473zm10.609%208.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473%201.95-1.118a.433.433%200%2001.476%200l4.543%202.617c1.309.76%202.189%202.378%202.189%203.948%200%201.808-1.07%203.473-2.76%204.163zM7.802%2012.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545%201.95-4.472%204.591-4.472%201%200%201.927.333%202.712.928L8.23%205.067c-.285.166-.428.404-.428.737v6.898zM12%2015.128l-2.795-1.57v-3.33L12%208.658l2.795%201.57v3.33L12%2015.128zm1.796%207.23c-1%200-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974%201.142c.167.095.238.238.238.428v5.233c0%202.545-1.974%204.472-4.614%204.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482%204.482%200%20014.21%206.327v5.423c0%20.333.143.571.428.738l5.947%203.449-1.95%201.118a.432.432%200%2001-.476%200zm-.262%203.9c-2.688%200-4.662-2.021-4.662-4.519%200-.19.024-.38.047-.57l4.686%202.71c.286.167.571.167.856%200l5.97-3.448v2.26c0%20.19-.07.333-.237.428l-4.543%202.616c-.619.357-1.356.523-2.117.523zm5.899%202.83a5.947%205.947%200%20005.827-4.756C22.287%2018.339%2024%2015.84%2024%2013.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498%200-3.401-2.759-5.947-5.946-5.947-.642%200-1.26.095-1.88.31A5.962%205.962%200%200010.205%200a5.947%205.947%200%2000-5.827%204.757C1.713%205.447%200%207.945%200%2010.49c0%201.666.713%203.283%201.998%204.448-.119.5-.19%201-.19%201.499%200%203.401%202.759%205.946%205.946%205.946.642%200%201.26-.095%201.88-.309a5.96%205.96%200%20004.162%201.713z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  deepseek: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M23.748%204.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434%201.202-.422%201.84.027%201.436.633%202.58%201.838%203.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526%205.526%200%2001-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365%2011.365%200%2000-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055%203.055%200%2001-.465.137%209.597%209.597%200%2000-2.883-.102c-1.885.21-3.39%201.102-4.497%202.623C.082%208.606-.231%2010.684.152%2012.85c.403%202.284%201.569%204.175%203.36%205.653%201.858%201.533%203.997%202.284%206.438%202.14%201.482-.085%203.133-.284%204.994-1.86.47.234.962.327%201.78.397.63.059%201.236-.03%201.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926%201.096-1.296%202.746-2.642%203.392-7.003.05-.347.007-.565%200-.845-.004-.17.035-.237.23-.256a4.173%204.173%200%20001.545-.475c1.396-.763%201.96-2.015%202.093-3.517.02-.23-.004-.467-.247-.588zM11.581%2018c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696%204.696%200%20011.529-.039c2.132.312%203.946%201.265%205.468%202.774.868.86%201.525%201.887%202.202%202.891.72%201.066%201.494%202.082%202.48%202.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306%200%2001.415-.287.302.302%200%2001.2.288.306.306%200%2001-.31.307.303.303%200%2001-.304-.308zm3.11%201.596c-.2.081-.399.151-.59.16a1.245%201.245%200%2001-.798-.254c-.274-.23-.47-.358-.552-.758a1.73%201.73%200%2001.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559%200%2001-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136%201.146.016.352.144.618.408%201.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E",
  grok: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M9.27%2015.29l7.978-5.897c.391-.29.95-.177%201.137.272.98%202.369.542%205.215-1.41%207.169-1.951%201.954-4.667%202.382-7.149%201.406l-2.711%201.257c3.889%202.661%208.611%202.003%2011.562-.953%202.341-2.344%203.066-5.539%202.388-8.42l.006.007c-.983-4.232.242-5.924%202.75-9.383.06-.082.12-.164.179-.248l-3.301%203.305v-.01L9.267%2015.292M7.623%2016.723c-2.792-2.67-2.31-6.801.071-9.184%201.761-1.763%204.647-2.483%207.166-1.425l2.705-1.25a7.808%207.808%200%2000-1.829-1A8.975%208.975%200%20005.984%205.83c-2.533%202.536-3.33%206.436-1.962%209.764%201.022%202.487-.653%204.246-2.34%206.022-.599.63-1.199%201.259-1.682%201.925l7.62-6.815%22%20fill%3D%22%23FFFFFF%22/%3E%3C/svg%3E"
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

function formatCountdown(resetAtMs, fallback = 1.0) {
  if (!resetAtMs || isNaN(resetAtMs)) {
    return fallback >= 0.99 ? "配额充沛" : "恢复中";
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

function getHeaderBadge(models) {
  if (!models || models.length === 0) {
    return { text: "CLIPROXY", svg: BRAND_ICONS.cliproxy, bg: "#007AFF" };
  }
  if (models.length === 1) {
    return getBadgeConfig(models[0].provider, models[0].name);
  }
  return {
    text: `CLIPROXY · ${models.length} 账号`,
    svg: BRAND_ICONS.cliproxy,
    bg: "#007AFF",
  };
}

function getBadgeConfig(provider, name) {
  const p = (provider || "").toUpperCase();
  const n = (name || "").toUpperCase();

  if (n.includes("ANTIGRAVITY") || p.includes("ANTIGRAVITY")) {
    return { text: "ANTIGRAVITY", svg: BRAND_ICONS.antigravity, bg: "#1A73E8", color: "#FFFFFF" };
  }
  if (n.includes("GOOGLE") || p.includes("GEMINI") || n.includes("GEMINI")) {
    return { text: "GEMINI", svg: BRAND_ICONS.gemini, bg: "#1A73E8", color: "#FFFFFF" };
  }
  if (n.includes("CLAUDE") || p.includes("CLAUDE")) {
    return { text: "CLAUDE", svg: BRAND_ICONS.claude, bg: "#D97706", color: "#FFFFFF" };
  }
  if (n.includes("DEEPSEEK") || p.includes("DEEPSEEK")) {
    return { text: "DEEPSEEK", svg: BRAND_ICONS.deepseek, bg: "#4D6BFE", color: "#FFFFFF" };
  }
  if (n.includes("GROK") || p.includes("GROK")) {
    return { text: "GROK", svg: BRAND_ICONS.grok, bg: "#151515", color: "#FFFFFF" };
  }
  if (n.includes("PLUS") || n.includes("CODEX") || p.includes("OPENAI") || n.includes("GPT")) {
    return { text: "OPENAI", svg: BRAND_ICONS.openai, bg: "#10A37F", color: "#FFFFFF" };
  }
  return { text: "AI", svg: BRAND_ICONS.gemini, bg: "#007AFF", color: "#FFFFFF" };
}

function createProgressBarSvg(fraction, color, height = 6) {
  const percent = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${height}' preserveAspectRatio='none'>
    <rect x='0' y='0' width='100' height='${height}' rx='${height / 2}' fill='rgba(120,120,128,0.18)'/>
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
      const isAntigravity = fileTypeLower.includes("antigravity") || fileNameLower.includes("antigravity");
      const isGeminiOAuth = fileTypeLower.includes("gemini") || fileNameLower.includes("gemini") || fileNameLower.includes("cloudcode");

      if (isAntigravity || isGeminiOAuth) {
        const detectedProvider = isAntigravity ? "Antigravity" : "Gemini";
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
                  provider: detectedProvider,
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
                window: "5h",
                isFullQuota: true,
                isSpark: false,
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

      // 3. OpenAI / Codex (ChatGPT wham/usage 深度解析: 周全额度 / 5h滚动额度 / Spark独立限额)
      if (
        fileTypeLower.includes("codex") ||
        fileTypeLower.includes("openai") ||
        fileNameLower.includes("codex") ||
        fileNameLower.includes("openai")
      ) {
        try {
          const reqBody = {
            authIndex,
            method: "GET",
            url: "https://chatgpt.com/backend-api/wham/usage",
            header: {
              Authorization: "Bearer $TOKEN$",
              "Content-Type": "application/json",
              "User-Agent": "codex_cli_rs/0.76.0 (Debian 13.0.0; x86_64) WindowsTerminal",
            },
          };
          const res = await fetchPostWithTimeout(ctx, `${baseUrl}/v0/management/api-call`, reqBody, { headers }, 4000);
          if (res && res.status === 200) {
            const data = await res.json();
            const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body || {};
            const rateLimit = body.rate_limit || body.rateLimit || {};
            const primary = rateLimit.primary_window || rateLimit.primaryWindow;
            const secondary = rateLimit.secondary_window || rateLimit.secondaryWindow;
            const additionals = Array.isArray(body.additional_rate_limits) ? body.additional_rate_limits : [];

            const hasBoth = Boolean(primary && secondary);

            // 解析主要窗口
            if (primary) {
              const usedPercent = Number(primary.used_percent ?? primary.usedPercent ?? 0);
              const remainingFraction = Math.max(0, Math.min(1, 1 - usedPercent / 100));
              let resetAtMs = null;
              if (primary.reset_at) {
                resetAtMs = typeof primary.reset_at === "number" ? primary.reset_at * 1000 : new Date(primary.reset_at).getTime();
              } else if (primary.reset_after_seconds) {
                resetAtMs = Date.now() + primary.reset_after_seconds * 1000;
              }
              const winSecs = Number(primary.limit_window_seconds || primary.window_seconds || 0);
              const isWeekly = winSecs > 0 ? winSecs >= 86400 * 2 : (hasBoth || !secondary);
              const is5hRolling = winSecs > 0 ? (winSecs < 86400 * 2) : !isWeekly;
              const resetTimeStr = resetAtMs ? (isWeekly ? formatShortDate(resetAtMs) : formatTimeOnly(resetAtMs)) : "--:--";
              const resetCountdownStr = formatCountdown(resetAtMs, remainingFraction);

              modelList.push({
                id: `codex-${authIndex}-primary`,
                name: isWeekly ? "Codex 7D" : "Codex 5H",
                shortName: isWeekly ? "7D" : "5H",
                provider: "Codex",
                account: accountLabel,
                window: isWeekly ? "7d" : "5h",
                isFullQuota: isWeekly || !hasBoth,
                isSpark: false,
                remainingFraction,
                resetAtMs,
                resetTimeStr,
                resetCountdownStr,
                statusColor: getQuotaColor(remainingFraction),
              });
            }

            // 解析次要窗口 (如 5h 滚动额度)
            if (secondary) {
              const usedPercent = Number(secondary.used_percent ?? secondary.usedPercent ?? 0);
              const remainingFraction = Math.max(0, Math.min(1, 1 - usedPercent / 100));
              let resetAtMs = null;
              if (secondary.reset_at) {
                resetAtMs = typeof secondary.reset_at === "number" ? secondary.reset_at * 1000 : new Date(secondary.reset_at).getTime();
              } else if (secondary.reset_after_seconds) {
                resetAtMs = Date.now() + secondary.reset_after_seconds * 1000;
              }
              const winSecs = Number(secondary.limit_window_seconds || secondary.window_seconds || 0);
              const isWeekly = winSecs >= 86400 * 2;
              const resetTimeStr = resetAtMs ? (isWeekly ? formatShortDate(resetAtMs) : formatTimeOnly(resetAtMs)) : "--:--";
              const resetCountdownStr = formatCountdown(resetAtMs, remainingFraction);

              modelList.push({
                id: `codex-${authIndex}-secondary`,
                name: isWeekly ? "Codex 7D" : "Codex 5H",
                shortName: isWeekly ? "7D" : "5H",
                provider: "Codex",
                account: accountLabel,
                window: isWeekly ? "7d" : "5h",
                isFullQuota: isWeekly,
                isSpark: false,
                remainingFraction,
                resetAtMs,
                resetTimeStr,
                resetCountdownStr,
                statusColor: getQuotaColor(remainingFraction),
              });
            }

            // 解析独立附加限额 (如 GPT-5.3-Codex-Spark)
            for (const addLimit of additionals) {
              const limitName = addLimit.limit_name || addLimit.limitName || "Spark";
              const addRate = addLimit.rate_limit || addLimit.rateLimit || addLimit;
              const addWin = addRate.primary_window || addRate.primaryWindow || addRate;
              if (addWin && addWin.used_percent !== undefined) {
                const usedPercent = Number(addWin.used_percent ?? 0);
                const remainingFraction = Math.max(0, Math.min(1, 1 - usedPercent / 100));
                let resetAtMs = null;
                if (addWin.reset_at) {
                  resetAtMs = typeof addWin.reset_at === "number" ? addWin.reset_at * 1000 : new Date(addWin.reset_at).getTime();
                } else if (addWin.reset_after_seconds) {
                  resetAtMs = Date.now() + addWin.reset_after_seconds * 1000;
                }
                const resetTimeStr = resetAtMs ? formatTimeOnly(resetAtMs) : "--:--";
                const resetCountdownStr = formatCountdown(resetAtMs, remainingFraction);

                modelList.push({
                  id: `codex-${authIndex}-${limitName.toLowerCase()}`,
                  name: "Spark 5H",
                  shortName: "Spark 5H",
                  provider: "Codex",
                  account: accountLabel,
                  window: "5h",
                  isFullQuota: false,
                  isSpark: true,
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

  if (family === "systemSmall") {
    // Small 小组件：非 Pro 优先展示 5小时滚动限制；Pro 展示周全额度；Antigravity/Claude 展示 5h 配额
    const shortModels = models.filter((m) => m.window === "5h" && !m.isSpark);
    const targetModel = shortModels.length > 0 ? shortModels[0] : models[0];
    return renderSmallWidget(targetModel, updateTimeStr);
  } else if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderLargeWidget(models, updateDateStr, maskEmailEnabled);
  } else {
    return renderMediumWidget(models, updateDateStr, maskEmailEnabled);
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

function renderSmallWidget(model, updateTime) {
  // 小尺寸小组件：Pro 展示周全额度；非 Pro 展示 5小时滚动短期额度
  const isWeekly = model.window === "7d";
  const usedPercent = Math.round((1 - model.remainingFraction) * 100);
  const remainPercent = Math.round(model.remainingFraction * 100);
  const mBadge = getBadgeConfig(model.provider, model.name);
  const resetTime = isWeekly ? (model.resetAtMs ? formatShortDate(model.resetAtMs) : "--/--") : formatTimeOnly(model.resetAtMs);
  const progressSvg = createProgressBarSvg(model.remainingFraction, model.statusColor, 6);
  const accountText = maskEmail(model.account && model.account !== "默认账号" ? model.account : model.name, true);
  const windowTag = isWeekly ? "7D" : (model.isSpark ? "Spark 5H" : "5H");

  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 12,
    gap: 8,
    children: [
      // 顶部 Header (CLIProxy 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: CLIPROXY_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "text", text: "CLIProxy", font: { size: "caption1", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          { type: "text", text: updateTime, font: { size: 10, weight: "medium" }, textColor: C.textTertiary },
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
          // 账号前微型徽标色条
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 4,
            children: [
              createMicroBadge(mBadge),
              { type: "text", text: accountText, font: { size: 11, weight: "bold" }, maxLines: 1 },
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
                  { type: "text", text: `${remainPercent}%`, font: { size: 16, weight: "heavy" }, textColor: model.statusColor },
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
              { type: "text", text: `重置 ${resetTime}`, font: { size: 9 }, textColor: C.textSecondary },
              { type: "spacer" },
              { type: "text", text: model.resetCountdownStr, font: { size: 9.5, weight: "bold" }, textColor: model.statusColor },
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

  if (isSingle && firstModel) {
    const mBadge = getBadgeConfig(firstModel.provider, firstModel.name);
    const usedPercent = Math.round((1 - firstModel.remainingFraction) * 100);
    const remainPercent = Math.round(firstModel.remainingFraction * 100);
    const accountText = maskEmail(firstModel.account && firstModel.account !== "默认账号" ? firstModel.account : firstModel.name, maskEmailEnabled);
    const progressSvg = createProgressBarSvg(firstModel.remainingFraction, firstModel.statusColor, 6);

    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [12, 14, 12, 14],
      gap: 8,
      children: [
        // 顶部 Header (CLIProxy 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CLIPROXY_LOGO, width: 15, height: 15, borderRadius: 3.5 },
            { type: "text", text: "CLIProxy 配额", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${models.length} 账号`, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
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
            // 账号前微型徽标色条
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              gap: 5,
              children: [
                createMicroBadge(mBadge),
                { type: "text", text: accountText, font: { size: 12, weight: "bold" }, maxLines: 1 },
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
                    { type: "text", text: `${usedPercent}%`, font: { size: 15, weight: "heavy" }, textColor: C.textPrimary },
                  ],
                },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 4,
                  alignItems: "center",
                  children: [
                    { type: "text", text: "5h 剩余", font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: `${remainPercent}%`, font: { size: 17, weight: "heavy" }, textColor: firstModel.statusColor },
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
                { type: "text", text: `重置 ${firstModel.resetTimeStr}`, font: { size: 10 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: `恢复倒计时 ${firstModel.resetCountdownStr}`, font: { size: 10, weight: "bold" }, textColor: firstModel.statusColor },
              ],
            },
          ],
        },
      ],
    };
  }

  // 双账号等高卡片排版
  const topTwo = models.slice(0, 2);
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [12, 14, 12, 14],
    gap: 7,
    children: [
      // 顶部 Header (CLIProxy 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: CLIPROXY_LOGO, width: 15, height: 15, borderRadius: 3.5 },
          { type: "text", text: "CLIProxy 配额", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: `${models.length} 账号`, font: { size: 9.5, weight: "bold" }, textColor: C.textSecondary },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: C.textSecondary },
        ],
      },
      ...topTwo.map((m) => {
        const mBadge = getBadgeConfig(m.provider, m.name);
        const remainPercent = Math.round(m.remainingFraction * 100);
        const accountText = maskEmail(m.account && m.account !== "默认账号" ? m.account : m.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(m.remainingFraction, m.statusColor, 5);

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
              gap: 5,
              children: [
                createMicroBadge(mBadge),
                { type: "text", text: accountText, font: { size: 11, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `余 ${remainPercent}%`,
                  font: { size: 11, weight: "heavy" },
                  textColor: m.statusColor,
                },
              ],
            },
            { type: "image", src: progressSvg, height: 5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${m.resetTimeStr}`, font: { size: 9 }, textColor: C.textSecondary },
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

// ── 大尺寸小组件 (systemLarge) 三阶排版 ──
function renderLargeWidget(models, updateStr, maskEmailEnabled) {
  const isSingle = models.length === 1;
  const isDual = models.length === 2;
  const firstModel = models[0];

  // 1. 单账号专属旗舰看板（大字仪表盘 + 底部重置机制与配额状态双卡片）
  if (isSingle && firstModel) {
    const mBadge = getBadgeConfig(firstModel.provider, firstModel.name);
    const usedPercent = Math.round((1 - firstModel.remainingFraction) * 100);
    const remainPercent = Math.round(firstModel.remainingFraction * 100);
    const accountText = maskEmail(firstModel.account && firstModel.account !== "默认账号" ? firstModel.account : firstModel.name, maskEmailEnabled);
    const progressSvg = createProgressBarSvg(firstModel.remainingFraction, firstModel.statusColor, 7);
    const statusDesc = remainPercent >= 50 ? "配额充沛" : remainPercent >= 20 ? "配额适中" : "即将耗尽";

    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [14, 16, 14, 16],
      gap: 12,
      children: [
        // 顶部 Header (CLIProxy 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CLIPROXY_LOGO, width: 16, height: 16, borderRadius: 4 },
            { type: "text", text: "CLIProxy 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${models.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        // 核心卡片容器
        {
          type: "stack",
          direction: "column",
          gap: 12,
          padding: [14, 14, 14, 14],
          backgroundColor: C.cardBg,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          borderRadius: 14,
          children: [
            {
              type: "stack",
              direction: "column",
              gap: 4,
              children: [
                {
                  type: "stack",
                  direction: "row",
                  alignItems: "center",
                  gap: 6,
                  children: [
                    createMicroBadge(mBadge),
                    { type: "text", text: accountText, font: { size: 16, weight: "heavy" }, maxLines: 1 },
                  ],
                },
                { type: "text", text: `${firstModel.provider} 5小时滚动配额`, font: { size: 11 }, textColor: C.textSecondary },
              ],
            },
            // 大数字仪表
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                {
                  type: "stack",
                  direction: "column",
                  gap: 2,
                  children: [
                    { type: "text", text: "已使用比例", font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: `${usedPercent}%`, font: { size: 22, weight: "heavy" }, textColor: C.textPrimary },
                  ],
                },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "column",
                  alignItems: "end",
                  gap: 2,
                  children: [
                    { type: "text", text: "5h 剩余配额", font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: `${remainPercent}%`, font: { size: 22, weight: "heavy" }, textColor: firstModel.statusColor },
                  ],
                },
              ],
            },
            // 粗进度条
            { type: "image", src: progressSvg, height: 7 },
            // 底部时间
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置时间 ${firstModel.resetTimeStr}`, font: { size: 11 }, textColor: C.textSecondary },
                { type: "spacer" },
                {
                  type: "stack",
                  direction: "row",
                  gap: 3,
                  alignItems: "center",
                  children: [
                    { type: "text", text: "恢复倒计时", font: { size: 11 }, textColor: C.textSecondary },
                    { type: "text", text: firstModel.resetCountdownStr, font: { size: 11, weight: "bold" }, textColor: firstModel.statusColor },
                  ],
                },
              ],
            },
          ],
        },
        // 底部双卡片辅助看板 (左右等宽对称)
        {
          type: "stack",
          direction: "row",
          gap: 10,
          children: [
            {
              type: "stack",
              direction: "column",
              gap: 4,
              padding: [10, 12, 10, 12],
              backgroundColor: C.cardBg,
              borderWidth: 0.5,
              borderColor: C.cardBorder,
              borderRadius: 12,
              flex: 1,
              children: [
                { type: "text", text: "配额重置机制", font: { size: 11 }, textColor: C.textSecondary },
                { type: "text", text: "5小时滚动恢复", font: { size: 14, weight: "bold" } },
              ],
            },
            {
              type: "stack",
              direction: "column",
              gap: 4,
              padding: [10, 12, 10, 12],
              backgroundColor: C.cardBg,
              borderWidth: 0.5,
              borderColor: C.cardBorder,
              borderRadius: 12,
              flex: 1,
              children: [
                { type: "text", text: "当前配额状态", font: { size: 11 }, textColor: C.textSecondary },
                { type: "text", text: statusDesc, font: { size: 14, weight: "bold" }, textColor: firstModel.statusColor },
              ],
            },
          ],
        },
      ],
    };
  }

  // 2. 双账号专属双大卡片排版（完美填满高度）
  if (isDual) {
    return {
      type: "widget",
      backgroundColor: C.widgetBg,
      padding: [14, 16, 14, 16],
      gap: 12,
      children: [
        // 顶部 Header (CLIProxy 官方 Logo)
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 6,
          children: [
            { type: "image", src: CLIPROXY_LOGO, width: 16, height: 16, borderRadius: 4 },
            { type: "text", text: "CLIProxy 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
            {
              type: "stack",
              padding: [2, 5],
              borderRadius: 4,
              backgroundColor: C.cardBg,
              children: [
                { type: "text", text: `${models.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        ...models.map((m) => {
          const mBadge = getBadgeConfig(m.provider, m.name);
          const usedPercent = Math.round((1 - m.remainingFraction) * 100);
          const remainPercent = Math.round(m.remainingFraction * 100);
          const accountText = maskEmail(m.account && m.account !== "默认账号" ? m.account : m.name, maskEmailEnabled);
          const progressSvg = createProgressBarSvg(m.remainingFraction, m.statusColor, 6);

          return {
            type: "stack",
            direction: "column",
            gap: 10,
            padding: [14, 14, 14, 14],
            backgroundColor: C.cardBg,
            borderWidth: 0.5,
            borderColor: C.cardBorder,
            borderRadius: 14,
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
                      createMicroBadge(mBadge),
                      {
                        type: "stack",
                        direction: "column",
                        gap: 1,
                        children: [
                          { type: "text", text: accountText, font: { size: 13.5, weight: "heavy" }, maxLines: 1 },
                          { type: "text", text: `${m.provider} 5小时滚动配额`, font: { size: 9.5 }, textColor: C.textSecondary },
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
                      { type: "text", text: `剩余 ${remainPercent}%`, font: { size: 16, weight: "heavy" }, textColor: m.statusColor },
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
                  { type: "text", text: `重置 ${m.resetTimeStr}`, font: { size: 10 }, textColor: C.textSecondary },
                  { type: "spacer" },
                  {
                    type: "stack",
                    direction: "row",
                    gap: 2,
                    alignItems: "center",
                    children: [
                      { type: "text", text: "恢复倒计时", font: { size: 10 }, textColor: C.textSecondary },
                      { type: "text", text: m.resetCountdownStr, font: { size: 10, weight: "bold" }, textColor: m.statusColor },
                    ],
                  },
                ],
              },
            ],
          };
        }),
      ],
    };
  }

  // 3. 3~4 个多账号紧凑列表
  const topFour = models.slice(0, 4);
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [14, 16, 14, 16],
    gap: 9,
    children: [
      // 顶部 Header (CLIProxy 官方 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: CLIPROXY_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "text", text: "CLIProxy 配额监控", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: `${models.length} 账号`, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
            ],
          },
          { type: "spacer" },
          { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
        ],
      },
      ...topFour.map((m) => {
        const mBadge = getBadgeConfig(m.provider, m.name);
        const remainPercent = Math.round(m.remainingFraction * 100);
        const accountText = maskEmail(m.account && m.account !== "默认账号" ? m.account : m.name, maskEmailEnabled);
        const progressSvg = createProgressBarSvg(m.remainingFraction, m.statusColor, 5.5);

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
                createMicroBadge(mBadge),
                { type: "text", text: accountText, font: { size: 11.5, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `余 ${remainPercent}%`,
                  font: { size: 11.5, weight: "heavy" },
                  textColor: m.statusColor,
                },
              ],
            },
            { type: "image", src: progressSvg, height: 5.5 },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                { type: "text", text: `重置 ${m.resetTimeStr}`, font: { size: 9.5 }, textColor: C.textSecondary },
                { type: "spacer" },
                { type: "text", text: m.resetCountdownStr, font: { size: 9.5, weight: "bold" }, textColor: m.statusColor },
              ],
            },
          ],
        };
      }),
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
          { type: "image", src: CLIPROXY_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "text", text: "CLIProxy", font: { size: 11, weight: "bold" }, textColor: C.textPrimary },
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