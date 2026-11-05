# 百度识图换 Google Lens

国行 iPhone 的「视觉搜索 / 以图搜图」默认走百度千帆。这个模块把它改接到 Google Lens（经 SerpAPI），回包仍然是百度识图的 schema，手机界面完全无感知。

**只换识图来源，不动 Siri 对话**。Siri 那条链路看 [Apple 智能换模型](AppleIntelligence-Qwen.md)。

模块地址：

```
https://raw.githubusercontent.com/Likhixang/Egerny/main/sgmodule/BaiduImageSearch-Google.yaml
```

---

## 原理

手机端请求长这样（2026-11-05 真机抓包）：

| 项 | 值 |
| --- | --- |
| 端点 | `POST https://qianfan.baidubce.com/v1/images/search` |
| UA | `SearchPartnerInferenceProvider/297.15.7 Network/6681.60.32 iOS/27.3` |
| 鉴权 | 没有，只靠 UA |
| 请求体 | `application/x-www-form-urlencoded`，单个字段 `image=<urlencoded base64>` |
| 图片 | 249×539 JPEG，约 19 KB（手机端已压缩） |
| 响应 | `Content-Type: text/plain`，内容是 JSON，约 168 KB |

响应结构（只列用到的部分）：

```json
{
  "result": {
    "logid": 3619529311,
    "err_code": 0,
    "guessword_res": [{ "word": "心相印抽纸", "type": "TYPE_MLLM_GUESSWORD", "confidence": 1 }],
    "res_data": {
      "res_items": [{
        "item_cate": "CATE_SIMI", "title": "...", "thumburl": "https://mms2.baidu.com/...",
        "fromurl": "https://...", "objurl": "https://...", "width": 160, "height": 213,
        "site_name": ""
      }],
      "sim_items": [{ "title": "...", "thumburl": "...", "fromurl": "...", "score": 0.79 }],
      "simi_result_page": "https://graph.baidu.com/s?sign=...",
      "result_page": "https://graph.baidu.com/s?sign=..."
    }
  },
  "error_code": 0,
  "error_msg": "succ",
  "support": "百度识图提供技术支持",
  "logid": 3619529311
}
```

脚本做的事：

1. 读出 `image` 字段，base64 解码成字节
2. `POST https://serpapi.com/image` 上传，拿 `image_id`
3. `GET https://serpapi.com/search.json?engine=google_lens&image_id=...`
4. 把 `visual_matches` / `exact_matches` / `organic_results` 映射成 `res_items` / `sim_items`，用 `related_content[0].query` 当 `guessword_res[0].word`
5. 按 `text/plain` 回包

**任何一步失败都会 `return undefined` 原样放行给百度识图**（并可选发一条系统通知），所以视觉搜索不会因为 SerpAPI 挂了而不可用。

---

## 为什么不能纯插件直连 Google

试过了，走不通：

| 验证 | 结果 |
| --- | --- |
| `POST lens.google.com/v3/upload` | 200，拿到 `vsrid` 结果 URL |
| 直接抓那个结果 URL | 94 KB HTML，0 个结果节点、0 个 `AF_initDataCallback` |
| PicImageSearch 的 `GoogleLens` 引擎 | `raw items: 0`（它只是 HTML 解析，页面里本来就没数据） |
| 换 iPhone / Android UA、加 `gbv=1` | 还是空壳 |
| Playwright 渲染 | 机房 IP 直接吃 `sorry/index` 验证码 |

Lens 的结果是**纯客户端渲染**，还要 `bgasy` 下发的脚本在 DOM 里算出 `mlro`/`mrc`/`mgtyp` 等反爬令牌。Egern 的 `ctx.http` 没有 JS 引擎，这条路在插件里不可能完成。

SerpAPI 把这一层包掉了：给它图，它返回结构化 JSON。

---

## 安装

1. Egern → 配置 → 模块 → 添加模块，填上面的地址。
2. 到 [serpapi.com](https://serpapi.com) 注册，复制 API key（免费 250 次/月）。
3. 模块设置里填 **SerpAPI 密钥**。
4. 确认模块已启用，MITM 里包含 `qianfan.baidubce.com`（模块会自动合并）。
5. 打开相机的视觉搜索，或者用「以图搜图」试一张。

---

## 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `SERPAPI_KEY` | 是 | 留空则完全不接管，仍走百度识图 |
| `HL` | 否 | Google 语言，默认 `zh-cn` |
| `COUNTRY` | 否 | Google 国家，默认 `cn` |
| `LENS_TYPE` | 否 | `all` / `visual_matches` / `exact_matches`，默认 `all` |
| `THUMB_PROXY` | 否 | 缩略图代理前缀，例如 `https://wsrv.nl/?url=`；留空用 Google 原地址 |
| `TIMEOUT` | 否 | 等 SerpAPI 的秒数，默认 45 |
| `NOTIFY_ON_ERROR` | 否 | 失败时发系统通知，默认 `true` |

**关于缩略图**：Google 的缩略图在 `encrypted-tbn*.gstatic.com`，墙内直连打不开。如果你手机的代理规则已经覆盖 Google 域名，可以留空；否则填一个图片代理前缀，脚本会把原地址 URL-encode 后拼在后面。

---

## 成本

SerpAPI 免费档 **250 次/月**，单次约 1–3 秒。个人用足够；超了要么等地狱，要么升 Starter（$25/1000 次）。

脚本目前**没有做结果缓存**：同一张图搜两次会计两次额度。需要的话可以加，按图片 sha256 缓存 24 小时。

---

## 已知限制

- **只覆盖百度识图**。iPhone 上其他走百度图片接口的场景（如果有）不在 MITM 名单里。
- **没有 AI 摘要**。百度原包里的 `guessword_res[0].extend_brief.mllm_abstract` 是一段 base64 的 Markdown 摘要（实测是「心相印抽纸」的商品总结），Google 不给等价物，脚本只填 `word`，摘要留空。
- **结果质量取决于 Google**。中文商品图的匹配度通常不如百度，尤其是国内电商和小众商品。
- **依赖 SerpAPI 的字段命名**。它的 `visual_matches` / `exact_matches` / `organic_results` 如果调整，映射要跟着改。
- 需要 iOS 27.3 及以上、国行设备。

---

## 排错

| 现象 | 排查 |
| --- | --- |
| 还是百度的结果 | 模块没启用；`SERPAPI_KEY` 没填；MITM 名单里没有 `qianfan.baidubce.com` |
| 弹「Google 识图不可用」通知 | 通知里带具体原因：key 无效、额度用完、网络不通 |
| 有结果但缩略图空白 | 配 `THUMB_PROXY`，或确认代理规则覆盖 `gstatic.com` |
| 识别词不对 | `HL` / `COUNTRY` 换成目标市场再试 |
| 一直回退百度 | 看 Egern 请求记录里这条请求的脚本日志；多半是 401（key）或 429（额度） |

在 Egern 的请求记录里筛 `qianfan.baidubce.com`，能看到脚本是否命中。

---

## 测试

```bash
node --test tests/baidu-image-search-google.test.cjs
```

12 条，覆盖：非目标透传、缺 key 放行、form/base64 解析、PNG 魔数判断、multipart 结构、完整上传+搜索+映射、`hl`/`country`/`type` 参数、缩略图代理、上传与搜索失败回退、500KB 上限、空结果 schema。

协议依据来自 2026-11-05 的真机抓包（视觉搜索「心相印抽纸」）与 SerpAPI 官方响应示例。
