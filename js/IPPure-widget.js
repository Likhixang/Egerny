/*
 * IP 纯净度检测 — Egern 新式小组件
 * 设计系统：Apple HIG 现代轻量化多源安全情报看板
 *   - 并列数据源：IPPure (原生属性/欺诈分) + IPLogs (纯净评分/Verdict) + ip-api (设施评分/代理校验)
 *   - 规范：完全杜绝 Emoji，采用 Apple SF Symbol 与纯净排版；移除沉重灰底遮罩，还原通透轻盈质感
 *   - 适配主屏全尺寸：Small (三源指标流), Medium (三源并列看板), Large (全功能矩阵看板)
 */

const IPPURE_LOGO = "data:image/png;base64,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";

export default async function(ctx) {
  const markIP = (ctx.env?.MarkIP || ctx.env?.mark_ip || "false").toLowerCase() === "true";

  // 1. IPPure 主请求
  let ippureData = null;
  try {
    const resp = await ctx.http.get("https://my.ippure.com/v1/info", { timeout: 7000 });
    ippureData = await resp.json();
  } catch (e) {
    ippureData = null;
  }

  const primaryIp = ippureData?.ip;

  // 2. 并发查询各源
  const [ipApiRes, iplogsRes] = await Promise.allSettled([
    (async () => {
      const url = primaryIp
        ? `http://ip-api.com/json/${primaryIp}?fields=status,country,regionName,city,isp,org,as,proxy,hosting,query`
        : "http://ip-api.com/json/?fields=status,country,regionName,city,isp,org,as,proxy,hosting,query";
      const resp = await ctx.http.get(url, { timeout: 6000 });
      return await resp.json();
    })(),
    (async () => {
      const payload = primaryIp ? { ip: primaryIp } : {};
      const resp = await ctx.http.post("https://iplogs.com/v1/check", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeout: 6500
      });
      return await resp.json();
    })()
  ]);

  const ipApiData = ipApiRes.status === "fulfilled" ? ipApiRes.value : null;
  const iplogsData = iplogsRes.status === "fulfilled" ? iplogsRes.value : null;

  if (!ippureData && !ipApiData && !iplogsData) {
    return renderErrorWidget(ctx.widgetFamily, "所有数据源请求失败");
  }

  // ── 基础数据规范化 ──
  const ip = ippureData?.ip || ipApiData?.query || iplogsData?.ip_info?.ip || "N/A";
  const isIPv6 = ip.includes(":");
  const ipVer = isIPv6 ? "IPv6" : "IPv4";
  const displayIP = markIP ? maskIP(ip) : ip;

  // 1. IPPure 数据
  const rawFraudScore = typeof ippureData?.fraudScore === "number" ? ippureData.fraudScore : null;
  const ippureScore = rawFraudScore !== null ? Math.max(0, Math.min(100, 100 - rawFraudScore)) : null;
  const isResidential = ippureData?.isResidential === true;
  const ipType = rawFraudScore !== null ? (isResidential ? "住宅原生" : "数据中心") : "未知类型";
  const broadcastText = ippureData?.isBroadcast === true ? "广播 IP" : (ippureData?.isBroadcast === false ? "本地分配" : "标准网络");

  // 2. IPLogs 数据 (0~1 风险分转为 0~100 纯净分)
  const iplogsRawScore = typeof iplogsData?.score === "number" ? iplogsData.score : null;
  const iplogsPurity = iplogsRawScore !== null ? Math.round((1 - iplogsRawScore) * 100) : null;
  const iplogsVerdict = iplogsData?.verdict || (iplogsData?.is_vpn ? "vpn" : (iplogsData?.is_proxy ? "proxy" : ""));
  const iplogsVerdictText = iplogsVerdict === "clean" ? "Clean 纯净" : (iplogsVerdict === "suspicious" ? "可疑网络" : (iplogsVerdict === "vpn_detected" ? "检测到 VPN" : "正常网络"));

  // 3. ip-api 数据与标准换算评分
  const ipApiProxy = ipApiData?.proxy === true;
  const ipApiHosting = ipApiData?.hosting === true;
  let ipApiScore = null;
  let ipApiScoreText = "N/A";
  let ipApiVerdict = "不可用";

  if (ipApiData && ipApiData.status === "success") {
    if (ipApiProxy) {
      ipApiScore = 30;
      ipApiScoreText = "30+";
      ipApiVerdict = "代理节点";
    } else if (ipApiHosting) {
      ipApiScore = 70;
      ipApiScoreText = "70+";
      ipApiVerdict = "数据中心";
    } else {
      ipApiScore = 95;
      ipApiScoreText = "95+";
      ipApiVerdict = "住宅原生";
    }
  }

  // 4. 综合纯净度评分计算 (加权计算)
  let validScores = [];
  if (ippureScore !== null) validScores.push({ score: ippureScore, weight: 0.5 });
  if (iplogsPurity !== null) validScores.push({ score: iplogsPurity, weight: 0.35 });
  if (ipApiScore !== null) validScores.push({ score: ipApiScore, weight: 0.15 });

  const overallPurity = validScores.length > 0
    ? Math.round(validScores.reduce((sum, item) => sum + item.score * item.weight, 0) / validScores.reduce((sum, item) => sum + item.weight, 0))
    : 100;
  const overallLevel = getPurityLevel(overallPurity);

  // 网络与地理归属 (优雅搭配原生国旗与排版)
  const asnNumber = ippureData?.asn ? `AS${ippureData.asn}` : (ipApiData?.as ? ipApiData.as.split(" ")[0] : (iplogsData?.ip_info?.asn || "AS --"));
  const asnOrg = (ippureData?.asOrganization || ipApiData?.isp || iplogsData?.ip_info?.org || "").trim();
  const countryCode = (ippureData?.countryCode || ipApiData?.countryCode || iplogsData?.ip_info?.country_code || "").toUpperCase();
  const city = ippureData?.city || ipApiData?.city || iplogsData?.ip_info?.city || "";
  const country = ippureData?.country || ipApiData?.country || iplogsData?.ip_info?.country || "";
  const flag = flagEmoji(countryCode);
  const locShort = [flag, city || country, countryCode].filter(Boolean).join(" ").trim() || "未知位置";
  const locFull = [flag, city, country, countryCode ? `(${countryCode})` : ""].filter(Boolean).join(" ").trim() || "未知位置";

  const family = ctx.widgetFamily || "systemMedium";

  if (family === "systemSmall") {
    return renderSystemSmall({
      displayIP,
      ipVer,
      locShort,
      overallPurity,
      overallLevel,
      ippureScore,
      iplogsPurity,
      ipApiScoreText,
      ipType,
      iplogsVerdictText,
      ipApiVerdict,
      asnNumber
    });
  }

  if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderSystemLarge({
      displayIP,
      ipVer,
      locFull,
      countryCode,
      asnNumber,
      asnOrg,
      overallPurity,
      overallLevel,
      ippureScore,
      rawFraudScore,
      ipType,
      broadcastText,
      iplogsPurity,
      iplogsVerdictText,
      iplogsType: iplogsData?.ip_info?.type || (iplogsData?.is_vpn ? "VPN" : (iplogsData?.is_proxy ? "Proxy" : "ISP")),
      ipApiScoreText,
      ipApiVerdict,
      ipApiProxy,
      ipApiHosting,
      ipApiIsp: ipApiData?.isp || asnOrg
    });
  }

  // 默认：systemMedium 中尺寸 (通透无大灰底三源并列看板)
  return renderSystemMedium({
    displayIP,
    ipVer,
    locShort,
    asnNumber,
    asnOrg,
    overallPurity,
    overallLevel,
    ippureScore,
    rawFraudScore,
    ipType,
    broadcastText,
    iplogsPurity,
    iplogsVerdictText,
    ipApiScoreText,
    ipApiVerdict,
    ipApiProxy,
    ipApiHosting
  });
}

