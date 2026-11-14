/*
 * IP 质检 (IPCheck) — Egern 小组件
 * 设计：Apple HIG 现代轻量化双源安全情报看板
 *   - 并列数据源：Net.Coffee（trust_score / 机房判定 / 滥用等级）
 *                IPFinal（多源纯净评分 / 原生性 / 风险因子 / 人机比例）
 *   - 规范：杜绝 Emoji 正文堆砌，SF Symbol 图标与克制排版
 *   - 适配主屏全尺寸：Small / Medium / Large
 *   - IPFinal 接入：/api/pow 挑战 → SHA-256 工作量证明 → AES-256-GCM 解密响应
 */

const NC_BASE = "https://ip.net.coffee";
const IF_BASE = "https://api.ipfinal.com/api";
const IF_ORIGIN = "https://ipfinal.com";
const CHECK_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAARXklEQVR42t1be4xcV3n/fefcx8zsrtdx/MIxtiFWHnZISQklvLR2o6SNeIVKa6VURaSAFF4tNISn0HqDECARWghVK0qqVoqg7IrSB2pDeWS3DYG2BALFJgmJ0zhOHK+9fu1jZu495/z6x7kzc+fOnfVuYpfikVazO3Pnzvm+7/f9vt/3nbOC/y8PQjA5qrBuRnB0PbFn0hYvUQAsqX7/J59Ze9DNDC805IL5ZG5r6swaOG404lZbay+wwCpYDjpwAIHS24bW/u5/XnPH4xgbUxgfd/l7Br9Uo8fGFPbuF0wCkEkLeKMFgCPVrgc/tOXkfGPbiWTuRc64y1OYrevu+b3NltzgaIcAiV0gGgqgACQAIQgAmqAhdKWCo/PzvwngLuyaUhjHL9kBpAB7FPZOEuPjDuPe4K/y/uqnf/C1K0/UT1/TsM3fWHvPm15snL2YkYpdKKAG4AhaBxgCJIQEEjDDT2Y5IIRkjjQ0JkiRXtlvOf93DuCYwuR+gYgFYDWA634ytvnAqZldC83FG97xL3e+wii3zcYCaoJ0gHNA0zhpiBMIIBQBBIR4t4lAIPTmQwDvA2l/qaajctZtUQDc0WkWlyXn3PCJUY3RSQcBBcBbHvncuvuOPHTDfGNhT900X21jWeVAMLFA6iCAEREAVKAIxVuZmQZC2osmAcmg37mi6+EYKzVgoweO3/Dlq203+s+xAyZGNfZMOsCj9+rv3/qypxaPv2UhbbzRRNzgHIGmARytx6sICAXxhkjZEllYMfvxaetzdAyVqjB8ZPa3794pIibzIM9dCoyNKWAc2DNpAyjsnH7na55JTv3RQyefvM7EAjoDWciMhiiI6I5xPo5CAYSe2ZCFuW1Tv9BJrpx4CyWjCTo39IGH7qoCmDu3HDA2EmB83GgAl02/5/pj6YmPPJ4cG7FwQGogKawAHaOLi2cuxJTOe+wb5tIX2E6UVmlA9AzrURmM1NmLOoDxaTPyvQ9ftv47b5441Dz6zTk2R2w9cdIwVkQAEQ0R6Vk3WYLv/uAuZkX3szecuQsIhPM4FZ2bKjAxqrFn3JJUL7z37R968PSBD5sQg2gkTomwN9pFQ2WZxueR0vmcFLSUlPlMqOunU7+OvXu7+PK5OeDekQC7J821//ahS573rTf/xXyY7nYmhUpgIUqX2k1ZIn9R4piluFoKkGc7+u0EEv93EoellKmem/HTZsfULa//Uf2J789JczdPJUa5XNRbyKb04rWrYEvutXx8JMcFS+OCOYcUC4WGMgN60GQI4HNPgXtHAtk9bV74r29996HmyTtNmkIZWigJSlHeL5Jd10kBKcWPSy8PZIVCKG3p1+McEYCSbB6OkrODgMz4rd+8+QMzauFO22g6ZeggolHKZdJh5J64ZRHmUgyfXaeycLUSK0OGdPm2yC1CKoEI5t615R0LZUEIng3st33z5nfN6vqn3UJihCXMnpUfyeQfu6ItXbTHMjJslUPxBtMBrBPmtL9ZuKFleEk5KCwlQ8CpXxOVZF/DZ4eAiVGN3dNm+7duee0s61+wi4kVigakrcPbES/CN8cBUpYMzBnUEkSBNzw9SjQeJRZ/DiRPEExRxvXdKcQWdwihFSIVHCEIjPXauzwEcExBxu1L//29O38xf/hvrTFOOZG83SyFeIenyyVtJ9psYSMAXEKkM4SZBdyiL+T6AkG0SUEPAjD9CkNvERQRKFFP+ZiMKGDarQwBhGByv7zv4B3Vx+ePfCUFB5QlCVHSzvAs6oTXnj2avEy5SBe5iRaQQPIMUX+ESA4Rrk6omkJlu0Z1u0ZQE8BI7p6dH4HKcY3k0KSgRf0PAWDXsxFCk6MKeybtV++p7m1EeJGcMoZKgjLxIgXp2s52KZezJCCBgCTSYw7JDODq2X0DIFqrEG3UkACgaWVShhUSrZYhzx+SDUQkC79yQCWIHulnnlpGR2evuO9dVy+45vs517QQ0R77sqREl0yg9Gr5Tm0XDdg5ov4LovEE4Rr+Qj0I1LYHiDd7fqWRnnJJCOAERVZptcbwMxOlmtatjoYeBgDs2uVW5oB9O0hSjhw//lkjVFnSd+JA5sROjszav0u38CEA12H25iFi8THCLmY3VoJ4k0Ztewhd02AqbQBJ23G5xCtBVu46h0CJcvrIDZe85DH/7l4uPwUyjX/ZyLHfakZ8tdRTK1C6RVY9ZQh9NE5e3YlAAiA9TTQPAa5JX9ctoIcUKpsDqKoA1o+/2tWVOaXPolDouwZKqBGk+qe3b9gzjzEoiKwAAfsmqSA4Pn/i/Y6OrWh2ycwSBLQgL3l5SwBKABE0DgP1xwiXElCEEIg3BahdHEHFCkjzswHpY2gZsRaaTJKiNapB9ANPgCNq+RzAMYVxuGvue/+lKcwI68bTaZdeZ3k9ZqGHpwDa53H9gENy2HncOUDHGrXtMeINoY+6zRmenwfkWb1MTbad7SuJ765F64RYHQ1OAQCOrl9BMzQ1pQDg6dNHb7IVHSqKbRfrdv9eCroeZ0ggsIvA4i8szGkHhABSIFytUdtega5quLRgDNDLHe0oq47QYTcvsCO9HUMlyuDwjTte9kMAwOiEW74Ddk1bkmohbb6BiSm5TgpTHHTGVzmyk0CQnibqjzq4hEAgQEpE60NUtlb8xyxySjqvDbqNy0vs0qlIhoCMBJ3EAWMdfvv2DXvmMTGqIbJMBIyNKQj4yu/d9oLUmSvQtL0Kuo2zfCvLQuSB9ARQf9z5t7QAhog3xoifF/vZviuRy8UGqSCY2igopgDaxoOkUlZkOKxNEABG+xe6Xgfs8vCfXZi7ihUdtjITS6m6/N/OM3t6HKg/4XxdFACGqGyqIF4fgyaTv8wZ2yqRLq/nC9qBfbihexGOoVZhkwfffumrvpOpObdiIVQ3zRc732uzk4M5FmxFPf8SfWE1J4H6k/R3FwEcULmoinBtBJqsvIlAtPjqoBVEK0ig/O9K2lWjmwNKiJYFBzlxqhKhGlW/cuuWPXXcOxL00Wx9dMDULieYRmLSK4nWfkZuMUsM4yUQmDmgfjAzngQsUNlcQ7Q2Aq1/nYZwqQNTB2foX291wIFAhQIVKkgkkCDTuy6XZoJCCnZGoFTQQd3Wt11w0RcPtdXf9JmmjN1NOUm19u9v+mlTu52SWAeIKs7e2R7XS2vuBFsH6geYW4+g9vwB6FUBzFwKt2Bh6gYucT4NWggqW5ESqEBB1RSCIY1gSGftV8nKO4ExHIyCVYm66/Drvvg2ZlJ+KbEb9HYngnf+958Pk1hP4/xGoxSSvjWCygfBCBoHCTo/vREC4ZoYtmnReKQOl9jOXla2rQclS07AnXFwpxzMbAo9HKD2gip6d7fai6BTVGGT9W1rnv/JpwHB6A6eqdfrdkA2Mv7J6QNrHN1wezLDM4wjBWg8CbhmNrLKZnXpySaYOF8BVImY6XfflpOyaqMHNOJ1lc4euJRMgEiranFQS/SX7n/Vxx7zpW/cnskB3SS41z9ZhwFAwg4j9yF9esZvzgDmNNvGtzckHIBQdZNZv9lfntCtAyyhQoV4YxW1Fw5CD2h/v7Ken3AMlAoaPHbZ2ud/AmNQ2Hfm6PciYHK/AEAjaVSoRWA73aWU7MCKJsycIDniDySUjrB5BsZppZ5r3VNBDwUIV4XQQyEkk82wnU1/MD9UEpB0Ko6CYal85Lsv/+iRViO3cgdkOaN04DKC6m7Iim29ETSfwtI7O1LYAnOF95RARRq6oqEHAgS10LO/wFeHFB3O6BqbZxFxsKiFQdzk1ME3fv4vsQziO2M7vNoNzollCkEIgpT8OMJPcEQDjacly3sp36nIG6wEohVURUGFCirWUJF/llBBdOfecOzaJy1OWtjuNukYiIRWndp64ca3HiVludDv44C9BMYxMLx6Vo7LApSspu0aNfgv117jpycy6Bejb7O2JNLQ1QBBTXuDQ98ZikgvMoyAwvJDALl2Iz+JJeBUGAWrdeVtP3z1+IGVQP9MOkCv+/qbHqyLuUIS5zpk2fnqxccFrlGgUefLXDAYIhyOoKvaC5m2Hd3KEZIfcef2ArD0dmoW/FRWVcLBRH/m8I1fuA33jgXYPW5Wus+jer5rDEqL2ED0E9CSUX1O7WkgmRW4euHTltADIapbBlG5qAY9GPiFWq/06HLG55vJnEe6HMQc2RX0Eq0zGIjDaqLuefoNd34QE6Mau1YW+SWaoRHlAEQqelD8DKSzRiFsA0hmASh2MXi0rorK5gHoivYqz7LPtnZBx7cFobTR0PVJdoSeP+1Bw1oUVI164LWXXrVHRIjRCbeU3l+ZA7LJyXAQfU9ZAPTXtEgpOdbamOi0qfHzaogujIEs2l2ju7IZXmlJ6RjZBkJRKbeMd3r/NRsvec1fXf62OXBM+vX6z84B2eRk++qLH9ApTlGLogNFCWwdMKfyG5REvKGGYFUIZ1zPgIKFcVWn9SXKNskKxubvRToaDsZBjcGPXjy49bp/evl7j2Rqzz2XIw6qRIYSY1D/8MrbZioqvB9R4IEHIj3mW1uIz/nwggqCVRGYsnePP3MQ29tmhb62rBEqymHvAOucgwxVglUu+Mc3bXvJtd++/oNPr7Ter2wekPHAQFz7mhIlEMAtCsx8Fn1LqEqAcE0FNK6jzsoOQGQR7xoi9UrZsp6fII2LtQ6jEOtc/PGjv/Nnb/jcVTefxNiYOhvG9x+qkwIRvvX+O9b83ZP/9XBTmQuTg4Q5DWnN8eNNg9ADgSc7KQte4Yhb/r0WL5Scl/LjF1pqCVQtRsWqH24Jh2/70es+MUW2Zu7PPueXhwARYmJU3/WKW48PxJW7qSOxc7BQXperSgBVDTzhFf0p0i5qbdlWinwpDJfpQBqnIRiMg1iHx9ZL7daZS2555QOv+8QUJ0a1PyR79ow/w8bIDoKQy7dd9Hl5mjOE+AWQ0ENRLpIFwU/2mdV1VwS2ihphHEkXaiWDcVAJoiMbVO3jI+suv+qx13/ms3LFFcnZyvflp0C+4QNYuf2m7y+E7hokxgKCePMQlVYCUKSFY0FO1rW3J3M7xCDoz26SItDQDDVUqKGNQ0WCHw9F1btftWHbl//mZe9+Jrc56wAQ5+ghZ9oZ3v65W655fP7EfdYagaXSFw4g2jQEGutPc1vXxnX7gGrX0aDW4FMgSkGUgiKgm7YZhfrnA1Hl28O1wW/8+Lrb7xN/kjw7YD3hzjbcl90N+hSYEQFwdHHuZhsqDUOrRLAhGviYYlRr2mSnddjmqNY5cJjCGAoaSgmcy5oWsQDqCmoudOqpAOqpQPS+1WHtgY0Xrv3pvdd+4NEZZzN/fdwftd07Zf2R+nN/kH2JKuA703dOfGHwSw9NP5oIN0AEMeVh87GJy2xGHkppvOOhv1718OEjw6fmFgeNtlVNRNbCBTpqVKpIhsNVpy+vbFi446U3nXJ0vSO9sZEAO9fzXEN9ZQ7I4L/1T95+w5PNuX92zSRBJY5WGfzp+5JLbh3HVIT961NMrpCYRkc1dswIdq4n9u0gxsf5yzD6zCmwb0YA4Pjiwo0u9D5SJIarA98d/+i4w8RoivFJ265lfpjqZ4rZWA2jO9iaMWLvXl++Js8Nk59tBAgA/uxnE9Gvf/1r+xLltsMSAeTkyAUXb//Oez41W/yng1/lR9nmqADAnqmpHQ68GMY6hAqRDh+Z/sNPzwLnj/F9hJDfHJ1ZmL/aRloASaA1Aqj7LAmMjWicR4++SrBhzZXZlr8IgUoY/pg4/x4lDph22kv+F8H6/3lSllgTDz4JANi5nue3A8bhDCnWurXZkDOAMYs6MAfyA5Pz1QGtqqBFIQYJKAWt1OwfrNt9bHntw6+2AwhAtIgx1i1AxELBadGzfzw62jjfKkB5CkyMKgIYjOP/QDXUEoeqooNvKBGebxWgXAnu20ECuPyiLZ/cP3NoKLZy8PpNOz91NyGQaXu+OeB/AZ99ylfOJelbAAAAAElFTkSuQmCC";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

