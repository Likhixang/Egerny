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
    gap: 12,
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
        alignItems: "start",
        children: [
          {
            type: "stack",
            direction: "column",
            gap: 3,
            flex: 1,
            children: [
              {
                type: "text",
                text: options.title,
                font: { size: "subheadline", weight: "semibold" },
                textColor: "#1B1F23"
              },
              {
                type: "text",
                text: region,
                font: { size: "caption2", weight: "medium" },
                textColor: "#7A8696",
                opacity: 0.92
              }
            ]
          },
          {
            type: "stack",
            padding: [5, 9, 5, 9],
            backgroundColor: riskMeta.badgeBackground,
            borderRadius: 12,
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
        direction: "column",
        gap: 10,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            padding: [14, 14, 14, 14],
            gap: 12,
            backgroundColor: riskMeta.cardBackground,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: riskMeta.cardBorder,
            children: [
              {
                type: "stack",
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: riskMeta.scoreBackground,
                alignItems: "center",
                children: [
                  {
                    type: "stack",
                    direction: "column",
                    flex: 1,
                    gap: 0,
                    children: [
                      { type: "spacer" },
                      {
                        type: "text",
                        text: scoreText,
                        font: { size: "title2", weight: "bold" },
                        textColor: "#11161C",
                        textAlign: "center"
                      },
                      {
                        type: "text",
                        text: "分",
                        font: { size: "caption2", weight: "semibold" },
                        textColor: "#6F7B89",
                        textAlign: "center"
                      },
                      { type: "spacer" }
                    ]
                  }
                ]
              },
              {
                type: "stack",
                flex: 1,
                direction: "column",
                gap: 3,
                children: [
                  {
                    type: "text",
                    text: "风险分数",
                    font: { size: "caption1", weight: "semibold" },
                    textColor: "#6B7C92"
                  },
                  {
                    type: "text",
                    text: riskMeta.scoreLabel,
                    font: { size: "title3", weight: "bold" },
                    textColor: "#1D232B",
                    maxLines: 1,
                    minScale: 0.8
                  },
                  {
                    type: "text",
                    text: riskMeta.hint,
                    font: { size: "caption2", weight: "medium" },
                    textColor: riskMeta.accent
                  }
                ]
              }
            ]
          },
          {
            type: "stack",
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
    direction: "row",
    gap: 8,
    padding: [10, 12, 10, 12],
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
      { type: "spacer" },
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
    gap: 3,
    padding: [9, 10, 9, 10],
    backgroundColor: "#FFFFFFCC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8EF",
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
      scoreLabel: "风险偏高",
      hint: "建议更换节点",
      accent: "#B54B5B",
      badgeText: "#8D2336",
      badgeBackground: "#FBE4E8",
      badgeBorder: "#F3C6CE",
      background: "#FBFBFC",
      scoreBackground: "#F8E4E8",
      cardBackground: "#FFFFFF",
      cardBorder: "#E7E8EC",
      gradient: ["#FCFCFD", "#F6F1F3"]
    };
  }

  if (risk >= 70) {
    return {
      badge: "高风险",
      scoreLabel: "可用性偏低",
      hint: "更适合临时使用",
      accent: "#A96C1B",
      badgeText: "#8A520C",
      badgeBackground: "#FDF0DE",
      badgeBorder: "#F1D5A8",
      background: "#FBFBFC",
      scoreBackground: "#F8EEDC",
      cardBackground: "#FFFFFF",
      cardBorder: "#E7E8EC",
      gradient: ["#FCFCFD", "#F6F3EE"]
    };
  }

  if (risk >= 40) {
    return {
      badge: "中等风险",
      scoreLabel: "谨慎使用",
      hint: "基础访问通常可用",
      accent: "#8D7B1D",
      badgeText: "#74630E",
      badgeBackground: "#F9F4DA",
      badgeBorder: "#ECE1A4",
      background: "#FBFBFC",
      scoreBackground: "#F5F1DE",
      cardBackground: "#FFFFFF",
      cardBorder: "#E7E8EC",
      gradient: ["#FCFCFD", "#F5F4EF"]
    };
  }

  return {
    badge: "低风险",
    scoreLabel: "纯净度良好",
    hint: "适合日常使用",
    accent: "#1C8162",
    badgeText: "#12654D",
    badgeBackground: "#DDF5EC",
    badgeBorder: "#B7E8D7",
    background: "#FBFBFC",
    scoreBackground: "#E6F4EE",
    cardBackground: "#FFFFFF",
    cardBorder: "#E7E8EC",
    gradient: ["#FCFCFD", "#F1F6F3"]
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