// ── 设计系统色彩规范 (Apple HIG 优雅微遮罩) ──
const C = {
  textPrimary: { light: "#151515", dark: "#FFFFFF" },
  textSecondary: { light: "#6E6E73", dark: "#98989D" },
  textTertiary: { light: "#8E8E93", dark: "#636366" },

  widgetBg: { light: "#FFFFFF", dark: "#151515" },
  cardBg: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
  cardBorder: { light: "rgba(0, 0, 0, 0.06)", dark: "rgba(255, 255, 255, 0.08)" },
  pillBg: { light: "rgba(0, 0, 0, 0.05)", dark: "rgba(255, 255, 255, 0.10)" }
};

/**
 * 主屏幕 Small 小尺寸 (2x2): 极简通透排版，无厚重大灰底
 */
function renderSystemSmall(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 12,
    children: [
      // 1. 顶部 Header
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: IPPURE_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "spacer", length: 5 },
          { type: "text", text: "IP纯净度", font: { size: "caption1", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          createPillBadge(`${d.overallPurity}分`, d.overallLevel.color, d.overallLevel.badgeBg, d.overallLevel.icon)
        ]
      },

      { type: "spacer", length: 5 },

      // 2. IP 与归属地及网络展示 (独立卡片容器框住，整体完美居中)
      {
        type: "stack",
        direction: "column",
        alignItems: "center",
        gap: 2,
        padding: [6, 8, 6, 8],
        backgroundColor: C.cardBg,
        borderRadius: 9,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 15, weight: "heavy" },
            textColor: C.textPrimary,
            maxLines: 1
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 4,
            children: [
              { type: "image", src: "sf-symbol:mappin.and.ellipse", color: C.textTertiary, width: 9, height: 9 },
              {
                type: "text",
                text: d.locShort,
                font: { size: 9, weight: "medium" },
                textColor: C.textSecondary,
                maxLines: 1
              }
            ]
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 4,
            children: [
              { type: "image", src: "sf-symbol:network", color: C.textTertiary, width: 8, height: 8 },
              {
                type: "text",
                text: d.asnOrg ? `${d.asnNumber} · ${d.asnOrg}` : d.asnNumber,
                font: { size: 8, weight: "medium" },
                textColor: C.textTertiary,
                maxLines: 1
              }
            ]
          }
        ]
      },

      { type: "spacer", length: 5 },

      // 3. 三源指标微卡片 (轻量半透明背景与细边框)
      {
        type: "stack",
        direction: "column",
        gap: 4,
        padding: [6, 8, 6, 8],
        backgroundColor: C.cardBg,
        borderRadius: 9,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          createSmallSourceRow("IPPure", d.ippureScore !== null ? `${d.ippureScore}分` : "N/A", d.ipType, getPurityColor(d.ippureScore || 100)),
          createSmallSourceRow("IPLogs", d.iplogsPurity !== null ? `${d.iplogsPurity}分` : "N/A", d.iplogsVerdictText, getPurityColor(d.iplogsPurity || 100)),
          createSmallSourceRow("ip-api", d.ipApiScoreText !== "N/A" ? `${d.ipApiScoreText}分` : "N/A", d.ipApiVerdict, getScoreTextColor(d.ipApiScoreText))
        ]
      }
    ]
  };
}