export default async function (ctx) {
  const markIP = String(ctx.env?.MarkIP || ctx.env?.mark_ip || "false").toLowerCase() === "true";

  // 1. 出口 IP（走 Net.Coffee 自己的 Cloudflare trace，无需第三方）
  const ip = await fetchSelfIP(ctx);

  // 2. 双源并发
  const [ncRes, ifRes] = await Promise.allSettled([
    fetchNetCoffee(ctx, ip),
    fetchIPFinal(ctx, ip)
  ]);

  const nc = ncRes.status === "fulfilled" ? ncRes.value : null;
  const iff = ifRes.status === "fulfilled" ? ifRes.value : null;

  if (!nc && !iff) {
    return renderErrorWidget("所有数据源请求失败");
  }

  const finalIp = ip || nc?.ip || iff?.ip || "N/A";
  const isIPv6 = finalIp.includes(":");
  const ipVer = finalIp === "N/A" ? "IP" : (isIPv6 ? "IPv6" : "IPv4");
  const displayIP = markIP ? maskIP(finalIp) : finalIp;

  // ── Net.Coffee 归一化 ──
  // trust_score：0-100，越大越干净；is_datacenter / isResidential；abuser_score "0.0144 (Elevated)"
  const ncScore = typeof nc?.trust_score === "number" ? clamp100(nc.trust_score) : null;
  const ncDC = nc?.is_datacenter === true;
  const ncHome = nc?.isResidential === true;
  const ncTypeText = nc ? (ncHome ? "住宅 IP" : (ncDC ? "机房 IP" : "普通网络")) : "N/A";
  const ncAbuse = nc?.abuser_score || "";
  const ncAbuseLevel = (ncAbuse.match(/\(([^)]+)\)/) || [, ""])[1];
  const ncAbuseText = nc ? (ncAbuseLevel ? abuserZh(ncAbuseLevel) : "无记录") : "N/A";
  const ncAi = nc?.ai_verdict?.label || "";
  const ncRisky = nc ? (nc.is_vpn || nc.is_proxy || nc.is_tor || nc.is_abuser || nc.is_crawler) : false;

  // ── IPFinal 归一化 ──
  // score.total：0-100，越大越干净；score.level 低/中/高风险；isNative；humanRatio
  const iffScore = typeof iff?.score?.total === "number" ? clamp100(iff.score.total) : null;
  const iffLevelText = iff?.score?.level || "N/A";
  const iffLevelColor = iffLevelTone(iff?.score?.band);
  const iffConf = ({ high: "高", medium: "中", low: "低" })[iff?.score?.confidence] || "—";
  const iffNative = iff ? (iff.isNative === true ? "原生 IP" : (iff.isNative === false ? "广播 IP" : "原生未知")) : "N/A";
  const humanRatio = typeof iff?.humanRatio === "number" ? iff.humanRatio : null;
  const botPct = humanRatio !== null ? Math.round(100 - humanRatio) : null;
  const proxyHit = iff?.factors?.proxy ? `${iff.factors.proxy.hit}/${iff.factors.proxy.total}` : "—";
  const vpnHit = iff?.factors?.vpn ? `${iff.factors.vpn.hit}/${iff.factors.vpn.total}` : "—";
  const iffReasons = Array.isArray(iff?.score?.reasons) ? iff.score.reasons.filter(r => r.type === "bad").slice(0, 3).map(r => r.text) : [];

  // ── 综合分（两源等权） ──
  const parts = [];
  if (ncScore !== null) parts.push(ncScore);
  if (iffScore !== null) parts.push(iffScore);
  const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
  const level = getPurityLevel(overall);

  // ── 位置 / ASN ──
  const countryCode = (iff?.geo?.countryCode || nc?.countryCode || "").toUpperCase();
  const country = iff?.geo?.country || nc?.country || "";
  const city = iff?.geo?.city || nc?.city || "";
  const flag = flagEmoji(countryCode);
  const locShort = [flag, city || country].filter(Boolean).join(" ") || "未知位置";
  const locFull = [flag, city, country, countryCode ? `(${countryCode})` : ""].filter(Boolean).join(" ") || "未知位置";

  const asnNumber = iff?.network?.asn ? `AS${iff.network.asn}` : (nc?.asn ? `AS${nc.asn}` : "AS --");
  const asnOrg = (iff?.network?.asOrg || nc?.asOrganization || "").trim();

  // ── 交叉结论 ──
  const crossText = buildCrossVerdict({ nc, iff, ncScore, iffScore, overall });
  const dataState = nc && iff ? "双源响应正常" : (nc ? "IPFinal 不可用" : "Net.Coffee 不可用");

  const family = ctx.widgetFamily || "systemMedium";

  const model = {
    displayIP, ipVer, locShort, locFull, countryCode, asnNumber, asnOrg,
    overall, level, crossText, dataState,
    ncScore, ncTypeText, ncAbuseText, ncAi, ncRisky, ncDC, ncHome,
    iffScore, iffLevelText, iffLevelColor, iffConf, iffNative, botPct, proxyHit, vpnHit, iffReasons
  };

  if (family === "systemSmall" || family === "accessoryRectangular" || family === "accessoryInline") {
    return renderSystemSmall(model);
  }
  if (family === "accessoryCircular") {
    return renderAccessoryCircular(model);
  }
  if (family === "systemLarge" || family === "systemExtraLarge") {
    return renderSystemLarge(model);
  }
  return renderSystemMedium(model);
}

