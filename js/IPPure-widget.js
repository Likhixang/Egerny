/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件
 * 设计系统：Apple HIG 现代化自适应排版
 *   - 官方 IPPure 高清品牌徽标
 *   - Small: 显式固定精密间距控制
 *   - Medium: 经典宽屏仪表盘（左侧大圆环仪表 + 右侧结构化信息流）
 *   - Large / ExtraLarge: 顶部 Header + 顶部大圆环 Hero 概览 + 底部 2x2 对称等高数据卡片
 * 数据源：https://my.ippure.com/v1/info
 */

// ── IPPure 官方品牌高清徽标 ──
const IPPURE_LOGO = "data:image/png;base64,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";

export default async function(ctx) {
  const apiUrl = "https://my.ippure.com/v1/info"
  const markIP = (ctx.env?.MarkIP || ctx.env?.mark_ip || "false").toLowerCase() === "true"

  let data
  try {
    const resp = await ctx.http.get(apiUrl)
    data = await resp.json()
  } catch (e) {
    return renderErrorWidget(ctx.widgetFamily, "网络请求失败")
  }

  if (!data || !data.ip) {
    return renderErrorWidget(ctx.widgetFamily, "数据解析异常")
  }

  // ── 基础数据规范化 ──
  const ip = data.ip || "N/A"
  const isIPv6 = ip.includes(":")
  const ipVer = isIPv6 ? "IPv6" : "IPv4"
  const displayIP = markIP ? maskIP(ip) : ip

  const fraudScore = typeof data.fraudScore === "number" ? data.fraudScore : 0
  const purity = Math.max(0, Math.min(100, 100 - fraudScore))
  const level = getRiskLevel(fraudScore)

  const isResidential = data.isResidential === true
  const ipType = isResidential ? "住宅原生" : "数据中心"
  const ipTypeIcon = isResidential ? "house.fill" : "server.rack"

  const isBroadcast = data.isBroadcast === true
  const broadcastText = isBroadcast ? "广播 IP" : "本地分配"

  const asnNumber = data.asn ? `AS${data.asn}` : "AS --"
  const asnOrg = (data.asOrganization || "").trim()
  const asnFull = asnOrg ? `${asnNumber} ${asnOrg}` : asnNumber

  const city = data.city || ""
  const region = data.region || ""
  const country = data.country || ""
  const countryCode = data.countryCode || ""

  const locShort = [city, countryCode].filter(Boolean).join(", ") || country || "未知位置"
  const locFull = [city, region, country].filter(Boolean).join(", ") || country || "未知位置"
  const locLine1 = [city, region].filter(Boolean).join(", ") || city || region || "未知城市"
  const locLine2 = [country, countryCode ? `(${countryCode})` : ""].filter(Boolean).join(" ") || "未知国家"

  const timezone = data.timezone || ""
  const coordinates = (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : ""

  const family = ctx.widgetFamily || "systemMedium"

  // ── 主屏幕小组件各尺寸 ──
  if (family === "systemSmall") {
    return renderSystemSmall({
      displayIP,
      locFull,
      locShort,
      purity,
      level,
      asnNumber,
      ipType,
      ipTypeIcon,
      ipVer
    })
  }

  if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderSystemLarge({
      displayIP,
      ipVer,
      locFull,
      locLine1,
      locLine2,
      purity,
      fraudScore,
      level,
      asnNumber,
      asnOrg,
      ipType,
      ipTypeIcon,
      broadcastText,
      timezone,
      coordinates,
      postalCode: data.postalCode || ""
    })
  }

  // 默认：systemMedium 中尺寸
  return renderSystemMedium({
    displayIP,
    ipVer,
    locShort,
    locFull,
    purity,
    fraudScore,
    level,
    asnFull,
    asnNumber,
    asnOrg,
    ipType,
    ipTypeIcon,
    broadcastText
  })
}

// ══════════════════════════════════════════════════════
// 🎨 设计系统 Tokens (Colors & Styles)
// ══════════════════════════════════════════════════════

const C = {
  textPrimary: { light: "#1C1C1E", dark: "#FFFFFF" },
  textSecondary: { light: "#6E6E73", dark: "#98989D" },
  textTertiary: { light: "#8E8E93", dark: "#636366" },

  cardBg: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
  cardBgSecondary: { light: "rgba(0, 0, 0, 0.025)", dark: "rgba(255, 255, 255, 0.05)" },
  cardBorder: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.06)" }
}