function createSmallSourceRow(name, scoreText, label, color) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      { type: "text", text: name, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
      { type: "spacer" },
      { type: "text", text: label, font: { size: 10, weight: "medium" }, textColor: C.textTertiary },
      { type: "spacer", length: 5 },
      { type: "text", text: scoreText, font: { size: 10, weight: "heavy" }, textColor: color }
    ]
  };
}

/**
 * 主屏幕 Medium 中尺寸 (338x158 pt): 通透三列无灰底并列看板
 */
function renderSystemMedium(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [11, 14, 11, 14],
    children: [
      // 1. 顶部 Header (保持全尺寸统一标题: 绿叶 + IP纯净度 + 综合分)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: IPPURE_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "spacer", length: 6 },
          {
            type: "text",
            text: "IP纯净度",
            font: { size: "subheadline", weight: "heavy" },
            textColor: C.textPrimary
          },
          { type: "spacer" },
          createPillBadge(`综合 ${d.overallPurity}分`, d.overallLevel.color, d.overallLevel.badgeBg, d.overallLevel.icon)
        ]
      },

      { type: "spacer", length: 4 },

      // 2. 出口网络信息独立行 (紧贴标题行，消除过宽间隙)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 13, weight: "bold" },
            textColor: C.textPrimary
          },
          {
            type: "stack",
            padding: [1, 4],
            borderRadius: 3.5,
            backgroundColor: C.pillBg,
            children: [
              { type: "text", text: d.ipVer, font: { size: 8, weight: "bold" }, textColor: C.textSecondary }
            ]
          },
          {
            type: "text",
            text: `· ${d.locShort}`,
            font: { size: 10, weight: "medium" },
            textColor: C.textSecondary,
            maxLines: 1
          },
          { type: "spacer" },
          {
            type: "text",
            text: d.asnNumber,
            font: { size: 10, weight: "medium" },
            textColor: C.textTertiary,
            maxLines: 1
          }
        ]
      },

      { type: "spacer", length: 6 },

      // 3. 核心区：3 列数据源微遮罩并列卡片 (HIG 优雅轻磨砂层级，清晰留白)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        flex: 1,
        children: [
          // 第一列: IPPure
          createCleanColumn({
            sourceName: "IPPure",
            scoreVal: d.ippureScore !== null ? `${d.ippureScore}分` : "N/A",
            scoreColor: getPurityColor(d.ippureScore || 100),
            tagPrimary: d.ipType,
            tagSecondary: d.broadcastText,
            subline: d.rawFraudScore !== null ? `欺诈分: ${d.rawFraudScore}` : "原生评估源"
          }),

          // 第二列: IPLogs
          createCleanColumn({
            sourceName: "IPLogs",
            scoreVal: d.iplogsPurity !== null ? `${d.iplogsPurity}分` : "N/A",
            scoreColor: getPurityColor(d.iplogsPurity || 100),
            tagPrimary: d.iplogsVerdictText,
            tagSecondary: "行为风控",
            subline: d.iplogsPurity !== null ? "信誉度检测" : "未获取到评分"
          }),

          // 第三列: ip-api
          createCleanColumn({
            sourceName: "ip-api",
            scoreVal: d.ipApiScoreText !== "N/A" ? `${d.ipApiScoreText}分` : "N/A",
            scoreColor: getScoreTextColor(d.ipApiScoreText),
            tagPrimary: d.ipApiVerdict,
            tagSecondary: d.ipApiProxy ? "发现代理" : "无代理特征",
            subline: d.asnNumber
          })
        ]
      },

      { type: "spacer", length: 5 },

      // 4. 底部极轻状态条 (左侧显示网络组织，右侧提示三源)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:network", color: C.textTertiary, width: 9, height: 9 },
          {
            type: "text",
            text: d.asnOrg || "未知组织",
            font: { size: 10 },
            textColor: C.textTertiary,
            maxLines: 1
          },
          { type: "spacer" },
          { type: "text", text: "数据源: IPPure · IPLogs · ip-api", font: { size: 10 }, textColor: C.textTertiary }
        ]
      }
    ]
  };
}

