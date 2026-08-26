/*
 * IPPure 节点 IP 纯净度 — Egern 新式小组件版
 * 支持尺寸：systemSmall / systemMedium / systemLarge / accessoryRectangular（锁屏矩形）
 * 数据源：https://my.ippure.com/v1/info
 * 环境变量：MarkIP = true 时对 IP 地址打码显示
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
      children: [
        { type: "text", text: "节点 IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: "#FFFFFF" },
        { type: "spacer" },
        { type: "text", text: "请求失败", font: { size: "subheadline" }, textColor: "#FF3B30" }
      ],
      backgroundColor: "#1A1A2E"
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

  // 锁屏圆形
  if (family === "accessoryCircular") {
    return {
      type: "widget",
      children: [
        { type: "text", text: `${risk}`, font: { size: "title3", weight: "bold" }, textColor: level.color },
        { type: "text", text: level.label, font: { size: "caption2" }, textColor: level.color }
      ]
    }
  }

  // 主屏小尺寸
  if (family === "systemSmall") {
    return {
      type: "widget",
      backgroundGradient: { type: "linear", colors: ["#1A1A2E", "#16213E"], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
      padding: 14,
      children: [
        { type: "stack", direction: "row", alignItems: "center", gap: 6, children: [
          { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 14, height: 14 },
          { type: "text", text: "IP 纯净度", font: { size: "caption1", weight: "semibold" }, textColor: "#A0A0B0" }
        ]},
        { type: "spacer" },
        { type: "text", text: showIP, font: { size: "headline", weight: "bold" }, textColor: "#FFFFFF", maxLines: 1, minScale: 0.5 },
        { type: "text", text: `${ipLabel} · ${flag} ${j.country || ""}`.trim(), font: { size: "caption2" }, textColor: "#C0C0D0", maxLines: 1 },
        { type: "spacer" },
        { type: "text", text: `${level.text} (${risk})`, font: { size: "footnote", weight: "semibold" }, textColor: level.color }
      ]
    }
  }

  // 主屏大尺寸
  if (family === "systemLarge") {
    return {
      type: "widget",
      backgroundGradient: { type: "linear", colors: ["#1A1A2E", "#16213E"], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
      padding: 16,
      children: [
        { type: "stack", direction: "row", alignItems: "center", gap: 8, children: [
          { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 20, height: 20 },
          { type: "text", text: "节点 IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: "#FFFFFF", flex: 1 },
          { type: "text", text: `${level.text} (${risk})`, font: { size: "footnote", weight: "semibold" }, textColor: level.color }
        ]},
        { type: "spacer", length: 12 },
        { type: "text", text: `${ipLabel}：${showIP}`, font: { size: "subheadline", weight: "medium" }, textColor: "#FFFFFF" },
        { type: "text", text: `ASN：${asnText}`, font: { size: "subheadline" }, textColor: "#C0C0D0", maxLines: 1, minScale: 0.6 },
        { type: "text", text: `位置：${locationText}`, font: { size: "subheadline" }, textColor: "#C0C0D0", maxLines: 1 },
        { type: "text", text: `原生 IP：${nativeText}`, font: { size: "subheadline" }, textColor: "#C0C0D0", maxLines: 1 },
        { type: "spacer" },
        { type: "text", text: `${level.text} · 分数 ${risk}/100`, font: { size: "caption2" }, textColor: level.color }
      ]
    }
  }

  // 主屏中尺寸（默认）
  return {
    type: "widget",
    backgroundGradient: { type: "linear", colors: ["#1A1A2E", "#16213E"], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } },
    padding: 14,
    children: [
      { type: "stack", direction: "row", alignItems: "center", gap: 6, children: [
        { type: "image", src: "sf-symbol:" + widgetIcon, color: level.color, width: 16, height: 16 },
        { type: "text", text: "节点 IP 纯净度", font: { size: "headline", weight: "bold" }, textColor: "#FFFFFF" }
      ]},
      { type: "spacer", length: 8 },
      { type: "stack", direction: "row", gap: 12, children: [
        { type: "stack", direction: "column", flex: 1, gap: 4, children: [
          { type: "text", text: showIP, font: { size: "title3", weight: "bold" }, textColor: "#FFFFFF", maxLines: 1, minScale: 0.5 },
          { type: "text", text: `${ipLabel} · ${locationText}`.trim(), font: { size: "caption2" }, textColor: "#C0C0D0", maxLines: 1, minScale: 0.7 }
        ]},
        { type: "stack", direction: "column", flex: 1, gap: 4, children: [
          { type: "text", text: asnText, font: { size: "caption1" }, textColor: "#C0C0D0", maxLines: 1, minScale: 0.6 },
          { type: "text", text: `原生：${nativeText}`, font: { size: "caption1" }, textColor: "#C0C0D0", maxLines: 1 }
        ]}
      ]},
      { type: "spacer" },
      { type: "text", text: `${level.text} (${risk})`, font: { size: "footnote", weight: "semibold" }, textColor: level.color }
    ]
  }
}

function riskLevel(risk) {
  if (risk >= 80) return { text: "🛑 极高风险", label: "极高", color: "#FF3B30" }
  if (risk >= 70) return { text: "⚠️ 高风险", label: "高", color: "#FF9500" }
  if (risk >= 40) return { text: "🔶 中等风险", label: "中", color: "#FFCC00" }
  return { text: "✅ 低风险", label: "低", color: "#34C759" }
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
