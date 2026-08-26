/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件版
 * 设计：iOS 小组件规范——SF Symbols 图标、系统字体、简洁层级
 * 核心指标：纯净度 = 100 - fraudScore，环形进度圈 + 圈内数字
 * 支持尺寸：systemSmall / systemMedium / systemLarge / accessoryCircular / accessoryRectangular / accessoryInline
 * 环境变量：MarkIP = true 时对 IP 地址打码显示
 * 背景跟随系统亮暗模式，文本颜色自适应 light/dark
 */
export default async function(ctx) {
  const url = "https://my.ippure.com/v1/info"
  const markIP = (ctx.env.MarkIP || "false").toLowerCase() === "true"

  let j
  try {
    const resp = await ctx.http.get(url)
    j = await resp.json()
  } catch (e) {
    return {
      type: "widget",
      padding: 16,
      gap: 8,
      children: [
        { type: "stack", direction: "row", alignItems: "center", gap: 6, children: [
          { type: "image", src: "sf-symbol:shield.slash.fill", color: C.secondary, width: 16, height: 16 },
          { type: "text", text: "IP 纯净度", font: { size: "subheadline", weight: "semibold" }, textColor: C.primary }
        ]},
        { type: "spacer" },
        { type: "text", text: "获取失败", font: { size: "footnote" }, textColor: "#FF3B30" }
      ]
    }
  }

  const ip = j.ip || "N/A"
  const isIPv6 = ip.includes(":")
  const ipLabel = isIPv6 ? "IPv6" : "IPv4"
  const showIP = markIP ? maskIP(ip) : ip
  const risk = j.fraudScore || 0
  const purity = Math.max(0, Math.min(100, 100 - risk))
  const asnText = (j.asn ? `AS${j.asn} ${j.asOrganization || ""}` : "N/A").trim()
  const regionText = [j.countryCode, j.region, j.city].filter(Boolean).join(" · ")
  const nativeText = j.isResidential ? "原生" : "机房"

  const level = riskLevel(risk)
  const family = ctx.widgetFamily || "systemMedium"

  // ── 锁屏圆形：纯环形进度圈 ──
  if (family === "accessoryCircular") {
    return {
      type: "widget",
      children: [
        { type: "image", src: purityRing(purity, 50, 5, level.color), width: 50, height: 50 }
      ]
    }
  }

  // ── 锁屏矩形：两行精简 ──
  if (family === "accessoryRectangular") {
    return {
      type: "widget",
      gap: 2,
      children: [
        { type: "text", text: showIP, font: { size: "caption1", weight: "semibold" }, maxLines: 1, minScale: 0.5 },
        { type: "text", text: `${level.text} · ${purity}`, font: { size: "caption2" }, textColor: level.color }
      ]
    }
  }

  // ── 锁屏内联：单行 ──
  if (family === "accessoryInline") {
    return {
      type: "widget",
      children: [
        { type: "text", text: `${showIP} ${level.text}`, font: { size: "caption1", weight: "medium" }, maxLines: 1, minScale: 0.5 }
      ]
    }
  }

  // ── 主屏小尺寸：标题 + 环居中 + 风险标签 ──
  if (family === "systemSmall") {
    return {
      type: "widget",
      padding: 14,
      gap: 4,
      children: [
        header("IP 纯净度", 14),
        { type: "spacer" },
        { type: "stack", direction: "column", alignItems: "center", children: [
          { type: "image", src: purityRing(purity, 84, 8, level.color), width: 84, height: 84 }
        ]},
        { type: "spacer" },
        riskRow(level, purity)
      ]
    }
  }

  // ── 主屏大尺寸：标题 + 大环 + 完整详情 ──
  if (family === "systemLarge") {
    return {
      type: "widget",
      padding: 16,
      gap: 12,
      children: [
        header("节点 IP 纯净度", 18, level, purity),
        { type: "stack", direction: "row", gap: 18, alignItems: "center", children: [
          { type: "image", src: purityRing(purity, 120, 12, level.color), width: 120, height: 120 },
          { type: "stack", direction: "column", flex: 1, gap: 5, children: [
            { type: "text", text: `${ipLabel}：${showIP}`, font: { size: "subheadline", weight: "medium" }, textColor: C.primary, maxLines: 1, minScale: 0.6 },
            { type: "text", text: `ASN：${asnText}`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1, minScale: 0.6 },
            { type: "text", text: `位置：${regionText}`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1, minScale: 0.6 },
            { type: "text", text: `类型：${nativeText} IP`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1 }
          ]}
        ]}
      ]
    }
  }

  // ── 主屏中尺寸（默认）：标题 + 环 + 关键信息 ──
  return {
    type: "widget",
    padding: 14,
    gap: 10,
    children: [
      header("节点 IP 纯净度", 16, level, purity),
      { type: "stack", direction: "row", gap: 16, alignItems: "center", children: [
        { type: "image", src: purityRing(purity, 96, 10, level.color), width: 96, height: 96 },
        { type: "stack", direction: "column", flex: 1, gap: 4, children: [
          { type: "text", text: showIP, font: { size: "title3", weight: "bold" }, textColor: C.primary, maxLines: 1, minScale: 0.5 },
          { type: "text", text: regionText, font: { size: "caption1" }, textColor: C.secondary, maxLines: 1, minScale: 0.7 },
          { type: "text", text: asnText, font: { size: "caption1" }, textColor: C.secondary, maxLines: 1, minScale: 0.7 },
          { type: "text", text: `${ipLabel} · ${nativeText} IP`, font: { size: "caption1" }, textColor: C.secondary, maxLines: 1 }
        ]}
      ]}
    ]
  }
}

