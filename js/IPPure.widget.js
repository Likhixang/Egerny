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
    refreshAfter: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    backgroundColor: riskMeta.background,
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
                textColor: "#607085",
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
                textColor: riskMeta.badgeText
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
            backgroundColor: riskMeta.cardBackground,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: riskMeta.cardBorder,
            children: [
              {
                type: "text",
                text: "风险分数",
                font: { size: "caption2", weight: "semibold" },
                textColor: "#6B7C92"
              },
              {
                type: "text",
                text: scoreText,
                font: { size: "title1", weight: "bold" },
                textColor: "#16202B"
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
          footerCard("自动刷新", "5 分钟"),
          footerCard("更新", {
            type: "date",
            date: new Date().toISOString(),
            format: "relative",
            font: { size: "caption2", weight: "medium" },
            textColor: "#435469"
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
    refreshAfter: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    backgroundColor: "#F8EDEE",
    backgroundGradient: {
      colors: ["#FFF6F7", "#FBEAEC"],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "text",
        text: title,
        font: { size: "headline", weight: "bold" },
        textColor: "#2D1F24"
      },
      {
        type: "stack",
        padding: 12,
        gap: 6,
        backgroundColor: "#FFFDFD",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#F0D7DC",
        children: [
          {
            type: "text",
            text: "小组件暂时无法获取纯净度",
            font: { size: "subheadline", weight: "semibold" },
            textColor: "#3A2A2F"
          },
          {
            type: "text",
            text: String(error && error.message ? error.message : error || "Unknown error"),
            font: { size: "caption1" },
            textColor: "#8A5A63"
          }
        ]
      },
      {
        type: "date",
        date: new Date().toISOString(),
        format: "relative",
        font: { size: "caption2", weight: "medium" },
        textColor: "#8A5A63"
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE5EE",
    children: [
      {
        type: "text",
        text: label,
        font: { size: "caption2", weight: "semibold" },
        textColor: "#6B7C92"
      },
      {
        type: "text",
        text: value,
        font: { size: "caption1", weight: "medium" },
        textColor: "#1C2733"
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE5EE",
    children: [
      {
        type: "text",
        text: label,
        font: { size: "caption2", weight: "semibold" },
        textColor: "#6B7C92"
      },
      typeof value === "string"
        ? {
            type: "text",
            text: value,
            font: { size: "caption2", weight: "medium" },
            textColor: "#435469"
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
      accent: "#C54E5E",
      badgeText: "#8D2336",
      badgeBackground: "#FBE4E8",
      badgeBorder: "#F3C6CE",
      background: "#FFF8F8",
      cardBackground: "#FFFFFF",
      cardBorder: "#E8D6DA",
      gradient: ["#FFF9F9", "#FDF0F2"]
    };
  }

  if (risk >= 70) {
    return {
      badge: "高风险",
      scoreLabel: "可用性偏低",
      accent: "#B87119",
      badgeText: "#8A520C",
      badgeBackground: "#FDF0DE",
      badgeBorder: "#F1D5A8",
      background: "#FFFBF5",
      cardBackground: "#FFFFFF",
      cardBorder: "#EADFCF",
      gradient: ["#FFFCF7", "#FBF2E4"]
    };
  }

  if (risk >= 40) {
    return {
      badge: "中等风险",
      scoreLabel: "谨慎使用",
      accent: "#9A8618",
      badgeText: "#74630E",
      badgeBackground: "#F9F4DA",
      badgeBorder: "#ECE1A4",
      background: "#FFFDF6",
      cardBackground: "#FFFFFF",
      cardBorder: "#E8E2CB",
      gradient: ["#FFFDF8", "#F8F3E0"]
    };
  }

  return {
    badge: "低风险",
    scoreLabel: "纯净度良好",
    accent: "#1E8A69",
    badgeText: "#12654D",
    badgeBackground: "#DDF5EC",
    badgeBorder: "#B7E8D7",
    background: "#F8FCFB",
    cardBackground: "#FFFFFF",
    cardBorder: "#D7E9E2",
    gradient: ["#FBFEFD", "#EEF7F4"]
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
