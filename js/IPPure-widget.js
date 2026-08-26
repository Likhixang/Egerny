/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件
 * 设计理念：
 *   - 经典仪表盘大圆环（Hero Circular Progress Gauge）直观展现 IP 纯净度
 *   - 严格遵循 Apple iOS Human Interface Guidelines 规范
 *   - 优雅的自适应语义配色（Light / Dark 自适应）
 *   - 支持全尺寸：systemSmall / systemMedium / systemLarge / accessoryCircular / accessoryRectangular / accessoryInline
 *   - 环境变量：MarkIP = true 时对 IP 地址脱敏显示
 * 数据源：https://my.ippure.com/v1/info
 */

export default async function(ctx) {
  const apiUrl = "https://my.ippure.com/v1/info"
  const markIP = (ctx.env?.MarkIP || "false").toLowerCase() === "true"

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
  const timezone = data.timezone || ""
  const coordinates = (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : ""

  const family = ctx.widgetFamily || "systemMedium"

  // ── 锁屏小组件 ──
  if (family === "accessoryCircular") {
    return renderAccessoryCircular(purity, level)
  }
  if (family === "accessoryRectangular") {
    return renderAccessoryRectangular(displayIP, locShort, purity, level, ipType)
  }
  if (family === "accessoryInline") {
    return renderAccessoryInline(displayIP, purity, level)
  }

  // ── 主屏幕小组件 ──
  if (family === "systemSmall") {
    return renderSystemSmall({
      displayIP,
      locShort,
      purity,
      level,
      asnNumber,
      ipType,
      ipTypeIcon,
      ipVer
    })
  }

  if (family === "systemLarge") {
    return renderSystemLarge({
      displayIP,
      ipVer,
      locFull,
      purity,
      fraudScore,
      level,
      asnNumber,
      asnOrg,
      ipType,
      broadcastText,
      timezone,
      coordinates,
      postalCode: data.postalCode || ""
    })
  }

  // 默认：systemMedium 中尺寸（黄金中尺寸，大圆环仪表盘 + 右侧信息流）
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
 * 结构：
 *  - Header: 图标 + "IP PURE" + 风险指示点
 *  - Center: 精美大圆环仪表（直径 80pt，中心大纯净度数字 + "纯净度"标签）
 *  - Footer: IP 归属 + 网络类型
 */
function renderSystemSmall(d) {
  return {
    type: "widget",
    padding: 12,
    gap: 2,
    children: [
      // 1. Header
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:shield.fill", color: d.level.color, width: 12, height: 12 },
          { type: "text", text: "IP 纯净度", font: { size: 11, weight: "bold" }, textColor: C.textPrimary },
          { type: "spacer" },
          createMiniPill(d.level.text, d.level.color, d.level.badgeBg)
        ]
      },

      { type: "spacer" },

      // 2. 居中大圆环仪表
      {
        type: "stack",
        direction: "column",
        alignItems: "center",
        children: [
          {
            type: "image",
            src: createGaugeRingSvg(d.purity, 78, 7.5, d.level.color, "纯净度"),
            width: 78,
            height: 78
          }
        ]
      },

      { type: "spacer" },

      // 3. 底部信息行 (IP 与类型)
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        padding: [3, 6],
        borderRadius: 6,
        backgroundColor: C.cardBg,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 10, weight: "bold" },
            textColor: C.textPrimary,
            maxLines: 1,
            minScale: 0.65,
            flex: 1
          },
          {
            type: "text",
            text: d.ipType,
            font: { size: 9, weight: "medium" },
            textColor: C.textSecondary,
            maxLines: 1
          }
        ]
      }
    ]
  }
}

/**
 * 主屏幕 Medium 中尺寸 (2x4，黄金中尺寸仪表盘)
 * 结构：
 *  - Header: 盾牌 + "节点 IP 纯净度" + IPv4/v6 + Spacer + 风险评级 Badge
 *  - Main (左右分栏):
 *    - Left: 核心大圆环仪表 (90x90pt，大数字 + 纯净度)
 *    - Right: 结构化信息流 (IP 大字、地理位置、ASN 组织、属性标签群)
 */