// ─────────────────────────── 数据抓取 ───────────────────────────

async function fetchSelfIP(ctx) {
  try {
    const resp = await ctx.http.get(`${NC_BASE}/cdn-cgi/trace`, { timeout: 6000 });
    const text = await resp.text();
    const line = String(text).split("\n").find(l => l.startsWith("ip="));
    const ip = line ? line.slice(3).trim() : "";
    return ip && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : "";
  } catch (e) {
    return "";
  }
}

async function fetchNetCoffee(ctx, ip) {
  if (!ip) return null;
  const resp = await ctx.http.get(`${NC_BASE}/api/ip/lookup/${encodeURIComponent(ip)}`, {
    headers: { "accept": "application/json", "referer": `${NC_BASE}/ip/${ip}` },
    timeout: 9000
  });
  if (resp.status !== 200) throw new Error("netcoffee " + resp.status);
  return await resp.json();
}

async function fetchIPFinal(ctx, ip) {
  if (!ip) return null;
  const sess = ipfSession(ctx);
  const pow = await ipfPow(ctx, sess);
  const url = `${IF_BASE}/report/${encodeURIComponent(ip)}`;

  let resp = await ipfGet(ctx, url, sess, pow);
  if (resp.status === 428) {
    // 挑战过期：服务端回传新的 pow 参数
    let fresh = null;
    try {
      const body = await resp.json();
      fresh = body?.pow ? solvePow(body.pow) : null;
    } catch (e) { fresh = null; }
    if (fresh) {
      cachePow(ctx, sess, fresh);
      resp = await ipfGet(ctx, url, sess, fresh);
    }
  }
  if (resp.status !== 200) throw new Error("ipfinal " + resp.status);

  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  let payload;
  if (ctype.includes("ipf-enc")) {
    const raw = new Uint8Array(await resp.arrayBuffer());
    const key = sha256(utf8Encode("aes:" + pow.challenge));
    const { plaintext } = aesGcmDecrypt(key, raw);
    payload = JSON.parse(utf8Decode(plaintext));
  } else {
    payload = await resp.json();
  }
  return payload && payload.data ? payload.data : payload;
}

