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
  const ipLabel = isIPv6 ? "IPv6" : "IPv4";
  const displayIP = options.markIP ? maskIP(ip) : ip;
  const region = [flagEmoji(data.countryCode), data.country, data.city].filter(Boolean).join(" ");
  const asn = data.asn ? `AS${data.asn}` : "ASN -";
  const asOrg = data.asOrganization || "Unknown";
  const nativeText = data.isResidential ? "原生住宅" : "机房/商业";
  const riskMeta = getRiskMeta(risk);

  return {
    type: "widget",
    padding: 16,
    backgroundGradient: {
      colors: riskMeta.gradient,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "stack",
        direction: "column",
        gap: 10,
        children: [
          {
            type: "stack",
            direction: "row",
            children: [
              {
                type: "text",
                text: options.title,
                font: { size: "headline", weight: "bold" },
                textColor: "#FFFFFF"
              },
              {
                type: "spacer"
              },
              {
                type: "text",
                text: riskMeta.badge,
                font: { size: "caption2", weight: "semibold" },
                textColor: riskMeta.badgeColor
              }
            ]
          },
          {
            type: "text",
            text: `${ipLabel} ${displayIP}`,
            font: { size: "title3", weight: "bold" },
            textColor: "#FFFFFF"
          },
          {
            type: "stack",
            direction: "column",
            gap: 4,
            children: [
              secondaryText(`风险分数 ${risk}`),
              secondaryText(region || "位置未知"),
              secondaryText(`${asn} ${asOrg}`),
              secondaryText(nativeText)
            ]
          }
        ]
      }
    ]
  };
}

function buildErrorWidget(title, error) {
  return {
    type: "widget",
    padding: 16,
    backgroundGradient: {
      colors: ["#3A0F16", "#5C1D2B"],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "stack",
        direction: "column",
        gap: 8,
        children: [
          {
            type: "text",
            text: title,
            font: { size: "headline", weight: "bold" },
            textColor: "#FFFFFF"
          },
          {
            type: "text",
            text: "IPPure 请求失败",
            font: { size: "title3", weight: "semibold" },
            textColor: "#FFFFFF"
          },
          {
            type: "text",
            text: String(error && error.message ? error.message : error || "Unknown error"),
            font: { size: "caption1" },
            textColor: "#F3C7CF"
          }
        ]
      }
    ]
  };
}

function secondaryText(text) {
  return {
    type: "text",
    text,
    font: { size: "caption1" },
    textColor: "#E7EEF7"
  };
}

function getRiskMeta(risk) {
  if (risk >= 80) {
    return {
      badge: "极高风险",
      badgeColor: "#FFB4B4",
      gradient: ["#451014", "#7A1F28"]
    };
  }

  if (risk >= 70) {
    return {
      badge: "高风险",
      badgeColor: "#FFD7A1",
      gradient: ["#4A2A08", "#8A4B10"]
    };
  }

  if (risk >= 40) {
    return {
      badge: "中等风险",
      badgeColor: "#FFF0A6",
      gradient: ["#4A3C08", "#85711B"]
    };
  }

  return {
    badge: "低风险",
    badgeColor: "#B8FFD1",
    gradient: ["#0F2E22", "#1E5B42"]
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