// ── 自适应文本颜色（亮/暗模式）──
const C = {
  primary:   { light: "#1C1C1E", dark: "#FFFFFF" },
  secondary: { light: "#6E6E73", dark: "#AEAEB2" }
}

// ── 标题行：盾牌图标 + 标题 + 可选右侧风险标签 ──
function header(title, iconSize, level, purity) {
  const row = [
    { type: "image", src: "sf-symbol:shield.fill", color: C.secondary, width: iconSize, height: iconSize },
    { type: "text", text: title, font: { size: "subheadline", weight: "semibold" }, textColor: C.primary, flex: 1, maxLines: 1 }
  ]
  if (level) {
    row.push({ type: "image", src: "sf-symbol:" + level.icon, color: level.color, width: iconSize - 2, height: iconSize - 2 })
    row.push({ type: "text", text: `${level.text} · ${purity}`, font: { size: "footnote", weight: "semibold" }, textColor: level.color, maxLines: 1 })
  }
  return { type: "stack", direction: "row", alignItems: "center", gap: 6, children: row }
}

// ── 风险标签行（小尺寸底部）──
function riskRow(level, purity) {
  return {
    type: "stack", direction: "row", alignItems: "center", gap: 5,
    children: [
      { type: "image", src: "sf-symbol:" + level.icon, color: level.color, width: 13, height: 13 },
      { type: "text", text: `${level.text} · ${purity}`, font: { size: "footnote", weight: "semibold" }, textColor: level.color, maxLines: 1 }
    ]
  }
}

// ── 纯净度环形进度圈：SVG 内联，填充比例 = 纯净度%，圈内数字 ──
function purityRing(purity, size, strokeWidth, color) {
  const half = size / 2
  const r = half - strokeWidth / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, purity)) / 100
  const dash = circ * pct
  const gap = circ - dash
  const fontSize = Math.round(size * 0.38)
  const textY = Math.round(half + fontSize * 0.36)
  const track = "rgba(128,128,128,0.25)"
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${track}' stroke-width='${strokeWidth}'/><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${color}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash.toFixed(1)} ${gap.toFixed(1)}' transform='rotate(-90 ${half} ${half})'/><text x='${half}' y='${textY}' text-anchor='middle' font-size='${fontSize}' font-weight='bold' fill='${color}'>${purity}</text></svg>`
}

// ── 风险等级（基于 fraudScore，越高越危险）──
function riskLevel(risk) {
  if (risk >= 80) return { text: "极高风险", icon: "exclamationmark.triangle.fill", color: "rgb(255,59,48)" }
  if (risk >= 70) return { text: "高风险",   icon: "exclamationmark.triangle.fill", color: "rgb(255,149,0)" }
  if (risk >= 40) return { text: "中等风险", icon: "exclamationmark.circle.fill",   color: "rgb(255,204,0)" }
  return { text: "低风险", icon: "checkmark.seal.fill", color: "rgb(52,199,89)" }
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