function ipfHeaders(sess, pow) {
  const h = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "origin": IF_ORIGIN,
    "referer": `${IF_ORIGIN}/`,
    "x-client": "ip-risk-client",
    "ip-session": sess,
    "user-agent": UA
  };
  if (pow) {
    h["x-pow-challenge"] = pow.challenge;
    h["x-pow-nonce"] = pow.nonce;
  }
  return h;
}

async function ipfGet(ctx, url, sess, pow) {
  return await ctx.http.get(url, { headers: ipfHeaders(sess, pow), timeout: 12000, credentials: "omit" });
}

async function ipfPow(ctx, sess) {
  // 复用未过期的挑战，避免每次刷新都算一遍
  try {
    const cached = ctx.storage.getJSON("ipcheck:pow");
    if (cached && cached.challenge && cached.nonce && cached.expiresAt > Date.now() && cached.session === sess) {
      return cached;
    }
  } catch (e) { /* ignore */ }

  let data = null;
  try {
    const resp = await ctx.http.get(`${IF_BASE}/pow`, {
      headers: ipfHeaders(sess, null),
      timeout: 8000,
      credentials: "omit"
    });
    const body = await resp.json();
    data = body?.data || body?.pow || null;
  } catch (e) {
    data = null;
  }
  if (!data || !data.challenge) throw new Error("ipfinal pow unavailable");

  const solved = solvePow(data);
  cachePow(ctx, sess, solved);
  return solved;
}