// ══════════════════════════════════════════════════════
// 📐 各尺寸小组件渲染
// ══════════════════════════════════════════════════════

/**
 * 主屏幕 Small 小尺寸 (2x2)
 */
function renderSystemSmall(d) {
  return {
    type: "widget",
    padding: 14,
    children: [
      // 1. 顶部 Header (官方高清 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: IPPURE_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "text", text: "IPPure", font: { size: "caption1", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: d.ipVer, font: { size: 9, weight: "bold" }, textColor: C.textSecondary }
            ]
          }
        ]
      },

      { type: "spacer", length: 8 },

      // 2. Hero 主区域 (大字 IP + 详细位置)
      {
        type: "stack",
        direction: "column",
        gap: 2,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 17, weight: "bold" },
            textColor: C.textPrimary,
            maxLines: 1,
            minScale: 0.65
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 3,
            children: [
              { type: "image", src: "sf-symbol:mappin.and.ellipse", color: C.textTertiary, width: 10, height: 10 },
              {
                type: "text",
                text: d.locFull,
                font: { size: 11 },
                textColor: C.textSecondary,
                maxLines: 1,
                minScale: 0.75
              }
            ]
          }
        ]
      },

      { type: "spacer", length: 11 },

      // 3. 核心长条状纯净度进度条
      {
        type: "stack",
        direction: "column",
        gap: 4,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              {
                type: "text",
                text: `纯净度 ${d.purity}%`,
                font: { size: "caption1", weight: "bold" },
                textColor: d.level.color
              },
              { type: "spacer" },
              {
                type: "text",
                text: d.level.text,
                font: { size: "caption2", weight: "semibold" },
                textColor: d.level.color
              }
            ]
          },
          {
            type: "image",
            src: createProgressBarSvg(d.purity, d.level.color),
            height: 5,
            resizable: true
          }
        ]
      },

      { type: "spacer", length: 11 },

      // 4. 底部双属性胶囊
      {
        type: "stack",
        direction: "row",
        gap: 5,
        children: [
          createSmallPill("sf-symbol:network", d.asnNumber, 1),
          createSmallPill(`sf-symbol:${d.ipTypeIcon}`, d.ipType, 1)
        ]
      }
    ]
  }
}

/**
 * 主屏幕 Medium 中尺寸 (2x4 黄金仪表盘)
 */