function createCleanColumn({ sourceName, scoreVal, scoreColor, tagPrimary, tagSecondary, subline }) {
  return {
    type: "stack",
    direction: "column",
    flex: 1,
    gap: 3,
    padding: [7, 8, 7, 8],
    backgroundColor: C.cardBg,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: C.cardBorder,
    children: [
      {
        type: "text",
        text: sourceName,
        font: { size: 10, weight: "bold" },
        textColor: C.textSecondary,
        maxLines: 1
      },
      {
        type: "text",
        text: scoreVal,
        font: { size: 18, weight: "heavy" },
        textColor: scoreColor,
        maxLines: 1
      },
      { type: "spacer" },
      {
        type: "text",
        text: tagPrimary,
        font: { size: 10, weight: "bold" },
        textColor: C.textPrimary,
        maxLines: 1
      },
      {
        type: "text",
        text: tagSecondary,
        font: { size: 10, weight: "medium" },
        textColor: C.textSecondary,
        maxLines: 1
      },
      {
        type: "text",
        text: subline,
        font: { size: 8 },
        textColor: C.textTertiary,
        maxLines: 1
      }
    ]
  };
}

/**
 * 主屏幕 Large 大尺寸 (4 象限多源看板)
 */
function renderSystemLarge(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 16,
    gap: 12,
    children: [
      // 1. 顶栏 (Header)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: IPPURE_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "spacer", length: 6 },
          { type: "text", text: "IP纯净度", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer", length: 6 },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.pillBg,
            children: [
              { type: "text", text: d.ipVer, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }
            ]
          },
          { type: "spacer" },
          createPillBadge(`综合指数: ${d.overallPurity}`, d.overallLevel.color, d.overallLevel.badgeBg, d.overallLevel.icon)
        ]
      },

      // 2. Hero 概览大卡片 (双环仪表 + IP/位置)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        backgroundColor: C.cardBg,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          {
            type: "image",
            src: createGaugeRingSvg(d.overallPurity, 72, 6.5, d.overallLevel.color, "综合纯净"),
            width: 72,
            height: 72
          },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            gap: 3,
            children: [
              {
                type: "text",
                text: d.displayIP,
                font: { size: 19, weight: "bold" },
                textColor: C.textPrimary,
                maxLines: 1
              },
              {
                type: "text",
                text: d.locFull,
                font: { size: 11, weight: "medium" },
                textColor: C.textSecondary,
                maxLines: 1
              },
              {
                type: "text",
                text: `${d.asnNumber} · ${d.asnOrg || "未知组织"}`,
                font: { size: 10 },
                textColor: C.textTertiary,
                maxLines: 1
              }
            ]
          }
        ]
      },

      // 3. 2x2 四象限多源并列卡片矩阵 (轻量边框，无灰厚底)
      {
        type: "stack",
        direction: "column",
        flex: 1,
        gap: 8,
        children: [
          // 第一行: IPPure 深度 + IPLogs 评级
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createMatrixCard("sf-symbol:shield.checkerboard", "IPPure 属性维度", [
                { label: "纯净得分", val: d.ippureScore !== null ? `${d.ippureScore}分` : "N/A", color: getPurityColor(d.ippureScore || 100) },
                { label: "原生状态", val: d.ipType, color: d.ipType.includes("住宅") ? "rgb(52,199,89)" : "rgb(255,149,0)" },
                { label: "网络划分", val: d.broadcastText, color: C.textSecondary }
              ], true),
              createMatrixCard("sf-symbol:chart.bar.xaxis", "IPLogs 风控雷达", [
                { label: "信誉评分", val: d.iplogsPurity !== null ? `${d.iplogsPurity}分` : "N/A", color: getPurityColor(d.iplogsPurity || 100) },
                { label: "判决结论", val: d.iplogsVerdictText, color: d.iplogsVerdictText.includes("Clean") ? "rgb(52,199,89)" : "rgb(255,149,0)" },
                { label: "节点分类", val: d.iplogsType, color: C.textSecondary }
              ], true)
            ]
          },
          // 第二行: ip-api 设施基准 + 综合仲裁结论
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createMatrixCard("sf-symbol:server.rack", "ip-api 设施基准", [
                { label: "标准评分", val: d.ipApiScoreText !== "N/A" ? `${d.ipApiScoreText}分` : "N/A", color: getScoreTextColor(d.ipApiScoreText) },
                { label: "代理特征", val: d.ipApiProxy ? "检测到代理" : "未发现代理", color: d.ipApiProxy ? "rgb(255,59,48)" : "rgb(52,199,89)" },
                { label: "机房托管", val: d.ipApiHosting ? "数据中心/托管" : "住宅/非托管", color: d.ipApiHosting ? "rgb(255,149,0)" : "rgb(52,199,89)" }
              ], true),
              createMatrixCard("sf-symbol:checkmark.seal.fill", "多源交叉结论", [
                { label: "风险定级", val: d.overallLevel.text, color: d.overallLevel.color },
                { label: "属性仲裁", val: (d.ipType.includes("住宅") && !d.ipApiHosting) ? "多源住宅认证" : "机房/商业出口", color: C.textSecondary },
                { label: "服务状态", val: "全源响应正常", color: "rgb(52,199,89)" }
              ], true)
            ]
          }
        ]
      },

      // 4. Footer 底部说明
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "text", text: "数据源: IPPure · IPLogs · ip-api", font: { size: 10 }, textColor: C.textTertiary }
        ]
      }
    ]
  };
}