function cachePow(ctx, sess, pow) {
  try {
    ctx.storage.setJSON("ipcheck:pow", {
      challenge: pow.challenge,
      difficulty: pow.difficulty,
      nonce: pow.nonce,
      session: sess,
      expiresAt: pow.expiresAt
    });
  } catch (e) { /* ignore */ }
}

function ipfSession(ctx) {
  try {
    const s = ctx.storage.get("ipcheck:session");
    if (s && /^[0-9a-f]{24}$/.test(s)) return s;
  } catch (e) { /* ignore */ }
  let s = "";
  const hex = "0123456789abcdef";
  for (let i = 0; i < 24; i++) s += hex[Math.floor(Math.random() * 16)];
  try { ctx.storage.set("ipcheck:session", s); } catch (e) { /* ignore */ }
  return s;
}

// 工作量证明：SHA-256(`${challenge}:${nonce}`) 前 difficulty 位为 0
function solvePow({ challenge, difficulty, ttl }) {
  const bits = Number(difficulty) || 0;
  const expiresAt = Date.now() + Math.max(30, (Number(ttl) || 600) - 30) * 1000;
  if (!bits) return { challenge, difficulty: bits, nonce: "0", expiresAt };

  for (let n = 0; n < 2000000; n++) {
    const h = sha256(utf8Encode(challenge + ":" + n));
    if (leadingZeroBits(h) >= bits) {
      return { challenge, difficulty: bits, nonce: String(n), expiresAt };
    }
  }
  throw new Error("PoW 计算失败");
}

function leadingZeroBits(h) {
  let bits = 0;
  for (let i = 0; i < h.length; i++) {
    const b = h[i];
    if (b === 0) { bits += 8; continue; }
    let v = b;
    while (v < 128) { v = (v << 1) & 0xff; bits++; }
    break;
  }
  return bits;
}

// ─────────────────────────── 归一化辅助 ───────────────────────────

function clamp100(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function abuserZh(level) {
  const k = String(level).toLowerCase();
  if (k.includes("very low")) return "极低";
  if (k.includes("low")) return "低";
  if (k.includes("elevated")) return "偏高";
  if (k.includes("high")) return "高";
  return level;
}

function iffLevelTone(band) {
  if (band === "low") return "rgb(52,199,89)";
  if (band === "medium") return "rgb(255,149,0)";
  return "rgb(255,59,48)";
}

function buildCrossVerdict({ nc, iff, ncScore, iffScore, overall }) {
  if (ncScore !== null && iffScore !== null) {
    const gap = Math.abs(ncScore - iffScore);
    if (gap >= 25) return "两源分差较大，结果偏参考";
    if (overall >= 80) return "双源一致认定干净";
    if (overall < 40) return "双源一致认为高风险";
    return "双源结论基本一致";
  }
  if (ncScore !== null) return "仅 Net.Coffee 单源结论";
  if (iffScore !== null) return "仅 IPFinal 单源结论";
  return "无有效评分";
}

// ─────────────────────────── 设计系统 ───────────────────────────

const C = {
  textPrimary: { light: "#151515", dark: "#FFFFFF" },
  textSecondary: { light: "#6E6E73", dark: "#98989D" },
  textTertiary: { light: "#8E8E93", dark: "#636366" },

  widgetBg: { light: "#FFFFFF", dark: "#151515" },
  cardBg: { light: "rgba(0, 0, 0, 0.04)", dark: "rgba(255, 255, 255, 0.08)" },
  cardBorder: { light: "rgba(0, 0, 0, 0.06)", dark: "rgba(255, 255, 255, 0.08)" },
  pillBg: { light: "rgba(0, 0, 0, 0.05)", dark: "rgba(255, 255, 255, 0.10)" }
};

function renderSystemSmall(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 12,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "spacer", length: 5 },
          { type: "text", text: "IP质检", font: { size: "caption1", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          createPillBadge(`${d.overall}分`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },
      { type: "spacer", length: 5 },
      {
        type: "stack",
        direction: "column",
        gap: 2,
        padding: [6, 8, 6, 8],
        backgroundColor: C.cardBg,
        borderRadius: 9,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "spacer" },
              { type: "text", text: d.displayIP, font: { size: 15, weight: "heavy" }, textColor: C.textPrimary, maxLines: 1 },
              { type: "spacer" }
            ]
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "spacer" },
              { type: "image", src: "sf-symbol:mappin.and.ellipse", color: C.textTertiary, width: 9, height: 9 },
              { type: "spacer", length: 4 },
              { type: "text", text: d.locShort, font: { size: 9, weight: "medium" }, textColor: C.textSecondary, maxLines: 1 },
              { type: "spacer" }
            ]
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "spacer" },
              { type: "image", src: "sf-symbol:network", color: C.textTertiary, width: 8, height: 8 },
              { type: "spacer", length: 4 },
              { type: "text", text: d.asnOrg ? `${d.asnNumber} · ${d.asnOrg}` : d.asnNumber, font: { size: 8, weight: "medium" }, textColor: C.textTertiary, maxLines: 1 },
              { type: "spacer" }
            ]
          }
        ]
      },
      { type: "spacer", length: 5 },
      {
        type: "stack",
        direction: "column",
        gap: 4,
        padding: [6, 8, 6, 8],
        backgroundColor: C.cardBg,
        borderRadius: 9,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          createSmallSourceRow("Net.Coffee", d.ncScore !== null ? `${d.ncScore}分` : "N/A", d.ncTypeText, getPurityColor(d.ncScore)),
          createSmallSourceRow("IPFinal", d.iffScore !== null ? `${d.iffScore}分` : "N/A", d.iffLevelText, d.iffScore !== null ? d.iffLevelColor : C.textSecondary)
        ]
      }
    ]
  };
}