function renderSystemMedium(d) {
  return {
    type: "widget",
    padding: 14,
    gap: 6,
    children: [
      // 1. Header 顶栏 (官方高清 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: IPPURE_LOGO, width: 15, height: 15, borderRadius: 3.5 },
          { type: "text", text: "IPPure 纯净度", font: { size: "footnote", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: d.ipVer, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }
            ]
          },
          { type: "spacer" },
          createPillBadge(`${d.level.text} · 欺诈分 ${d.fraudScore}`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      { type: "spacer" },

      // 2. Main 左右分栏核心区
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 14,
        children: [
          // 左侧：经典大圆环仪表盘
          {
            type: "stack",
            direction: "column",
            alignItems: "center",
            children: [
              {
                type: "image",
                src: createGaugeRingSvg(d.purity, 88, 8, d.level.color, "纯净度"),
                width: 88,
                height: 88
              }
            ]
          },

          // 右侧：结构化详情信息
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
                maxLines: 1,
                minScale: 0.65
              },
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 4,
                children: [
                  { type: "image", src: "sf-symbol:mappin.and.ellipse", color: C.textTertiary, width: 11, height: 11 },
                  {
                    type: "text",
                    text: d.locFull,
                    font: { size: "caption1" },
                    textColor: C.textSecondary,
                    maxLines: 1,
                    minScale: 0.75
                  }
                ]
              },
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 4,
                children: [
                  { type: "image", src: "sf-symbol:network", color: C.textTertiary, width: 11, height: 11 },
                  {
                    type: "text",
                    text: d.asnOrg ? `${d.asnNumber} · ${d.asnOrg}` : d.asnNumber,
                    font: { size: "caption2" },
                    textColor: C.textTertiary,
                    maxLines: 1,
                    minScale: 0.7
                  }
                ]
              },
              {
                type: "stack",
                direction: "row",
                gap: 5,
                children: [
                  createSmallPill(`sf-symbol:${d.ipTypeIcon}`, d.ipType),
                  createSmallPill("sf-symbol:antenna.radiowaves.left.and.right", d.broadcastText)
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

/**
 * 主屏幕 Large 大尺寸 (4x4 完整看板)
 */
function renderSystemLarge(d) {
  return {
    type: "widget",
    padding: 16,
    gap: 12,
    children: [
      // 1. Header 顶栏 (官方高清 Logo)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: IPPURE_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "text", text: "IPPure 节点纯净度检测", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.cardBg,
            children: [
              { type: "text", text: d.ipVer, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }
            ]
          },
          { type: "spacer" },
          createPillBadge(d.level.text, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      // 2. Hero 顶部大概览卡片
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 14,
        padding: 12,
        borderRadius: 14,
        backgroundColor: C.cardBg,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          {
            type: "image",
            src: createGaugeRingSvg(d.purity, 78, 7, d.level.color, "纯净度"),
            width: 78,
            height: 78
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
                font: { size: 20, weight: "bold" },
                textColor: C.textPrimary,
                maxLines: 1,
                minScale: 0.65
              },
              {
                type: "text",
                text: `欺诈风险评分: ${d.fraudScore} / 100`,
                font: { size: "caption1", weight: "medium" },
                textColor: d.level.color
              },
              {
                type: "text",
                text: d.locFull,
                font: { size: "caption2" },
                textColor: C.textSecondary,
                maxLines: 1
              }
            ]
          }
        ]
      },

      // 3. 2x2 对称等高数据卡片矩阵
      {
        type: "stack",
        direction: "column",
        flex: 1,
        gap: 8,
        children: [
          // 第一行: IP 属性 + 地理位置
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createDataCard("sf-symbol:server.rack", "网络类型", d.ipType, d.broadcastText, true),
              createDataCard("sf-symbol:globe.asia.australia.fill", "所属地区", d.locLine1, d.locLine2, true)
            ]
          },
          // 第二行: ASN 网络 + 扩展信息
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createDataCard("sf-symbol:network", "自治系统 (ASN)", d.asnNumber, d.asnOrg || "未知网络", true),
              createDataCard("sf-symbol:clock.fill", "时区 / 坐标", d.timezone || "未知时区", d.coordinates || "未知坐标", true)
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
          { type: "text", text: "数据源 my.ippure.com", font: { size: 10 }, textColor: C.textTertiary },
          { type: "spacer" },
          { type: "date", date: new Date().toISOString(), format: "relative", font: { size: 10 }, textColor: C.textTertiary }
        ]
      }
    ]
  }
}

// ══════════════════════════════════════════════════════
// 🛠️ UI 构造辅助函数
// ══════════════════════════════════════════════════════

function createPillBadge(text, textColor, bgColor, icon) {
  const children = []
  if (icon) {
    children.push({
      type: "image",
      src: `sf-symbol:${icon}`,
      color: textColor,
      width: 10,
      height: 10
    })
  }
  children.push({
    type: "text",
    text,
    font: { size: 10, weight: "bold" },
    textColor,
    maxLines: 1
  })

  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 6],
    borderRadius: 6,
    backgroundColor: bgColor,
    children
  }
}

function createSmallPill(iconSrc, text, flexVal) {
  const item = {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 6],
    borderRadius: 4,
    backgroundColor: C.cardBg,
    children: [
      { type: "image", src: iconSrc, color: C.textSecondary, width: 9, height: 9 },
      { type: "text", text, font: { size: 10, weight: "medium" }, textColor: C.textSecondary, maxLines: 1, minScale: 0.75 }
    ]
  }
  if (flexVal) item.flex = flexVal
  return item
}

function createDataCard(icon, title, line1, line2, flexVal) {
  const card = {
    type: "stack",
    direction: "column",
    gap: 2,
    padding: [8, 10],
    borderRadius: 10,
    backgroundColor: C.cardBg,
    borderWidth: 0.5,
    borderColor: C.cardBorder,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 3,
        children: [
          { type: "image", src: icon, color: C.textTertiary, width: 10, height: 10 },
          { type: "text", text: title, font: { size: 10, weight: "medium" }, textColor: C.textTertiary, maxLines: 1 }
        ]
      },
      {
        type: "text",
        text: line1 || "--",
        font: { size: "caption1", weight: "bold" },
        textColor: C.textPrimary,
        maxLines: 1,
        minScale: 0.75
      },
      {
        type: "text",
        text: line2 || "--",
        font: { size: 10 },
        textColor: C.textSecondary,
        maxLines: 1,
        minScale: 0.75
      }
    ]
  }
  if (flexVal) card.flex = 1
  return card
}