function renderSystemMedium(d) {
  return {
    type: "widget",
    padding: 14,
    gap: 6,
    children: [
      // 1. Header 顶栏
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: "sf-symbol:shield.lefthalf.filled", color: d.level.color, width: 14, height: 14 },
          { type: "text", text: "节点 IP 纯净度", font: { size: "footnote", weight: "bold" }, textColor: C.textPrimary },
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
            gap: 4,
            children: [
              // IP 大字
              {
                type: "text",
                text: d.displayIP,
                font: { size: 19, weight: "bold" },
                textColor: C.textPrimary,
                maxLines: 1,
                minScale: 0.65
              },
              // 归属地
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 4,
                children: [
                  { type: "image", src: "sf-symbol:location.fill", color: C.textTertiary, width: 11, height: 11 },
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
              // ASN 网络
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 4,
                children: [
                  { type: "image", src: "sf-symbol:globe", color: C.textTertiary, width: 11, height: 11 },
                  {
                    type: "text",
                    text: d.asnFull,
                    font: { size: "caption2" },
                    textColor: C.textSecondary,
                    maxLines: 1,
                    minScale: 0.7
                  }
                ]
              },
              // 底部特性胶囊排
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 5,
                children: [
                  createMiniTag(`sf-symbol:${d.ipTypeIcon}`, d.ipType),
                  createMiniTag("sf-symbol:antenna.radiowaves.left.and.right", d.broadcastText)
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
 * 主屏幕 Large 大尺寸 (4x4)
 * 结构：
 *  - Header
 *  - Hero 面板：左侧 108pt 超大圆环仪表 + 右侧核心分析
 *  - 4 宫格网格矩阵 (地理归属、运营商、IP 属性、环境时区)
 *  - Footer: 刷新时间与来源
 */
function renderSystemLarge(d) {
  return {
    type: "widget",
    padding: 16,
    gap: 12,
    children: [
      // 1. Header
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: "sf-symbol:shield.checkerboard", color: d.level.color, width: 18, height: 18 },
          { type: "text", text: "节点 IP 纯净度检测", font: { size: "headline", weight: "bold" }, textColor: C.textPrimary },
          { type: "spacer" },
          createPillBadge(d.level.text, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      // 2. Hero 主仪表盘卡片
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: C.cardBg,
        children: [
          // 左侧：超大圆环仪表
          {
            type: "image",
            src: createGaugeRingSvg(d.purity, 104, 10, d.level.color, "纯净度"),
            width: 104,
            height: 104
          },
          // 右侧：核心概要
          {
            type: "stack",
            direction: "column",
            flex: 1,
            gap: 5,
            children: [
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                children: [
                  {
                    type: "text",
                    text: d.displayIP,
                    font: { size: 20, weight: "bold" },
                    textColor: C.textPrimary,
                    maxLines: 1,
                    minScale: 0.6,
                    flex: 1
                  },
                  {
                    type: "stack",
                    padding: [2, 6],
                    borderRadius: 4,
                    backgroundColor: C.cardBgSecondary,
                    children: [
                      { type: "text", text: d.ipVer, font: { size: 11, weight: "bold" }, textColor: C.textSecondary }
                    ]
                  }
                ]
              },
              {
                type: "text",
                text: `安全评级: ${d.level.text} (${d.purity} 分)`,
                font: { size: "footnote", weight: "semibold" },
                textColor: d.level.color
              },
              {
                type: "text",
                text: `欺诈风险评分: ${d.fraudScore} (越低越安全)`,
                font: { size: "caption1" },
                textColor: C.textTertiary
              },
              {
                type: "text",
                text: `网络定位: ${d.ipType} · ${d.broadcastText}`,
                font: { size: "caption1" },
                textColor: C.textSecondary
              }
            ]
          }
        ]
      },

      // 3. 四宫格详情卡片
      {
        type: "stack",
        direction: "column",
        gap: 8,
        flex: 1,
        children: [
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createGridCard("sf-symbol:mappin.and.ellipse", "地理归属", [
                d.locFull,
                d.coordinates ? `坐标: ${d.coordinates}` : null,
                d.postalCode ? `邮编: ${d.postalCode}` : null
              ]),
              createGridCard("sf-symbol:building.2.crop.circle", "网络运营商", [
                d.asnNumber,
                d.asnOrg || "未知组织"
              ])
            ]
          },
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createGridCard("sf-symbol:antenna.radiowaves.left.and.right", "IP 属性特征", [
                `类型: ${d.ipType}`,
                `路由: ${d.broadcastText}`
              ]),
              createGridCard("sf-symbol:clock.badge.checkmark", "环境时区", [
                `时区: ${d.timezone || "未知"}`,
                `检测状态: ${d.level.text}`
              ])
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
// 🔒 锁屏小组件渲染 (Lock Screen Accessories)
// ══════════════════════════════════════════════════════

function renderAccessoryCircular(purity, level) {
  return {
    type: "widget",
    children: [
      {
        type: "image",
        src: createGaugeRingSvg(purity, 46, 4.5, "#FFFFFF", "PURE", true),
        width: 46,
        height: 46
      }
    ]
  }
}

function renderAccessoryRectangular(displayIP, locShort, purity, level, ipType) {
  return {
    type: "widget",
    gap: 2,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:shield.fill", width: 12, height: 12 },
          {
            type: "text",
            text: displayIP,
            font: { size: "caption1", weight: "bold" },
            maxLines: 1,
            minScale: 0.65
          }
        ]
      },
      {
        type: "text",
        text: locShort,
        font: { size: "caption2" },
        textColor: C.textSecondary,
        maxLines: 1,
        minScale: 0.8
      },
      {
        type: "text",
        text: `纯净度 ${purity}% · ${ipType}`,
        font: { size: "caption2", weight: "semibold" },
        maxLines: 1
      }
    ]
  }
}

function renderAccessoryInline(displayIP, purity, level) {
  return {
    type: "widget",
    children: [
      {
        type: "text",
        text: `${displayIP} · 纯净度 ${purity}% (${level.text})`,
        font: { size: "caption1", weight: "medium" },
        maxLines: 1,
        minScale: 0.6
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

function createMiniPill(text, textColor, bgColor) {
  return {
    type: "stack",
    padding: [2, 5],
    borderRadius: 5,
    backgroundColor: bgColor,
    children: [
      { type: "text", text, font: { size: 9, weight: "bold" }, textColor, maxLines: 1 }
    ]
  }
}

function createMiniTag(iconSrc, text) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 6],
    borderRadius: 4,
    backgroundColor: C.cardBg,
    children: [
      { type: "image", src: iconSrc, color: C.textTertiary, width: 10, height: 10 },
      { type: "text", text, font: { size: 10, weight: "medium" }, textColor: C.textSecondary, maxLines: 1 }
    ]
  }
}

function createGridCard(iconSrc, title, lines) {
  const lineChildren = lines
    .filter(Boolean)
    .map(line => ({
      type: "text",
      text: line,
      font: { size: 11, weight: "regular" },
      textColor: C.textSecondary,
      maxLines: 1,
      minScale: 0.7
    }))

  return {
    type: "stack",
    direction: "column",
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.cardBg,
    gap: 4,
    flex: 1,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: iconSrc, color: C.textPrimary, width: 13, height: 13 },
          { type: "text", text: title, font: { size: 12, weight: "semibold" }, textColor: C.textPrimary, maxLines: 1 }
        ]
      },
      ...lineChildren
    ]
  }
}

