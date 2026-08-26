/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件
 * 规范设计：遵循 Apple iOS Human Interface Guidelines 规范
 * 特性：
 *   - 卡片式层次布局（Card-in-Card / Substack 胶囊设计）
 *   - 优雅的自适应语义配色（Light / Dark 自适应）
 *   - 完整支持所有尺寸：systemSmall / systemMedium / systemLarge / accessoryCircular / accessoryRectangular / accessoryInline
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

  // ── 数据解析与字段规范化 ──
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

  // 位置简写与全写
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

  // 默认：systemMedium 中尺寸（最核心高频尺寸）
  return renderSystemMedium({
    displayIP,
    ipVer,
    locShort,
    locFull,
    purity,
    fraudScore,
    level,
    asnFull,
    ipType,
    ipTypeIcon,
    broadcastText
  })
}

// ══════════════════════════════════════════════════════
// 🎨 设计系统 Tokens (Colors & Styles)
// ══════════════════════════════════════════════════════

const C = {
  // 文本色彩
  textPrimary: { light: "#1C1C1E", dark: "#FFFFFF" },
  textSecondary: { light: "#6E6E73", dark: "#98989D" },
  textTertiary: { light: "#8E8E93", dark: "#636366" },

  // 容器卡片背景与描边
  cardBg: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
  cardBgHover: { light: "rgba(0, 0, 0, 0.07)", dark: "rgba(255, 255, 255, 0.12)" },
  cardBorder: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.06)" },

  // 分割线
  separator: { light: "rgba(60, 60, 67, 0.12)", dark: "rgba(255, 255, 255, 0.12)" },

  // 强调与辅助色
  accentBlue: "#007AFF",
  accentPurple: "#AF52DE"
}

// ══════════════════════════════════════════════════════
// 📐 小组件尺寸渲染实现
// ══════════════════════════════════════════════════════

/**
 * 主屏幕 Small 小尺寸 (2x2)
 * 结构：
 *  - Header: 图标 + 模块名 + 纯净度胶囊
 *  - Hero: IP 大字 + 地理归属
 *  - Spacer
 *  - Cards: 2 列迷你信息卡 (ASN 编号 | 原生/机房)
 */
function renderSystemSmall(d) {
  return {
    type: "widget",
    padding: 14,
    gap: 4,
    children: [
      // 1. Header
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          { type: "image", src: "sf-symbol:shield.fill", color: C.textTertiary, width: 13, height: 13 },
          { type: "text", text: "IP PURE", font: { size: 11, weight: "bold" }, textColor: C.textSecondary },
          { type: "spacer" },
          createPillBadge(`${d.purity}%`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      { type: "spacer", length: 4 },

      // 2. Main Hero (IP + 地点)
      {
        type: "stack",
        direction: "column",
        gap: 2,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 16, weight: "bold" },
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
                text: d.locShort,
                font: { size: "caption2", weight: "medium" },
                textColor: C.textSecondary,
                maxLines: 1,
                minScale: 0.75
              }
            ]
          }
        ]
      },

      { type: "spacer" },

      // 3. Footer Cards: ASN 与 IP 类型
      {
        type: "stack",
        direction: "row",
        gap: 6,
        children: [
          createInfoPill("sf-symbol:network", d.asnNumber, 1),
          createInfoPill(`sf-symbol:${d.ipTypeIcon}`, d.ipType, 1)
        ]
      }
    ]
  }
}

/**
 * 主屏幕 Medium 中尺寸 (2x4，主力黄金尺寸)
 * 结构：
 *  - Header: 图标 + "节点 IP 纯净度" + IP协议标签 + 弹性 Spacer + 纯净度等级 Badge
 *  - Hero: IP 地址 (大字 Title3) + 位置详情 (Caption1)
 *  - Spacer
 *  - Grid: 3 个精致数据胶囊卡片 (类型 | ASN组织 | 风险评估)
 */
function renderSystemMedium(d) {
  return {
    type: "widget",
    padding: 14,
    gap: 8,
    children: [
      // 1. Header 顶栏
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "image", src: "sf-symbol:shield.lefthalf.filled", color: d.level.color, width: 15, height: 15 },
          { type: "text", text: "节点 IP 纯净度", font: { size: "footnote", weight: "semibold" }, textColor: C.textPrimary },
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
          createPillBadge(`${d.level.text} · 纯净度 ${d.purity}%`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      // 2. Hero 主区域 (大字 IP + 详细地理位置)
      {
        type: "stack",
        direction: "column",
        gap: 2,
        children: [
          {
            type: "text",
            text: d.displayIP,
            font: { size: 21, weight: "bold" },
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
          }
        ]
      },

      { type: "spacer" },

      // 3. 底部 3 列结构化数据卡片
      {
        type: "stack",
        direction: "row",
        gap: 6,
        children: [
          // 卡片 1: IP 类型
          createDataCard(`sf-symbol:${d.ipTypeIcon}`, d.ipType, 1),
          // 卡片 2: ASN 网络组织
          createDataCard("sf-symbol:globe", d.asnFull, 1.4),
          // 卡片 3: 风险与广播
          createDataCard("sf-symbol:bolt.shield.fill", `欺诈分 ${d.fraudScore} · ${d.broadcastText}`, 1.2)
        ]
      }
    ]
  }
}