function createSmallSourceRow(name, scoreText, label, color) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      { type: "text", text: name, font: { size: 10, weight: "bold" }, textColor: C.textSecondary },
      { type: "spacer" },
      { type: "text", text: label, font: { size: 10, weight: "medium" }, textColor: C.textTertiary },
      { type: "spacer", length: 5 },
      { type: "text", text: scoreText, font: { size: 10, weight: "heavy" }, textColor: color }
    ]
  };
}

function renderSystemMedium(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: [11, 14, 11, 14],
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 14, height: 14, borderRadius: 3.5 },
          { type: "spacer", length: 6 },
          { type: "text", text: "IP质检", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer" },
          createPillBadge(`综合 ${d.overall}分`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },
      { type: "spacer", length: 4 },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          { type: "text", text: d.displayIP, font: { size: 13, weight: "bold" }, textColor: C.textPrimary },
          {
            type: "stack",
            padding: [1, 4],
            borderRadius: 3.5,
            backgroundColor: C.pillBg,
            children: [{ type: "text", text: d.ipVer, font: { size: 8, weight: "bold" }, textColor: C.textSecondary }]
          },
          { type: "text", text: `· ${d.locShort}`, font: { size: 10, weight: "medium" }, textColor: C.textSecondary, maxLines: 1 },
          { type: "spacer" },
          { type: "text", text: d.asnNumber, font: { size: 10, weight: "medium" }, textColor: C.textTertiary, maxLines: 1 }
        ]
      },
      { type: "spacer", length: 6 },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        flex: 1,
        children: [
          createCleanColumn({
            sourceName: "Net.Coffee",
            scoreVal: d.ncScore !== null ? `${d.ncScore}分` : "N/A",
            scoreColor: getPurityColor(d.ncScore),
            tagPrimary: d.ncTypeText,
            tagSecondary: `滥用 ${d.ncAbuseText}`,
            subline: d.ncAi ? `AI 判定 ${d.ncAi}` : d.asnNumber
          }),
          createCleanColumn({
            sourceName: "IPFinal",
            scoreVal: d.iffScore !== null ? `${d.iffScore}分` : "N/A",
            scoreColor: d.iffScore !== null ? d.iffLevelColor : C.textSecondary,
            tagPrimary: d.iffLevelText,
            tagSecondary: d.iffNative,
            subline: d.botPct !== null ? `机器流量 ${d.botPct}%` : `置信 ${d.iffConf}`
          })
        ]
      },
      { type: "spacer", length: 5 },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:network", color: C.textTertiary, width: 9, height: 9 },
          { type: "text", text: d.asnOrg || "未知组织", font: { size: 10 }, textColor: C.textTertiary, maxLines: 1 },
          { type: "spacer" },
          { type: "text", text: "数据源: Net.Coffee · IPFinal", font: { size: 10 }, textColor: C.textTertiary }
        ]
      }
    ]
  };
}

function createCleanColumn({ sourceName, scoreVal, scoreColor, tagPrimary, tagSecondary, subline }) {
  return {
    type: "stack",
    direction: "column",
    flex: 1,
    gap: 3,
    padding: [7, 8, 7, 8],
    backgroundColor: C.cardBg,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: C.cardBorder,
    children: [
      { type: "text", text: sourceName, font: { size: 10, weight: "bold" }, textColor: C.textSecondary, maxLines: 1 },
      { type: "text", text: scoreVal, font: { size: 18, weight: "heavy" }, textColor: scoreColor, maxLines: 1 },
      { type: "spacer" },
      { type: "text", text: tagPrimary, font: { size: 10, weight: "bold" }, textColor: C.textPrimary, maxLines: 1 },
      { type: "text", text: tagSecondary, font: { size: 10, weight: "medium" }, textColor: C.textSecondary, maxLines: 1 },
      { type: "text", text: subline, font: { size: 8 }, textColor: C.textTertiary, maxLines: 1 }
    ]
  };
}

function renderSystemLarge(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 16,
    gap: 12,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "image", src: CHECK_LOGO, width: 16, height: 16, borderRadius: 4 },
          { type: "spacer", length: 6 },
          { type: "text", text: "IP质检", font: { size: "subheadline", weight: "heavy" }, textColor: C.textPrimary },
          { type: "spacer", length: 6 },
          {
            type: "stack",
            padding: [2, 5],
            borderRadius: 4,
            backgroundColor: C.pillBg,
            children: [{ type: "text", text: d.ipVer, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }]
          },
          { type: "spacer" },
          createPillBadge(`综合指数: ${d.overall}`, d.level.color, d.level.badgeBg, d.level.icon)
        ]
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        backgroundColor: C.cardBg,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          { type: "image", src: createGaugeRingSvg(d.overall, 72, 6.5, d.level.color, "综合质检"), width: 72, height: 72 },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            gap: 3,
            children: [
              { type: "text", text: d.displayIP, font: { size: 19, weight: "bold" }, textColor: C.textPrimary, maxLines: 1 },
              { type: "text", text: d.locFull, font: { size: 11, weight: "medium" }, textColor: C.textSecondary, maxLines: 1 },
              { type: "text", text: `${d.asnNumber} · ${d.asnOrg || "未知组织"}`, font: { size: 10 }, textColor: C.textTertiary, maxLines: 1 }
            ]
          }
        ]
      },
      {
        type: "stack",
        direction: "column",
        flex: 1,
        gap: 8,
        children: [
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createMatrixCard("sf-symbol:shield.checkerboard", "Net.Coffee 属性维度", [
                { label: "纯净得分", val: d.ncScore !== null ? `${d.ncScore}分` : "N/A", color: getPurityColor(d.ncScore) },
                { label: "网络类型", val: d.ncTypeText, color: d.ncHome ? "rgb(52,199,89)" : "rgb(255,149,0)" },
                { label: "滥用等级", val: d.ncAbuseText, color: d.ncAbuseText === "低" || d.ncAbuseText === "极低" ? "rgb(52,199,89)" : "rgb(255,149,0)" }
              ], true),
              createMatrixCard("sf-symbol:chart.bar.xaxis", "IPFinal 评分维度", [
                { label: "纯净评分", val: d.iffScore !== null ? `${d.iffScore}分` : "N/A", color: d.iffScore !== null ? d.iffLevelColor : C.textSecondary },
                { label: "风险等级", val: d.iffLevelText, color: d.iffLevelColor },
                { label: "置信度", val: d.iffConf, color: C.textSecondary }
              ], true)
            ]
          },
          {
            type: "stack",
            direction: "row",
            gap: 8,
            flex: 1,
            children: [
              createMatrixCard("sf-symbol:server.rack", "IPFinal 风险因子", [
                { label: "原生状态", val: d.iffNative, color: d.iffNative === "原生 IP" ? "rgb(52,199,89)" : "rgb(255,149,0)" },
                { label: "代理命中", val: d.proxyHit, color: C.textSecondary },
                { label: "VPN 命中", val: d.vpnHit, color: C.textSecondary }
              ], true),
              createMatrixCard("sf-symbol:checkmark.seal.fill", "多源交叉结论", [
                { label: "风险定级", val: d.level.text, color: d.level.color },
                { label: "仲裁结论", val: d.crossText, color: C.textSecondary },
                { label: "服务状态", val: d.dataState, color: d.dataState === "双源响应正常" ? "rgb(52,199,89)" : "rgb(255,149,0)" }
              ], true)
            ]
          }
        ]
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [{ type: "text", text: "数据源: Net.Coffee · IPFinal", font: { size: 10 }, textColor: C.textTertiary }]
      }
    ]
  };
}