function renderErrorWidget(family, message) {
  return {
    type: "widget",
    padding: 16,
    gap: 8,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: "sf-symbol:exclamationmark.triangle.fill", color: "#FF3B30", width: 16, height: 16 },
          { type: "text", text: "IP 纯净度检测", font: { size: "subheadline", weight: "semibold" }, textColor: C.textPrimary }
        ]
      },
      { type: "spacer" },
      {
        type: "text",
        text: message,
        font: { size: "footnote" },
        textColor: "#FF3B30"
      }
    ]
  }
}

// ══════════════════════════════════════════════════════
// 📊 SVG 经典大圆环仪表 (High-Precision Circular Gauge)
// ══════════════════════════════════════════════════════

/**
 * 绘制高质感居中环形进度圈
 * 采用 Apple 级几何比例，文字使用 baseline 绝对对齐
 */
function createGaugeRingSvg(purity, size, strokeWidth, strokeColor, labelText = "纯净度", isLockScreen = false) {
  const half = size / 2
  const r = half - strokeWidth / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, purity)) / 100
  const dash = (circ * pct).toFixed(1)
  const gap = (circ - dash).toFixed(1)

  // 字体与排版参数
  const numFontSize = Math.round(size * 0.32)
  const labelFontSize = Math.round(size * 0.13)
  const numY = Math.round(half - size * 0.03)
  const labelY = Math.round(half + size * 0.23)

  const trackColor = isLockScreen ? "rgba(255,255,255,0.2)" : "rgba(128,128,128,0.18)"
  const numColor = isLockScreen ? "#FFFFFF" : strokeColor
  const subColor = isLockScreen ? "rgba(255,255,255,0.7)" : "rgba(128,128,128,0.85)"

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>` +
    // 底轨 Track
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${trackColor}' stroke-width='${strokeWidth}'/>` +
    // 进度弧线 Progress Arc (顺时针，从顶部 12 点钟开始)
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash} ${gap}' transform='rotate(-90 ${half} ${half})'/>` +
    // 中心大数字
    `<text x='${half}' y='${numY}' text-anchor='middle' dominant-baseline='central' font-size='${numFontSize}' font-weight='800' font-family='-apple-system, system-ui, sans-serif' fill='${numColor}'>${purity}</text>` +
    // 下方小标签
    `<text x='${half}' y='${labelY}' text-anchor='middle' dominant-baseline='central' font-size='${labelFontSize}' font-weight='600' font-family='-apple-system, system-ui, sans-serif' fill='${subColor}'>${labelText}</text>` +
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