function renderErrorWidget(family, errorMsg) {
  return {
    type: "widget",
    padding: 14,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: IPPURE_LOGO, width: 14, height: 14 },
          { type: "text", text: "IPPure 纯净度检测", font: { size: "caption1", weight: "bold" }, textColor: C.textPrimary }
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
        backgroundColor: C.cardBg,
        children: [
          { type: "text", text: errorMsg, font: { size: "caption1", weight: "medium" }, textColor: "rgb(255,59,48)" },
          { type: "text", text: "请检查网络连接或稍后重试", font: { size: 10 }, textColor: C.textTertiary }
        ]
      },
      { type: "spacer" }
    ]
  }
}

// ══════════════════════════════════════════════════════
// 📊 SVG 绘图辅助函数
// ══════════════════════════════════════════════════════

function createProgressBarSvg(purity, color) {
  const pct = Math.max(0, Math.min(100, purity))
  const trackColor = "rgba(128,128,128,0.18)"
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 5'><rect width='100' height='5' rx='2.5' fill='${trackColor}'/><rect width='${pct}' height='5' rx='2.5' fill='${color}'/></svg>`
}

function createGaugeRingSvg(purity, size, strokeWidth, strokeColor, labelText = "纯净度") {
  const half = size / 2
  const r = half - strokeWidth / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, purity)) / 100
  const dash = (circ * pct).toFixed(1)
  const gap = (circ - dash).toFixed(1)

  const numFontSize = Math.round(size * 0.31)
  const labelFontSize = Math.round(size * 0.11)
  const numY = Math.round(half + numFontSize * 0.05)
  const labelY = Math.round(half + numFontSize * 0.62)

  const trackColor = "rgba(128,128,128,0.18)"
  const numColor = strokeColor
  const subColor = "rgba(128,128,128,0.85)"

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${trackColor}' stroke-width='${strokeWidth}'/>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash} ${gap}' transform='rotate(-90 ${half} ${half})'/>` +
    `<text x='${half}' y='${numY}' text-anchor='middle' font-size='${numFontSize}' font-weight='800' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${numColor}'>${purity}</text>` +
    (labelText ? `<text x='${half}' y='${labelY}' text-anchor='middle' font-size='${labelFontSize}' font-weight='600' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${subColor}'>${labelText}</text>` : '') +
    `</svg>`
}

// ══════════════════════════════════════════════════════
// 🚦 风险评级与 IP 工具
// ══════════════════════════════════════════════════════

function getRiskLevel(fraudScore) {
  if (fraudScore <= 20) {
    return {
      text: "极低风险",
      color: "rgb(52,199,89)",
      badgeBg: { light: "rgba(52,199,89,0.12)", dark: "rgba(52,199,89,0.20)" },
      icon: "checkmark.shield.fill"
    }
  }
  if (fraudScore <= 40) {
    return {
      text: "低风险",
      color: "rgb(48,176,199)",
      badgeBg: { light: "rgba(48,176,199,0.12)", dark: "rgba(48,176,199,0.20)" },
      icon: "shield.lefthalf.filled"
    }
  }
  if (fraudScore <= 70) {
    return {
      text: "中等风险",
      color: "rgb(255,149,0)",
      badgeBg: { light: "rgba(255,149,0,0.12)", dark: "rgba(255,149,0,0.20)" },
      icon: "exclamationmark.shield.fill"
    }
  }
  return {
    text: "高危风险",
    color: "rgb(255,59,48)",
    badgeBg: { light: "rgba(255,59,48,0.12)", dark: "rgba(255,59,48,0.20)" },
    icon: "xmark.shield.fill"
  }
}

function maskIP(ip) {
  if (!ip) return ""
  if (ip.includes(".")) {
    const p = ip.split(".")
    return `${p[0]}.${p[1]}.*.*`
  }
  const p6 = ip.split(":")
  return `${p6[0]}:${p6[1]}:*:*:*:*:*:*`
}