function renderAccessoryCircular(d) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    children: [
      { type: "image", src: createGaugeRingSvg(d.overall, 60, 5, d.level.color, "质检"), width: 60, height: 60 }
    ]
  };
}

function createMatrixCard(icon, title, items, flexVal) {
  const card = {
    type: "stack",
    direction: "column",
    gap: 4,
    padding: [8, 10],
    backgroundColor: C.cardBg,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.cardBorder,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: icon, color: C.textTertiary, width: 10, height: 10 },
          { type: "text", text: title, font: { size: 10, weight: "bold" }, textColor: C.textSecondary }
        ]
      },
      ...items.map(item => ({
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "text", text: item.label, font: { size: 9 }, textColor: C.textTertiary },
          { type: "spacer" },
          { type: "text", text: item.val, font: { size: 9, weight: "bold" }, textColor: item.color, maxLines: 1 }
        ]
      }))
    ]
  };
  if (flexVal) card.flex = 1;
  return card;
}

function renderErrorWidget(errorMsg) {
  return {
    type: "widget",
    backgroundColor: C.widgetBg,
    padding: 14,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: CHECK_LOGO, width: 14, height: 14 },
          { type: "text", text: "IP质检", font: { size: "caption1", weight: "bold" }, textColor: C.textPrimary }
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
        borderWidth: 0.5,
        borderColor: C.cardBorder,
        children: [
          { type: "text", text: errorMsg, font: { size: "caption1", weight: "medium" }, textColor: "rgb(255,59,48)" },
          { type: "text", text: "请检查网络策略组连接", font: { size: 10 }, textColor: C.textTertiary }
        ]
      },
      { type: "spacer" }
    ]
  };
}

// ── SVG 绘图 ──

function createGaugeRingSvg(purity, size, strokeWidth, strokeColor, labelText = "纯净度") {
  const half = size / 2;
  const r = half - strokeWidth / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, purity)) / 100;
  const dash = (circ * pct).toFixed(1);
  const gap = (circ - dash).toFixed(1);

  const numFontSize = Math.round(size * 0.31);
  const labelFontSize = Math.round(size * 0.11);
  const numY = Math.round(half + numFontSize * 0.05);
  const labelY = Math.round(half + numFontSize * 0.62);

  const trackColor = "rgba(128,128,128,0.18)";
  const subColor = "rgba(128,128,128,0.85)";

  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${trackColor}' stroke-width='${strokeWidth}'/>` +
    `<circle cx='${half}' cy='${half}' r='${r}' fill='none' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-linecap='round' stroke-dasharray='${dash} ${gap}' transform='rotate(-90 ${half} ${half})'/>` +
    `<text x='${half}' y='${numY}' text-anchor='middle' font-size='${numFontSize}' font-weight='800' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${strokeColor}'>${purity}</text>` +
    (labelText ? `<text x='${half}' y='${labelY}' text-anchor='middle' font-size='${labelFontSize}' font-weight='600' font-family='-apple-system, BlinkMacSystemFont, sans-serif' fill='${subColor}'>${labelText}</text>` : '') +
    `</svg>`;
}

// ── 评分等级与通用辅助 ──

function getPurityColor(purity) {
  if (purity === null || purity === undefined) return C.textSecondary;
  if (purity >= 80) return "rgb(52,199,89)";
  if (purity >= 60) return "rgb(48,176,199)";
  if (purity >= 40) return "rgb(255,149,0)";
  return "rgb(255,59,48)";
}

function getPurityLevel(purity) {
  if (purity >= 80) {
    return { text: "极高纯净", color: "rgb(52,199,89)", badgeBg: { light: "rgba(52,199,89,0.12)", dark: "rgba(52,199,89,0.20)" }, icon: "checkmark.shield.fill" };
  }
  if (purity >= 60) {
    return { text: "良好可用", color: "rgb(48,176,199)", badgeBg: { light: "rgba(48,176,199,0.12)", dark: "rgba(48,176,199,0.20)" }, icon: "shield.lefthalf.filled" };
  }
  if (purity >= 40) {
    return { text: "中度风险", color: "rgb(255,149,0)", badgeBg: { light: "rgba(255,149,0,0.12)", dark: "rgba(255,149,0,0.20)" }, icon: "exclamationmark.shield.fill" };
  }
  return { text: "高危污染", color: "rgb(255,59,48)", badgeBg: { light: "rgba(255,59,48,0.12)", dark: "rgba(255,59,48,0.20)" }, icon: "xmark.shield.fill" };
}

