/*
 * CLIProxy Quota 额度监控 — Egern 新式小组件
 * 核心设计系统：
 *   - 官方精细 AI 品牌矢量徽标（Gemini、Claude、OpenAI、DeepSeek、Grok）
 *   - 纯正 Apple HIG 拟物磨砂玻璃卡片
 *   - 大组件 (systemLarge) 智能三阶自适应：
 *       1. 单账号：大字仪表盘 + 5h进度卡片 + 底部「重置机制 / 配额状态」双辅助看板
 *       2. 双账号：上下两块全高平衡大卡片
 *       3. 多账号：4 账号高密度看板列表
 *   - 适配全部主屏与锁屏尺寸 (systemSmall, systemMedium, systemLarge, accessory*)
 */

// ── 官方精细矢量徽标 (Lobe Icons 官方 SVG 提取) ──
const BRAND_ICONS = {
  gemini: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M20.616%2010.835a14.147%2014.147%200%2001-4.45-3.001%2014.111%2014.111%200%2001-3.678-6.452.503.503%200%2000-.975%200%2014.134%2014.134%200%2001-3.679%206.452%2014.155%2014.155%200%2001-4.45%203.001c-.65.28-1.318.505-2.002.678a.502.502%200%20000%20.975c.684.172%201.35.397%202.002.677a14.147%2014.147%200%20014.45%203.001%2014.112%2014.112%200%20013.679%206.453.502.502%200%2000.975%200c.172-.685.397-1.351.677-2.003a14.145%2014.145%200%20013.001-4.45%2014.113%2014.113%200%20016.453-3.678.503.503%200%20000-.975%2013.245%2013.245%200%2001-2.003-.678z%22%20fill%3D%22%233186FF%22/%3E%3Cpath%20d%3D%22M20.616%2010.835a14.147%2014.147%200%2001-4.45-3.001%2014.111%2014.111%200%2001-3.678-6.452.503.503%200%2000-.975%200%2014.134%2014.134%200%2001-3.679%206.452%2014.155%2014.155%200%2001-4.45%203.001c-.65.28-1.318.505-2.002.678a.502.502%200%20000%20.975c.684.172%201.35.397%202.002.677a14.147%2014.147%200%20014.45%203.001%2014.112%2014.112%200%20013.679%206.453.502.502%200%2000.975%200c.172-.685.397-1.351.677-2.003a14.145%2014.145%200%20013.001-4.45%2014.113%2014.113%200%20016.453-3.678.503.503%200%20000-.975%2013.245%2013.245%200%2001-2.003-.678z%22%20fill%3D%22url%28%23g0%29%22/%3E%3Cpath%20d%3D%22M20.616%2010.835a14.147%2014.147%200%2001-4.45-3.001%2014.111%2014.111%200%2001-3.678-6.452.503.503%200%2000-.975%200%2014.134%2014.134%200%2001-3.679%206.452%2014.155%2014.155%200%2001-4.45%203.001c-.65.28-1.318.505-2.002.678a.502.502%200%20000%20.975c.684.172%201.35.397%202.002.677a14.147%2014.147%200%20014.45%203.001%2014.112%2014.112%200%20013.679%206.453.502.502%200%2000.975%200c.172-.685.397-1.351.677-2.003a14.145%2014.145%200%20013.001-4.45%2014.113%2014.113%200%20016.453-3.678.503.503%200%20000-.975%2013.245%2013.245%200%2001-2.003-.678z%22%20fill%3D%22url%28%23g1%29%22/%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g0%22%20x1%3D%227%22%20y1%3D%2215.5%22%20x2%3D%2211%22%20y2%3D%2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%2308B962%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2308B962%22%20stop-opacity%3D%220%22/%3E%3C/linearGradient%3E%3ClinearGradient%20id%3D%22g1%22%20x1%3D%228%22%20y1%3D%225.5%22%20x2%3D%2211.5%22%20y2%3D%2211%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23F94543%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23F94543%22%20stop-opacity%3D%220%22/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
  claude: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M4.709%2015.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0%2011.784l.055-.352.48-.321.686.06%201.52.103%202.278.158%201.652.097%202.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686%201.908%201.476%202.491%201.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97%202.97%200%2001-.104-.729L6.283.134%206.696%200l.996.134.42.364.62%201.414%201.002%202.229%201.555%203.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286%201.851-.559%202.903-.364%201.942h.212l.243-.242.985-1.306%201.652-2.064.73-.82.85-.904.547-.431h1.033l.76%201.129-.34%201.166-1.064%201.347-.881%201.142-1.264%201.7-.79%201.36.073.11.188-.02%202.856-.606%201.543-.28%201.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061%201.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093%201.068%202.006%201.81%202.509%202.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649%202.345%203.521.122%201.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674%207.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434%201.967-2.18%202.945-1.726%201.845-.414.164-.717-.37.067-.662.401-.589%202.388-3.036%201.44-1.882.93-1.086-.006-.158h-.055L4.132%2018.56l-1.13.146-.487-.456.061-.746.231-.243%201.908-1.312-.006.006z%22%20fill%3D%22%23D97757%22/%3E%3C/svg%3E",
  openai: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M9.205%208.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357%201.356-.523%202.117-.523%202.854%200%204.662%202.212%204.662%204.566%200%20.167%200%20.357-.024.547l-4.71-2.759a.797.797%200%2000-.856%200l-5.97%203.473zm10.609%208.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473%201.95-1.118a.433.433%200%2001.476%200l4.543%202.617c1.309.76%202.189%202.378%202.189%203.948%200%201.808-1.07%203.473-2.76%204.163zM7.802%2012.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545%201.95-4.472%204.591-4.472%201%200%201.927.333%202.712.928L8.23%205.067c-.285.166-.428.404-.428.737v6.898zM12%2015.128l-2.795-1.57v-3.33L12%208.658l2.795%201.57v3.33L12%2015.128zm1.796%207.23c-1%200-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974%201.142c.167.095.238.238.238.428v5.233c0%202.545-1.974%204.472-4.614%204.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482%204.482%200%20014.21%206.327v5.423c0%20.333.143.571.428.738l5.947%203.449-1.95%201.118a.432.432%200%2001-.476%200zm-.262%203.9c-2.688%200-4.662-2.021-4.662-4.519%200-.19.024-.38.047-.57l4.686%202.71c.286.167.571.167.856%200l5.97-3.448v2.26c0%20.19-.07.333-.237.428l-4.543%202.616c-.619.357-1.356.523-2.117.523zm5.899%202.83a5.947%205.947%200%20005.827-4.756C22.287%2018.339%2024%2015.84%2024%2013.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498%200-3.401-2.759-5.947-5.946-5.947-.642%200-1.26.095-1.88.31A5.962%205.962%200%200010.205%200a5.947%205.947%200%2000-5.827%204.757C1.713%205.447%200%207.945%200%2010.49c0%201.666.713%203.283%201.998%204.448-.119.5-.19%201-.19%201.499%200%203.401%202.759%205.946%205.946%205.946.642%200%201.26-.095%201.88-.309a5.96%205.96%200%20004.162%201.713z%22%20fill%3D%22%2310A37F%22/%3E%3C/svg%3E",
  deepseek: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M23.748%204.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434%201.202-.422%201.84.027%201.436.633%202.58%201.838%203.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526%205.526%200%2001-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365%2011.365%200%2000-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055%203.055%200%2001-.465.137%209.597%209.597%200%2000-2.883-.102c-1.885.21-3.39%201.102-4.497%202.623C.082%208.606-.231%2010.684.152%2012.85c.403%202.284%201.569%204.175%203.36%205.653%201.858%201.533%203.997%202.284%206.438%202.14%201.482-.085%203.133-.284%204.994-1.86.47.234.962.327%201.78.397.63.059%201.236-.03%201.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926%201.096-1.296%202.746-2.642%203.392-7.003.05-.347.007-.565%200-.845-.004-.17.035-.237.23-.256a4.173%204.173%200%20001.545-.475c1.396-.763%201.96-2.015%202.093-3.517.02-.23-.004-.467-.247-.588zM11.581%2018c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696%204.696%200%20011.529-.039c2.132.312%203.946%201.265%205.468%202.774.868.86%201.525%201.887%202.202%202.891.72%201.066%201.494%202.082%202.48%202.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306%200%2001.415-.287.302.302%200%2001.2.288.306.306%200%2001-.31.307.303.303%200%2001-.304-.308zm3.11%201.596c-.2.081-.399.151-.59.16a1.245%201.245%200%2001-.798-.254c-.274-.23-.47-.358-.552-.758a1.73%201.73%200%2001.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559%200%2001-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136%201.146.016.352.144.618.408%201.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z%22%20fill%3D%22%234D6BFE%22/%3E%3C/svg%3E",
  grok: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2024%2024%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M9.27%2015.29l7.978-5.897c.391-.29.95-.177%201.137.272.98%202.369.542%205.215-1.41%207.169-1.951%201.954-4.667%202.382-7.149%201.406l-2.711%201.257c3.889%202.661%208.611%202.003%2011.562-.953%202.341-2.344%203.066-5.539%202.388-8.42l.006.007c-.983-4.232.242-5.924%202.75-9.383.06-.082.12-.164.179-.248l-3.301%203.305v-.01L9.267%2015.292M7.623%2016.723c-2.792-2.67-2.31-6.801.071-9.184%201.761-1.763%204.647-2.483%207.166-1.425l2.705-1.25a7.808%207.808%200%2000-1.829-1A8.975%208.975%200%20005.984%205.83c-2.533%202.536-3.33%206.436-1.962%209.764%201.022%202.487-.653%204.246-2.34%206.022-.599.63-1.199%201.259-1.682%201.925l7.62-6.815%22%20fill%3D%22%23111111%22/%3E%3C/svg%3E"
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

// ── 设计系统色彩规范 (纯白 #FFFFFF & 纯黑 #151515) ──
const C = {
  textPrimary: { light: "#151515", dark: "#FFFFFF" },
  textSecondary: { light: "#666666", dark: "#AAAAAA" },
  textTertiary: { light: "#888888", dark: "#888888" },
  cardBg: { light: "#FFFFFF", dark: "#151515" },
  cardBorder: { light: "rgba(21, 21, 21, 0.08)", dark: "rgba(255, 255, 255, 0.12)" },
};

// ── HIG 拟物卡片式布局 ──

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
          { type: "text", text: updateTime, font: { size: 10, weight: "medium" }, textColor: C.textTertiary },
        ],
      },
      {
        type: "stack",
        direction: "column",
        gap: 8,
        padding: 10,
        backgroundColor: C.cardBg,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
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
                  { type: "text", text: "已用", font: { size: 10 }, textColor: C.textSecondary },
                  { type: "text", text: `${usedPercent}%`, font: { size: 17, weight: "heavy" }, textColor: C.textPrimary },
                ],
              },
              { type: "spacer" },
              {
                type: "stack",
                direction: "column",
                alignItems: "end",
                gap: 1,
                children: [
                  { type: "text", text: "剩余 (5h)", font: { size: 10 }, textColor: C.textSecondary },
                  { type: "text", text: `${remainPercent}%`, font: { size: 17, weight: "heavy" }, textColor: model.statusColor },
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
              { type: "text", text: `重置 ${resetTime}`, font: { size: 9 }, textColor: C.textSecondary },
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
            { type: "text", text: `更新 ${updateStr}`, font: { size: 11, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
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

  const topTwo = models.slice(0, 2);
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
              children: [
                { type: "image", src: mBadge.svg, width: 11, height: 11 },
                { type: "text", text: ` ${accountText}`, font: { size: 11, weight: "bold" }, maxLines: 1 },
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
  const badge = getBadgeConfig(firstModel?.provider || "GOOGLE", firstModel?.name || "");

  // 1. 单账号专属旗舰看板（大字仪表盘 + 底部重置机制与配额状态双卡片）
  if (isSingle && firstModel) {
    const usedPercent = Math.round((1 - firstModel.remainingFraction) * 100);
    const remainPercent = Math.round(firstModel.remainingFraction * 100);
    const accountText = maskEmail(firstModel.account && firstModel.account !== "默认账号" ? firstModel.account : firstModel.name, maskEmailEnabled);
    const progressSvg = createProgressBarSvg(firstModel.remainingFraction, firstModel.statusColor, 7);
    const statusDesc = remainPercent >= 50 ? "额度充沛" : remainPercent >= 20 ? "额度适中" : "即将耗尽";

    return {
      type: "widget",
      padding: [14, 16, 14, 16],
      gap: 12,
      children: [
        // 顶部 Header
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
              padding: [3.5, 10, 3.5, 10],
              backgroundColor: badge.bg,
              borderRadius: 11,
              children: [
                { type: "image", src: badge.svg, width: 14, height: 14 },
                { type: "text", text: badge.text, font: { size: 12, weight: "heavy" }, textColor: "#FFFFFF" },
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
              gap: 2,
              children: [
                { type: "text", text: accountText, font: { size: 17, weight: "heavy" }, maxLines: 1 },
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
      padding: [14, 16, 14, 16],
      gap: 12,
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
              padding: [3.5, 10, 3.5, 10],
              backgroundColor: badge.bg,
              borderRadius: 11,
              children: [
                { type: "image", src: badge.svg, width: 14, height: 14 },
                { type: "text", text: badge.text, font: { size: 12, weight: "heavy" }, textColor: "#FFFFFF" },
              ],
            },
            { type: "spacer" },
            { type: "text", text: `更新 ${updateStr}`, font: { size: 12, weight: "medium" }, textColor: C.textSecondary },
          ],
        },
        ...models.map((m) => {
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
                    direction: "column",
                    gap: 1,
                    children: [
                      { type: "text", text: accountText, font: { size: 14, weight: "heavy" }, maxLines: 1 },
                      { type: "text", text: `${m.provider} 5小时滚动配额`, font: { size: 10 }, textColor: C.textSecondary },
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
    padding: [14, 16, 14, 16],
    gap: 9,
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
            padding: [3.5, 10, 3.5, 10],
            backgroundColor: badge.bg,
            borderRadius: 11,
            children: [
              { type: "image", src: badge.svg, width: 14, height: 14 },
              { type: "text", text: badge.text, font: { size: 12, weight: "heavy" }, textColor: "#FFFFFF" },
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
              children: [
                { type: "image", src: mBadge.svg, width: 12, height: 12 },
                { type: "text", text: `  ${accountText}`, font: { size: 12, weight: "bold" }, maxLines: 1 },
                { type: "spacer" },
                {
                  type: "text",
                  text: `余 ${remainPercent}%`,
                  font: { size: 12, weight: "heavy" },
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
