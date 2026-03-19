const API_URL = "https://my.ippure.com/v1/info";

export default async function(ctx) {
  const env = (ctx && ctx.env) || {};
  const markIP = String(env.MARK_IP || "false").toLowerCase() === "true";
  const title = env.TITLE || "IP 纯净度";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return buildWidget(data, { title, markIP });
  } catch (error) {
    return buildErrorWidget(title, error);
  }
}

function buildWidget(data, options) {
  const ip = data && data.ip ? data.ip : "-";
  const risk = Number(data && data.fraudScore != null ? data.fraudScore : 0);
  const isIPv6 = ip.includes(":");
  const displayIP = options.markIP ? maskIP(ip) : ip;
  const ipLabel = isIPv6 ? "IPv6" : "IPv4";
  const region = [flagEmoji(data.countryCode), data.country, data.city].filter(Boolean).join(" ") || "位置未知";
  const asnLine = data.asn ? `AS${data.asn} ${data.asOrganization || ""}`.trim() : (data.asOrganization || "ASN 未知");
  const nativeText = data.isResidential ? "原生住宅" : "机房/商业";
  const riskMeta = getRiskMeta(risk);
  const scoreText = String(Math.max(0, Math.min(99, Math.round(risk))));

  return {
    type: "widget",
    padding: 14,
    gap: 10,
    backgroundGradient: {
      colors: riskMeta.gradient,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "stack",
            direction: "column",
            gap: 2,
            flex: 1,
            children: [
              {
                type: "text",
                text: options.title,
                font: { size: "headline", weight: "bold" },
                textColor: "#FFFFFF"
              },
              {
                type: "text",
                text: region,
                font: { size: "caption1", weight: "medium" },
                textColor: "#D7E4F5",
                opacity: 0.92
              }
            ]
          },
          {
            type: "stack",
            padding: [6, 10, 6, 10],
            backgroundColor: riskMeta.badgeBackground,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: riskMeta.badgeBorder,
            children: [
              {
                type: "text",
                text: riskMeta.badge,
                font: { size: "caption2", weight: "bold" },
                textColor: "#FFFFFF"
              }
            ]
          }
        ]
      },
      {
        type: "stack",
        direction: "row",
        gap: 10,
        children: [
          {
            type: "stack",
            flex: 1,
            padding: 12,
            gap: 2,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.16)",
            children: [
              {
                type: "text",
                text: "风险分数",
                font: { size: "caption2", weight: "semibold" },
                textColor: "#CFE0F2"
              },
              {
                type: "text",
                text: scoreText,
                font: { size: "title1", weight: "bold" },
                textColor: "#FFFFFF"
              },
              {
                type: "text",
                text: riskMeta.scoreLabel,
                font: { size: "caption1", weight: "semibold" },
                textColor: riskMeta.accent
              }
            ]
          },
          {
            type: "stack",
            flex: 2,
            direction: "column",
            gap: 8,
            children: [
              statCard("IP 地址", `${ipLabel} ${displayIP}`),
              statCard("网络属性", nativeText),
              statCard("ASN", asnLine)
            ]
          }
        ]
      },
      {
        type: "stack",
        direction: "row",
        gap: 8,
        children: [
          footerCard("来源", "IPPure"),
          footerCard("更新", {
            type: "date",
            date: new Date().toISOString(),
            format: "relative",
            font: { size: "caption2", weight: "medium" },
            textColor: "#E8EEF8"
          })
        ]
      }
    ]
  };
}

function buildErrorWidget(title, error) {
  return {
    type: "widget",
    padding: 14,
    gap: 10,
    backgroundGradient: {
      colors: ["#35131A", "#5E1D29", "#7A2634"],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "text",
        text: title,
        font: { size: "headline", weight: "bold" },
        textColor: "#FFFFFF"
      },
      {
        type: "stack",
        padding: 12,
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.10)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        children: [
          {
            type: "text",
            text: "小组件暂时无法获取纯净度",
            font: { size: "subheadline", weight: "semibold" },
            textColor: "#FFFFFF"
          },
          {
            type: "text",
            text: String(error && error.message ? error.message : error || "Unknown error"),
            font: { size: "caption1" },
            textColor: "#FFD2D8"
          }
        ]
      },
      {
        type: "date",
        date: new Date().toISOString(),
        format: "relative",
        font: { size: "caption2", weight: "medium" },
        textColor: "#FFD2D8"
      }
    ]
  };
}

function statCard(label, value) {
  return {
    type: "stack",
    direction: "column",
    gap: 2,
    padding: [9, 10, 9, 10],
    backgroundColor: "rgba(7,14,24,0.20)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    children: [
      {
        type: "text",
        text: label,
        font: { size: "caption2", weight: "semibold" },
        textColor: "#C9D8EA"
      },
      {
        type: "text",
        text: value,
        font: { size: "caption1", weight: "medium" },
        textColor: "#FFFFFF"
      }
    ]
  };
}

function footerCard(label, value) {
  return {
    type: "stack",
    flex: 1,
    direction: "column",
    gap: 2,
    padding: [8, 10, 8, 10],
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    children: [
      {
        type: "text",
        text: label,
        font: { size: "caption2", weight: "semibold" },
        textColor: "#C9D8EA"
      },
      typeof value === "string"
        ? {
            type: "text",
            text: value,
            font: { size: "caption2", weight: "medium" },
            textColor: "#E8EEF8"
          }
        : value
    ]
  };
}

function getRiskMeta(risk) {
  if (risk >= 80) {
    return {
      badge: "极高风险",
      scoreLabel: "建议更换节点",
      accent: "#FFB8C4",
      badgeBackground: "rgba(150,26,50,0.42)",
      badgeBorder: "rgba(255,190,205,0.22)",
      gradient: ["#22070C", "#571420", "#8B2536"]
    };
  }

  if (risk >= 70) {
    return {
      badge: "高风险",
      scoreLabel: "可用性偏低",
      accent: "#FFD38B",
      badgeBackground: "rgba(164,89,8,0.42)",
      badgeBorder: "rgba(255,222,170,0.22)",
      gradient: ["#1D1308", "#5B3610", "#945816"]
    };
  }

  if (risk >= 40) {
    return {
      badge: "中等风险",
      scoreLabel: "谨慎使用",
      accent: "#FFF0A6",
      badgeBackground: "rgba(143,124,18,0.34)",
      badgeBorder: "rgba(255,244,186,0.22)",
      gradient: ["#16170B", "#4A4512", "#807325"]
    };
  }

  return {
    badge: "低风险",
    scoreLabel: "纯净度良好",
    accent: "#A9FFD1",
    badgeBackground: "rgba(21,112,74,0.34)",
    badgeBorder: "rgba(181,255,217,0.20)",
    gradient: ["#081A16", "#0F342B", "#1F6C55"]
  };
}

function maskIP(ip) {
  if (!ip) return "";

  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.*.*`;
  }

  const parts = ip.split(":");
  return `${parts[0] || "*"}:${parts[1] || "*"}:*:*:*:*:*:*`;
}

function flagEmoji(code) {
  if (!code) return "";
  const normalized = code.toUpperCase() === "TW" ? "CN" : code.toUpperCase();
  return String.fromCodePoint(
    ...normalized.split("").map((char) => 127397 + char.charCodeAt(0))
  );
}