function createMatrixCard(icon, title, items, flexVal) {
  const card = {
    type: "stack",
    direction: "column",
    gap: 4,
    padding: [8, 10],
    backgroundColor: C.cardBg,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.cardBorder,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: icon, color: C.textTertiary, width: 10, height: 10 },
          { type: "text", text: title, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }
        ]
      },
      ...items.map(item => ({
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "text", text: item.label, font: { size: 9 }, textColor: C.textTertiary },
          { type: "spacer" },
          { type: "text", text: item.val, font: { size: 9, weight: "bold" }, textColor: item.color, maxLines: 1 }
        ]
      }))
    ]
  };
  if (flexVal) card.flex = 1;
  return card;
}

function renderErrorWidget(family, errorMsg) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 14,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: IPPURE_LOGO, width: 14, height: 14 },
          { type: "text", text: "IP纯净度", font: { size: "caption1", weight: "bold" }, textColor: C.textPrimary }
        ]
      },
      { type: "spacer" },
      {
        type: "stack",
        direction: "column",
        gap: 4,
        alignItems: "center",
        padding: 10,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          { type: "text", text: errorMsg, font: { size: "caption1", weight: "medium" }, textColor: "rgb(255,59,48)" },
          { type: "text", text: "请检查网络策略组连接", font: { size: 10 }, textColor: C.textTertiary }
        ]
      },
      { type: "spacer" }
    ]
  };
}