/**
 * 主屏幕 Large 大尺寸 (4x4)
 * 结构：
 *  - Header
 *  - Hero 卡片：大号 IP、协议、纯净度进度条与评分
 *  - 4 宫格网格矩阵 (地理位置、网络组织、属性特征、安全风险)
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
          createPillBadge(`${d.level.text}`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },

      // 2. Hero 主面板卡片
      {
        type: "stack",
        direction: "column",
        padding: 12,
        borderRadius: 12,
        backgroundColor: C.cardBg,
        gap: 8,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              {
                type: "text",
                text: d.displayIP,
                font: { size: 24, weight: "bold" },
                textColor: C.textPrimary,
                maxLines: 1,
                minScale: 0.6,
                flex: 1
              },
              {
                type: "stack",
                padding: [3, 8],
                borderRadius: 6,
                backgroundColor: C.cardBgHover,
                children: [
                  { type: "text", text: d.ipVer, font: { size: 12, weight: "bold" }, textColor: C.textSecondary }
                ]
              }
            ]
          },
          // 纯净度水平进度条
          {
            type: "image",
            src: createProgressBarSvg(d.purity, d.level.color),
            height: 6,
            resizable: true
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "text", text: `纯净度评分: ${d.purity} / 100`, font: { size: "caption1", weight: "semibold" }, textColor: d.level.color },
              { type: "spacer" },
              { type: "text", text: `欺诈风险分: ${d.fraudScore}`, font: { size: "caption1" }, textColor: C.textTertiary }
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
          // 第一行两张卡片
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
          // 第二行两张卡片
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
                `检测结果: ${d.level.text}`
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

/**
 * 锁屏圆形 (accessoryCircular)
 * 极简 SVG 环形进度圈 + 纯净度分数值
 */
function renderAccessoryCircular(purity, level) {
  return {
    type: "widget",
    children: [
      {
        type: "image",
        src: createCircularRingSvg(purity, 46, 4),
        width: 46,
        height: 46
      }
    ]
  }
}

/**
 * 锁屏矩形 (accessoryRectangular)
 * 3 行结构化信息
 */
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

/**
 * 锁屏单行 (accessoryInline)
 */
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
// 🛠️ 组件与辅助构造函数 (Reusable UI Builders)
// ══════════════════════════════════════════════════════

/**
 * 创建胶囊徽章 Badge
 */
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

/**
 * 创建单行迷你信息卡 (Small 尺寸底部)
 */
function createInfoPill(iconSrc, text, flex = 1) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 4,
    padding: [4, 6],
    borderRadius: 6,
    backgroundColor: C.cardBg,
    flex,
    children: [
      { type: "image", src: iconSrc, color: C.textTertiary, width: 11, height: 11 },
      {
        type: "text",
        text,
        font: { size: 10, weight: "medium" },
        textColor: C.textSecondary,
        maxLines: 1,
        minScale: 0.75
      }
    ]
  }
}

/**
 * 创建数据卡片 (Medium 尺寸底部 3 列)
 */
function createDataCard(iconSrc, text, flex = 1) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 4,
    padding: [6, 7],
    borderRadius: 8,
    backgroundColor: C.cardBg,
    flex,
    children: [
      { type: "image", src: iconSrc, color: C.textTertiary, width: 12, height: 12 },
      {
        type: "text",
        text,
        font: { size: 11, weight: "medium" },
        textColor: C.textSecondary,
        maxLines: 1,
        minScale: 0.7
      }
    ]
  }
}

/**
 * 创建四宫格卡片 (Large 尺寸矩阵)
 */
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

/**
 * 错误降级小组件
 */
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
// 📊 SVG 矢量图形渲染 (Progress & Ring)
// ══════════════════════════════════════════════════════

/**
 * 大尺寸水平细进度条
 */
function createProgressBarSvg(purity, color) {
  const pct = Math.max(0, Math.min(100, purity))
  const trackColor = "rgba(128,128,128,0.2)"
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 4'><rect width='100' height='4' rx='2' fill='${trackColor}'/><rect width='${pct}' height='4' rx='2' fill='${color}'/></svg>`
}

/**
 * 锁屏圆形极简圆环
 */
function createCircularRingSvg(purity, size, strokeWidth) {
  const half = size / 2
  const r = half - strokeWidth / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, purity)) / 100
  const dash = (circ * pct).toFixed(1)
  const gap = (circ - dash).toFixed(1)
  const fontSize = 15
  const textY = half + fontSize * 0.35
  const track = "rgba(255,255,255,0.2)"
  const color = "#FFFFFF"

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${track}' stroke-width='${strokeWidth}'/><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${color}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash} ${gap}' transform='rotate(-90 ${half} ${half})'/><text x='${half}' y='${textY}' text-anchor='middle' font-size='${fontSize}' font-weight='bold' fill='${color}'>${purity}</text></svg>`
}

// ══════════════════════════════════════════════════════
// 🚦 风险分级与脱敏工具
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
