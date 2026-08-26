/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件版
 * 重点展示风险值：环形进度圈（填充比例=风险值/100）+ 圈内数字
 * 支持尺寸：systemSmall / systemMedium / systemLarge / accessoryCircular / accessoryRectangular
 * 数据源：https://my.ippure.com/v1/info
 * 环境变量：MarkIP = true 时对 IP 地址打码显示
 * 背景跟随系统亮暗模式（不设固定背景），文本颜色自适应 light/dark
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
          { type: "image", src: "sf-symbol:network.slash", color: C.secondary, width: 16, height: 16 },
          { type: "text", text: "IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: C.primary }
        ]},
        { type: "spacer" },
        { type: "text", text: "请求失败", font: { size: "subheadline" }, textColor: "#FF3B30" }
      ]
    }
  }

  const ip = j.ip || "N/A"
  const isIPv6 = ip.includes(":")
  const ipLabel = isIPv6 ? "IPv6" : "IPv4"
  const showIP = markIP ? maskIP(ip) : ip
  const flag = flagEmoji(j.countryCode)
  const nativeText = j.isResidential ? "是（原生）" : "否（机房/商业）"
  const risk = j.fraudScore || 0
  const asnText = (j.asn ? `AS${j.asn} ${j.asOrganization || ""}` : "N/A").trim()
  const locationText = `${flag} ${j.country || ""} ${j.city || ""}`.trim()

  const level = riskLevel(risk)
  const widgetIcon = risk >= 70 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill"

  const family = ctx.widgetFamily || "systemMedium"

  // 锁屏圆形：纯圆环 + 风险值数字
  if (family === "accessoryCircular") {
    return {
      type: "widget",
      children: [
        { type: "image", src: riskRing(risk, 58, 6, level.color), width: 58, height: 58 }
      ]
    }
  }

  // 锁屏矩形
  if (family === "accessoryRectangular") {
    return {
      type: "widget",
      children: [
        { type: "text", text: `${flag} ${showIP}`, font: { size: "headline", weight: "semibold" }, maxLines: 1, minScale: 0.5 },
        { type: "text", text: `${level.text} (${risk})`, font: { size: "subheadline" }, textColor: level.color }
      ]
    }
  }

  // 锁屏内联
  if (family === "accessoryInline") {
    return {
      type: "widget",
      children: [
        { type: "text", text: `${flag} ${showIP} ${level.text}`, font: { size: "subheadline", weight: "medium" }, maxLines: 1, minScale: 0.5 }
      ]
    }
  }

  // 主屏小尺寸：标题 + 圆环居中 + 风险等级
  if (family === "systemSmall") {
    return {
      type: "widget",
      padding: 14,
      gap: 6,
      children: [
        { type: "stack", direction: "row", alignItems: "center", gap: 6, children: [
          { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 14, height: 14 },
          { type: "text", text: "IP 纯净度", font: { size: "caption1", weight: "semibold" }, textColor: C.secondary }
        ]},
        { type: "spacer" },
        { type: "stack", direction: "column", alignItems: "center", children: [
          { type: "image", src: riskRing(risk, 84, 9, level.color), width: 84, height: 84 }
        ]},
        { type: "spacer" },
        { type: "stack", direction: "column", alignItems: "center", children: [
          { type: "text", text: `${level.text}`, font: { size: "footnote", weight: "semibold" }, textColor: level.color },
          { type: "text", text: showIP, font: { size: "caption2" }, textColor: C.secondary, maxLines: 1, minScale: 0.6 }
        ]}
      ]
    }
  }

  // 主屏大尺寸：左侧大圆环 + 右侧完整详情
  if (family === "systemLarge") {
    return {
      type: "widget",
      padding: 16,
      gap: 14,
      children: [
        { type: "stack", direction: "row", alignItems: "center", gap: 8, children: [
          { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 20, height: 20 },
          { type: "text", text: "节点 IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: C.primary, flex: 1 },
          { type: "text", text: `${level.text} (${risk})`, font: { size: "footnote", weight: "semibold" }, textColor: level.color }
        ]},
        { type: "stack", direction: "row", gap: 18, alignItems: "center", children: [
          { type: "image", src: riskRing(risk, 132, 13, level.color), width: 132, height: 132 },
          { type: "stack", direction: "column", flex: 1, gap: 6, children: [
            { type: "text", text: `${ipLabel}：${showIP}`, font: { size: "subheadline", weight: "medium" }, textColor: C.primary, maxLines: 1, minScale: 0.6 },
            { type: "text", text: `ASN：${asnText}`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1, minScale: 0.6 },
            { type: "text", text: `位置：${locationText}`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1 },
            { type: "text", text: `原生 IP：${nativeText}`, font: { size: "subheadline" }, textColor: C.secondary, maxLines: 1 }
          ]}
        ]}
      ]
    }
  }

  // 主屏中尺寸（默认）：左圆环 + 右关键信息
  return {
    type: "widget",
    padding: 14,
    gap: 10,
    children: [
      { type: "stack", direction: "row", alignItems: "center", gap: 6, children: [
        { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 16, height: 16 },
        { type: "text", text: "节点 IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: C.primary, flex: 1 },
        { type: "text", text: `${level.text}`, font: { size: "footnote", weight: "semibold" }, textColor: level.color }
      ]},
      { type: "stack", direction: "row", gap: 16, alignItems: "center", children: [
        { type: "image", src: riskRing(risk, 104, 11, level.color), width: 104, height: 104 },
        { type: "stack", direction: "column", flex: 1, gap: 4, children: [
          { type: "text", text: showIP, font: { size: "title3", weight: "bold" }, textColor: C.primary, maxLines: 1, minScale: 0.5 },
          { type: "text", text: `${ipLabel} · ${flag} ${j.country || ""}`.trim(), font: { size: "caption2" }, textColor: C.secondary, maxLines: 1 },
          { type: "text", text: asnText, font: { size: "caption1" }, textColor: C.secondary, maxLines: 1, minScale: 0.6 },
          { type: "text", text: `原生：${nativeText}`, font: { size: "caption1" }, textColor: C.secondary, maxLines: 1 }
        ]}
      ]}
    ]
  }
}

// 自适应文本颜色：随系统亮暗模式切换
const C = {
  primary:   { light: "#1C1C1E", dark: "#FFFFFF" },   // 主文本
  secondary: { light: "#6E6E73", dark: "#AEAEB2" }    // 次要文本
}

// 风险环形进度圈：SVG 内联生成，填充比例 = 风险值/100，圈内显示风险值数字
function riskRing(risk, size, strokeWidth, color) {
  const half = size / 2
  const r = half - strokeWidth / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, risk)) / 100
  const dash = circ * pct
  const gap = circ - dash
  const fontSize = Math.round(size * 0.36)
  const textY = Math.round(half + fontSize * 0.36)
  const track = "rgba(128,128,128,0.25)"
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${track}' stroke-width='${strokeWidth}'/><circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${color}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash.toFixed(1)} ${gap.toFixed(1)}' transform='rotate(-90 ${half} ${half})'/><text x='${half}' y='${textY}' text-anchor='middle' font-size='${fontSize}' font-weight='bold' fill='${color}'>${risk}</text></svg>`
}

function riskLevel(risk) {
  if (risk >= 80) return { text: "🛑 极高风险", label: "极高", color: "rgb(255,59,48)" }
  if (risk >= 70) return { text: "⚠️ 高风险", label: "高", color: "rgb(255,149,0)" }
  if (risk >= 40) return { text: "🔶 中等风险", label: "中", color: "rgb(255,204,0)" }
  return { text: "✅ 低风险", label: "低", color: "rgb(52,199,89)" }
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

function flagEmoji(code) {
  if (!code) return "🌐"
  if (code.toUpperCase() === "TW") code = "CN"
  return String.fromCodePoint(...code.toUpperCase().split("").map(c => 127397 + c.charCodeAt()))
}