function createPillBadge(text, textColor, bgColor, icon) {
  const children = [];
  if (icon) {
    children.push({ type: "image", src: `sf-symbol:${icon}`, color: textColor, width: 10, height: 10 });
  }
  children.push({ type: "text", text, font: { size: 10, weight: "bold" }, textColor, maxLines: 1 });
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 3,
    padding: [2, 6],
    borderRadius: 6,
    backgroundColor: bgColor,
    children
  };
}

function maskIP(ip) {
  if (!ip || ip === "N/A") return "";
  if (ip.includes(".")) {
    const p = ip.split(".");
    return `${p[0]}.${p[1]}.*.*`;
  }
  const p6 = ip.split(":");
  return `${p6[0]}:${p6[1]}:*:*:*:*:*:*`;
}

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  let code = cc.toUpperCase();
  if (code === "TW") code = "CN";
  try {
    return String.fromCodePoint(...code.split("").map(c => 127397 + c.charCodeAt(0)));
  } catch (e) {
    return "";
  }
}

// ═════════════════════ 纯 JS 加密原语（SHA-256 / AES-256-GCM） ═════════════════════
// Egern 的脚本上下文不提供 WebCrypto，IPFinal 的响应是 AES-GCM 密文，
// 这里自带实现：SHA-256 用于 PoW 与派生密钥，AES-256-CTR + GHASH 用于解密。

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256(bytes) {
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(len / 536870912));
  dv.setUint32(padded.length - 4, (len << 3) >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

function utf8Encode(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c >= 0xd800 && c <= 0xdbff) {
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

function utf8Decode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++];
    let cp;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    if (cp > 0xffff) {
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      s += String.fromCharCode(cp);
    }
  }
  return s;
}

const SBOX = new Uint8Array(256);
(function buildSbox() {
  const gmul = (a, b) => {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  };
  const rotl8 = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;
  for (let a = 0; a < 256; a++) {
    let inv = 0;
    if (a) for (let b = 1; b < 256; b++) if (gmul(a, b) === 1) { inv = b; break; }
    SBOX[a] = (inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63) & 0xff;
  }
})();

function xtime(x) { return ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff; }
function gfMul(a, b) {
  let p = 0;
  while (b) {
    if (b & 1) p ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return p;
}

function expandKey256(key) {
  const w = new Uint8Array(240);
  w.set(key);
  let rcon = 1;
  for (let i = 32; i < 240; i += 4) {
    let t = [w[i - 4], w[i - 3], w[i - 2], w[i - 1]];
    if (i % 32 === 0) {
      t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
      rcon = xtime(rcon);
    } else if (i % 32 === 16) {
      t = [SBOX[t[0]], SBOX[t[1]], SBOX[t[2]], SBOX[t[3]]];
    }
    for (let j = 0; j < 4; j++) w[i + j] = w[i - 32 + j] ^ t[j];
  }
  return w;
}

function encryptBlock(w, input) {
  const s = new Uint8Array(input);
  const addRoundKey = (round) => {
    for (let i = 0; i < 16; i++) s[i] ^= w[round * 16 + i];
  };
  addRoundKey(0);
  for (let round = 1; round <= 14; round++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = new Uint8Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) t[c * 4 + r] = s[((c + r) % 4) * 4 + r];
    s.set(t);
    if (round !== 14) {
      for (let c = 0; c < 4; c++) {
        const a0 = s[c * 4], a1 = s[c * 4 + 1], a2 = s[c * 4 + 2], a3 = s[c * 4 + 3];
        s[c * 4] = gfMul(a0, 2) ^ gfMul(a1, 3) ^ a2 ^ a3;
        s[c * 4 + 1] = a0 ^ gfMul(a1, 2) ^ gfMul(a2, 3) ^ a3;
        s[c * 4 + 2] = a0 ^ a1 ^ gfMul(a2, 2) ^ gfMul(a3, 3);
        s[c * 4 + 3] = gfMul(a0, 3) ^ a1 ^ a2 ^ gfMul(a3, 2);
      }
    }
    addRoundKey(round);
  }
  return s;
}

function ghashMul(x, y) {
  const z = new Uint8Array(16);
  const v = new Uint8Array(y);
  for (let i = 0; i < 128; i++) {
    if ((x[i >> 3] >> (7 - (i & 7))) & 1) for (let j = 0; j < 16; j++) z[j] ^= v[j];
    const lsb = v[15] & 1;
    for (let j = 15; j > 0; j--) v[j] = ((v[j] >> 1) | ((v[j - 1] & 1) << 7)) & 0xff;
    v[0] = (v[0] >> 1) & 0xff;
    if (lsb) v[0] ^= 0xe1;
  }
  return z;
}

function ghash(H, data) {
  let y = new Uint8Array(16);
  for (let i = 0; i < data.length; i += 16) {
    const block = new Uint8Array(16);
    block.set(data.subarray(i, Math.min(i + 16, data.length)));
    for (let j = 0; j < 16; j++) y[j] ^= block[j];
    y = ghashMul(y, H);
  }
  return y;
}

// raw = IV(12) || ciphertext || tag(16)
function aesGcmDecrypt(key, raw) {
  const iv = raw.subarray(0, 12);
  const body = raw.subarray(12);
  const ct = body.subarray(0, body.length - 16);

  const w = expandKey256(key);
  const H = encryptBlock(w, new Uint8Array(16));

  const j0 = new Uint8Array(16);
  j0.set(iv);
  j0[15] = 1;

  const out = new Uint8Array(ct.length);
  const counter = new Uint8Array(j0);
  for (let off = 0; off < ct.length; off += 16) {
    for (let i = 15; i >= 12; i--) {
      counter[i] = (counter[i] + 1) & 0xff;
      if (counter[i] !== 0) break;
    }
    const ks = encryptBlock(w, counter);
    for (let i = 0; i < 16 && off + i < ct.length; i++) out[off + i] = ct[off + i] ^ ks[i];
  }
  return { plaintext: out, h: H };
}