// ── SVG 绘图辅助函数 ──

function createGaugeRingSvg(purity, size, strokeWidth, strokeColor, labelText = "纯净度") {
  const half = size / 2;
  const r = half - strokeWidth / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, purity)) / 100;
  const dash = (circ * pct).toFixed(1);
  const gap = (circ - dash).toFixed(1);

  const numFontSize = Math.round(size * 0.31);
  const labelFontSize = Math.round(size * 0.11);
  const numY = Math.round(half + numFontSize * 0.05);
  const labelY = Math.round(half + numFontSize * 0.62);

  const trackColor = "rgba(128,128,128,0.18)";
  const numColor = strokeColor;
  const subColor = "rgba(128,128,128,0.85)";

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${trackColor}' stroke-width='${strokeWidth}'/>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash} ${gap}' transform='rotate(-90 ${half} ${half})'/>` +
    `<text x='${half}' y='${numY}' text-anchor='middle' font-size='${numFontSize}' font-weight='800' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${numColor}'>${purity}</text>` +
    (labelText ? `<text x='${half}' y='${labelY}' text-anchor='middle' font-size='${labelFontSize}' font-weight='600' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${subColor}'>${labelText}</text>` : '') +
    `</svg>`;
}

// ── 评分等级与辅助函数 ──

function getPurityColor(purity) {
  if (purity >= 80) return "rgb(52,199,89)";
  if (purity >= 60) return "rgb(48,176,199)";
  if (purity >= 40) return "rgb(255,149,0)";
  return "rgb(255,59,48)";
}

function getScoreTextColor(scoreText) {
  if (!scoreText || scoreText === "N/A") return C.textSecondary;
  const num = parseInt(scoreText, 10);
  return getPurityColor(isNaN(num) ? 70 : num);
}

function getPurityLevel(purity) {
  if (purity >= 80) {
    return {
      text: "极高纯净",
      color: "rgb(52,199,89)",
      badgeBg: { light: "rgba(52,199,89,0.12)", dark: "rgba(52,199,89,0.20)" },
      icon: "checkmark.shield.fill"
    };
  }
  if (purity >= 60) {
    return {
      text: "良好可用",
      color: "rgb(48,176,199)",
      badgeBg: { light: "rgba(48,176,199,0.12)", dark: "rgba(48,176,199,0.20)" },
      icon: "shield.lefthalf.filled"
    };
  }
  if (purity >= 40) {
    return {
      text: "中度风险",
      color: "rgb(255,149,0)",
      badgeBg: { light: "rgba(255,149,0,0.12)", dark: "rgba(255,149,0,0.20)" },
      icon: "exclamationmark.shield.fill"
    };
  }
  return {
    text: "高危污染",
    color: "rgb(255,59,48)",
    badgeBg: { light: "rgba(255,59,48,0.12)", dark: "rgba(255,59,48,0.20)" },
    icon: "xmark.shield.fill"
  };
}

function createPillBadge(text, textColor, bgColor, icon) {
  const children = [];
  if (icon) {
    children.push({
      type: "image",
      src: `sf-symbol:${icon}`,
      color: textColor,
      width: 10,
      height: 10
    });
  }
  children.push({
    type: "text",
    text,
    font: { size: 10, weight: "bold" },
    textColor,
    maxLines: 1
  });

  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 6],
    borderRadius: 6,
    backgroundColor: bgColor,
    children
  };
}

function maskIP(ip) {
  if (!ip) return "";
  if (ip.includes(".")) {
    const p = ip.split(".");
    return `${p[0]}.${p[1]}.*.*`;
  }
  const p6 = ip.split(":");
  return `${p6[0]}:${p6[1]}:*:*:*:*:*:*`;
}

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  let code = cc.toUpperCase();
  if (code === "TW") code = "CN";
  try {
    return String.fromCodePoint(
      ...code.split("").map(c => 127397 + c.charCodeAt(0))
    );
  } catch (e) {
    return "";
  }
}
