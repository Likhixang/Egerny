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
const IPPURE_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAARXklEQVR42t1be4xcV3n/fefcx8zsrtdx/MIxtiFWHnZISQklvLR2o6SNeIVKa6VURaSAFF4tNISn0HqDECARWghVK0qqVoqg7IrSB2pDeWS3DYG2BALFJgmJ0zhOHK+9fu1jZu495/z6x7kzc+fOnfVuYpfikVazO3Pnzvm+7/f9vt/3nbOC/y8PQjA5qrBuRnB0PbFn0hYvUQAsqX7/J59Ze9DNDC805IL5ZG5r6swaOG404lZbay+wwCpYDjpwAIHS24bW/u5/XnPH4xgbUxgfd/l7Br9Uo8fGFPbuF0wCkEkLeKMFgCPVrgc/tOXkfGPbiWTuRc64y1OYrevu+b3NltzgaIcAiV0gGgqgACQAIQgAmqAhdKWCo/PzvwngLuyaUhjHL9kBpAB7FPZOEuPjDuPe4K/y/uqnf/C1K0/UT1/TsM3fWHvPm15snL2YkYpdKKAG4AhaBxgCJIQEEjDDT2Y5IIRkjjQ0JkiRXtlvOf93DuCYwuR+gYgFYDWA634ytvnAqZldC83FG97xL3e+wii3zcYCaoJ0gHNA0zhpiBMIIBQBBIR4t4lAIPTmQwDvA2l/qaajctZtUQDc0WkWlyXn3PCJUY3RSQcBBcBbHvncuvuOPHTDfGNhT900X21jWeVAMLFA6iCAEREAVKAIxVuZmQZC2osmAcmg37mi6+EYKzVgoweO3/Dlq203+s+xAyZGNfZMOsCj9+rv3/qypxaPv2UhbbzRRNzgHIGmARytx6sICAXxhkjZEllYMfvxaetzdAyVqjB8ZPa3794pIibzIM9dCoyNKWAc2DNpAyjsnH7na55JTv3RQyefvM7EAjoDWciMhiiI6I5xPo5CAYSe2ZCFuW1Tv9BJrpx4CyWjCTo39IGH7qoCmDu3HDA2EmB83GgAl02/5/pj6YmPPJ4cG7FwQGogKawAHaOLi2cuxJTOe+wb5tIX2E6UVmlA9AzrURmM1NmLOoDxaTPyvQ9ftv47b5441Dz6zTk2R2w9cdIwVkQAEQ0R6Vk3WYLv/uAuZkX3szecuQsIhPM4FZ2bKjAxqrFn3JJUL7z37R968PSBD5sQg2gkTomwN9pFQ2WZxueR0vmcFLSUlPlMqOunU7+OvXu7+PK5OeDekQC7J821//ahS573rTf/xXyY7nYmhUpgIUqX2k1ZIn9R4piluFoKkGc7+u0EEv93EoellKmem/HTZsfULa//Uf2J789JczdPJUa5XNRbyKb04rWrYEvutXx8JMcFS+OCOYcUC4WGMgN60GQI4HNPgXtHAtk9bV74r29996HmyTtNmkIZWigJSlHeL5Jd10kBKcWPSy8PZIVCKG3p1+McEYCSbB6OkrODgMz4rd+8+QMzauFO22g6ZeggolHKZdJh5J64ZRHmUgyfXaeycLUSK0OGdPm2yC1CKoEI5t615R0LZUEIng3st33z5nfN6vqn3UJihCXMnpUfyeQfu6ItXbTHMjJslUPxBtMBrBPmtL9ZuKFleEk5KCwlQ8CpXxOVZF/DZ4eAiVGN3dNm+7duee0s61+wi4kVigakrcPbES/CN8cBUpYMzBnUEkSBNzw9SjQeJRZ/DiRPEExRxvXdKcQWdwihFSIVHCEIjPXauzwEcExBxu1L//29O38xf/hvrTFOOZG83SyFeIenyyVtJ9psYSMAXEKkM4SZBdyiL+T6AkG0SUEPAjD9CkNvERQRKFFP+ZiMKGDarQwBhGByv7zv4B3Vx+ePfCUFB5QlCVHSzvAs6oTXnj2avEy5SBe5iRaQQPIMUX+ESA4Rrk6omkJlu0Z1u0ZQE8BI7p6dH4HKcY3k0KSgRf0PAWDXsxFCk6MKeybtV++p7m1EeJGcMoZKgjLxIgXp2s52KZezJCCBgCTSYw7JDODq2X0DIFqrEG3UkACgaWVShhUSrZYhzx+SDUQkC79yQCWIHulnnlpGR2evuO9dVy+45vs517QQ0R77sqREl0yg9Gr5Tm0XDdg5ov4LovEE4Rr+Qj0I1LYHiDd7fqWRnnJJCOAERVZptcbwMxOlmtatjoYeBgDs2uVW5oB9O0hSjhw//lkjVFnSd+JA5sROjszav0u38CEA12H25iFi8THCLmY3VoJ4k0Ztewhd02AqbQBJ23G5xCtBVu46h0CJcvrIDZe85DH/7l4uPwUyjX/ZyLHfakZ8tdRTK1C6RVY9ZQh9NE5e3YlAAiA9TTQPAa5JX9ctoIcUKpsDqKoA1o+/2tWVOaXPolDouwZKqBGk+qe3b9gzjzEoiKwAAfsmqSA4Pn/i/Y6OrWh2ycwSBLQgL3l5SwBKABE0DgP1xwiXElCEEIg3BahdHEHFCkjzswHpY2gZsRaaTJKiNapB9ANPgCNq+RzAMYVxuGvue/+lKcwI68bTaZdeZ3k9ZqGHpwDa53H9gENy2HncOUDHGrXtMeINoY+6zRmenwfkWb1MTbad7SuJ765F64RYHQ1OAQCOrl9BMzQ1pQDg6dNHb7IVHSqKbRfrdv9eCroeZ0ggsIvA4i8szGkHhABSIFytUdtega5quLRgDNDLHe0oq47QYTcvsCO9HUMlyuDwjTte9kMAwOiEW74Ddk1bkmohbb6BiSm5TgpTHHTGVzmyk0CQnibqjzq4hEAgQEpE60NUtlb8xyxySjqvDbqNy0vs0qlIhoCMBJ3EAWMdfvv2DXvmMTGqIbJMBIyNKQj4yu/d9oLUmSvQtL0Kuo2zfCvLQuSB9ARQf9z5t7QAhog3xoifF/vZviuRy8UGqSCY2igopgDaxoOkUlZkOKxNEABG+xe6Xgfs8vCfXZi7ihUdtjITS6m6/N/OM3t6HKg/4XxdFACGqGyqIF4fgyaTv8wZ2yqRLq/nC9qBfbihexGOoVZhkwfffumrvpOpObdiIVQ3zRc732uzk4M5FmxFPf8SfWE1J4H6k/R3FwEcULmoinBtBJqsvIlAtPjqoBVEK0ig/O9K2lWjmwNKiJYFBzlxqhKhGlW/cuuWPXXcOxL00Wx9dMDULieYRmLSK4nWfkZuMUsM4yUQmDmgfjAzngQsUNlcQ7Q2Aq1/nYZwqQNTB2foX291wIFAhQIVKkgkkCDTuy6XZoJCCnZGoFTQQd3Wt11w0RcPtdXf9JmmjN1NOUm19u9v+mlTu52SWAeIKs7e2R7XS2vuBFsH6geYW4+g9vwB6FUBzFwKt2Bh6gYucT4NWggqW5ESqEBB1RSCIY1gSGftV8nKO4ExHIyCVYm66/Drvvg2ZlJ+KbEb9HYngnf+958Pk1hP4/xGoxSSvjWCygfBCBoHCTo/vREC4ZoYtmnReKQOl9jOXla2rQclS07AnXFwpxzMbAo9HKD2gip6d7fai6BTVGGT9W1rnv/JpwHB6A6eqdfrdkA2Mv7J6QNrHN1wezLDM4wjBWg8CbhmNrLKZnXpySaYOF8BVImY6XfflpOyaqMHNOJ1lc4euJRMgEiranFQS/SX7n/Vxx7zpW/cnskB3SS41z9ZhwFAwg4j9yF9esZvzgDmNNvGtzckHIBQdZNZv9lfntCtAyyhQoV4YxW1Fw5CD2h/v7Ken3AMlAoaPHbZ2ud/AmNQ2Hfm6PciYHK/AEAjaVSoRWA73aWU7MCKJsycIDniDySUjrB5BsZppZ5r3VNBDwUIV4XQQyEkk82wnU1/MD9UEpB0Ko6CYal85Lsv/+iRViO3cgdkOaN04DKC6m7Iim29ETSfwtI7O1LYAnOF95RARRq6oqEHAgS10LO/wFeHFB3O6BqbZxFxsKiFQdzk1ME3fv4vsQziO2M7vNoNzollCkEIgpT8OMJPcEQDjacly3sp36nIG6wEohVURUGFCirWUJF/llBBdOfecOzaJy1OWtjuNukYiIRWndp64ca3HiVludDv44C9BMYxMLx6Vo7LApSspu0aNfgv117jpycy6Bejb7O2JNLQ1QBBTXuDQ98ZikgvMoyAwvJDALl2Iz+JJeBUGAWrdeVtP3z1+IGVQP9MOkCv+/qbHqyLuUIS5zpk2fnqxccFrlGgUefLXDAYIhyOoKvaC5m2Hd3KEZIfcef2ArD0dmoW/FRWVcLBRH/m8I1fuA33jgXYPW5Wus+jer5rDEqL2ED0E9CSUX1O7WkgmRW4euHTltADIapbBlG5qAY9GPiFWq/06HLG55vJnEe6HMQc2RX0Eq0zGIjDaqLuefoNd34QE6Mau1YW+SWaoRHlAEQqelD8DKSzRiFsA0hmASh2MXi0rorK5gHoivYqz7LPtnZBx7cFobTR0PVJdoSeP+1Bw1oUVI164LWXXrVHRIjRCbeU3l+ZA7LJyXAQfU9ZAPTXtEgpOdbamOi0qfHzaogujIEs2l2ju7IZXmlJ6RjZBkJRKbeMd3r/NRsvec1fXf62OXBM+vX6z84B2eRk++qLH9ApTlGLogNFCWwdMKfyG5REvKGGYFUIZ1zPgIKFcVWn9SXKNskKxubvRToaDsZBjcGPXjy49bp/evl7j2Rqzz2XIw6qRIYSY1D/8MrbZioqvB9R4IEHIj3mW1uIz/nwggqCVRGYsnePP3MQ29tmhb62rBEqymHvAOucgwxVglUu+Mc3bXvJtd++/oNPr7Ter2wekPHAQFz7mhIlEMAtCsx8Fn1LqEqAcE0FNK6jzsoOQGQR7xoi9UrZsp6fII2LtQ6jEOtc/PGjv/Nnb/jcVTefxNiYOhvG9x+qkwIRvvX+O9b83ZP/9XBTmQuTg4Q5DWnN8eNNg9ADgSc7KQte4Yhb/r0WL5Scl/LjF1pqCVQtRsWqH24Jh2/70es+MUW2Zu7PPueXhwARYmJU3/WKW48PxJW7qSOxc7BQXperSgBVDTzhFf0p0i5qbdlWinwpDJfpQBqnIRiMg1iHx9ZL7daZS2555QOv+8QUJ0a1PyR79ow/w8bIDoKQy7dd9Hl5mjOE+AWQ0ENRLpIFwU/2mdV1VwS2ihphHEkXaiWDcVAJoiMbVO3jI+suv+qx13/ms3LFFcnZyvflp0C+4QNYuf2m7y+E7hokxgKCePMQlVYCUKSFY0FO1rW3J3M7xCDoz26SItDQDDVUqKGNQ0WCHw9F1btftWHbl//mZe9+Jrc56wAQ5+ghZ9oZ3v65W655fP7EfdYagaXSFw4g2jQEGutPc1vXxnX7gGrX0aDW4FMgSkGUgiKgm7YZhfrnA1Hl28O1wW/8+Lrb7xN/kjw7YD3hzjbcl90N+hSYEQFwdHHuZhsqDUOrRLAhGviYYlRr2mSnddjmqNY5cJjCGAoaSgmcy5oWsQDqCmoudOqpAOqpQPS+1WHtgY0Xrv3pvdd+4NEZZzN/fdwftd07Zf2R+nN/kH2JKuA703dOfGHwSw9NP5oIN0AEMeVh87GJy2xGHkppvOOhv1718OEjw6fmFgeNtlVNRNbCBTpqVKpIhsNVpy+vbFi446U3nXJ0vSO9sZEAO9fzXEN9ZQ7I4L/1T95+w5PNuX92zSRBJY5WGfzp+5JLbh3HVIT961NMrpCYRkc1dswIdq4n9u0gxsf5yzD6zCmwb0YA4Pjiwo0u9D5SJIarA98d/+i4w8RoivFJ265lfpjqZ4rZWA2jO9iaMWLvXl++Js8Nk59tBAgA/uxnE9Gvf/1r+xLltsMSAeTkyAUXb//Oez41W/yng1/lR9nmqADAnqmpHQ68GMY6hAqRDh+Z/sNPzwLnj/F9hJDfHJ1ZmL/aRloASaA1Aqj7LAmMjWicR4++SrBhzZXZlr8IgUoY/pg4/x4lDph22kv+F8H6/3lSllgTDz4JANi5nue3A8bhDCnWurXZkDOAMYs6MAfyA5Pz1QGtqqBFIQYJKAWt1OwfrNt9bHntw6+2AwhAtIgx1i1AxELBadGzfzw62jjfKkB5CkyMKgIYjOP/QDXUEoeqooNvKBGebxWgXAnu20ECuPyiLZ/cP3NoKLZy8PpNOz91NyGQaXu+OeB/AZ99ylfOJelbAAAAAElFTkSuQmCC";

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
