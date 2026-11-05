# Apple 智能换模型（问千问 / 识图）

一个模块，把国行 Apple 智能里能碰到的两条链路都接管了：

- **Siri / 写作工具 / 视觉智能** → 你自己的 OpenAI 兼容 provider（文本、图片识别、选中文本改写）
- **视觉搜索（以图搜图）** → 百度识图换成 Google Lens（经 SerpAPI）

**画图不接管**：命中画图句式就原样放行，仍由千问出图。

模块地址：

```
https://raw.githubusercontent.com/Likhixang/Egerny/main/sgmodule/AppleIntelligence-Qwen.yaml
```

---

## 原理

国行 Apple 智能在用户选择千问后，Siri 以**明文 HTTPS + Bearer JWT** 直接调用阿里云，不是 Private Cloud Compute 那套 OHTTP/HPKE 端到端加密，也没有证书 pinning：

| 项 | 值 |
| --- | --- |
| 新会话 | `POST https://prod-yabuli.qianwen.com/v1/sessions/responses` |
| 续轮 | `POST https://prod-yabuli.qianwen.com/v1/sessions/sess_<uuid>/responses` |
| UA（Siri） | `Siri (iPhone - Version 27.3.0)` |
| UA（视觉智能） | `VisualIntelligence (iPhone - Version 27.3.0)` |
| UA（写作工具） | `WritingTools (iPhone - Version 27.3.0)` |
| 模型 | `qwenapp-apple-tqa` |
| 响应 | `text/event-stream` + brotli，事件名 `session.response.*` |
| 分流字段 | `configuration.response_configuration_group_id`：`siri.visualIntelligenceCamera` / `compose_*` |
| 服务端工具 | `image_generator` / `file_generator` / `browser` |
| 识图 | `POST https://qianfan.baidubce.com/v1/images/search`，`image=<urlencoded base64>` |

所以可以在 Egern 的 `http_request` 脚本里直接吞掉请求，按原协议回包。

两个容易踩的点：

1. **`input` 里只有当前这一句**，多轮历史存在服务端 session。本模块自己用 `ctx.storage` 按 `sess_xxx` 存历史（写作工具除外）。
2. **正文是双重 JSON 编码**。`text.value.delta` 的 `delta` 是字符串片段，拼起来之后本身还要再 `JSON.parse` 一次，内层才是：

```json
{"content":"...","isRequestingUserInput":false,"summary":"...","suggestions":["","",""]}
```

---

## Siri 三条链路

### 纯文本：14 个事件

```
session.created                                        ← 仅新会话
session.response.created
session.response.choices[].added
session.response.choices[].items[].added
session.response.choices[].items[].message.content[].added
session.response.choices[].items[].message.content[].text.value.delta   ×N
session.response.choices[].items[].message.content[].text.value.done
session.response.choices[].items[].message.content[].done
session.response.choices[].items[].done
session.response.choices[].completed
session.response.choices[].done
session.response.done
```

### 视觉智能：图片进，文本出

请求体里**只有图片、没有文字**：

```json
"input": [{
  "type": "message",
  "message": {
    "role": "user",
    "content": [{ "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }]
  }
}]
```

实测一张 768×1667 的 JPEG，149 KB，转成 data URL 后 199 KB，整个请求体约 200 KB。

脚本会把它转成 OpenAI 视觉格式（`text` + `image_url`），没有文字时补一句 `VISION_PROMPT` 引导语，再发给上游。

响应比纯文本多一段引用卡片：

```
text.value.done
text.annotations[].added        ← 有来源时才有
message.content[].done          ← annotations 会写进这里
```

`annotations` 形如：

```json
{"type":"url_citation","url_citation":{"index":0,"title":"来源标题","url":"https://..."}}
```

上游如果返回 `message.annotations` 或 `citations`，脚本会透传；没有就跳过这段，事件序列退化成纯文本那 14 个。

### 写作工具：原文进，改写稿出

系统写作工具（WritingTools）打的是**同一个端点**，`response_configuration_group_id` 为 `compose_selectedAndAllText`。

`input` 里不是自然语言，而是一条被转义的 JSON 字符串：

```json
"content": [{
  "text": "{\"originalText\":\"# **我来一桥上，怀古轻吟风**\\n\",\"prompt\":\"更优雅\"}",
  "type": "text"
}]
```

回包的事件壳和纯文本一模一样（`session.created` → `session.response.done`，中间 N 个 delta），区别只在 `text.value` 里必须是 JSON：

```json
{"body":"登桥怀古，临风浅吟。","refinements":["增加诗句的历史背景描述","用更具体的意象替代浅吟","调整句式以增强节奏感"]}
```

`refinements` 就是界面上那 3 个可点的改写方向。脚本只保留前 3 条、丢弃空串；模型没按 JSON 回时，`body` 退回原文、`refinements` 给空数组，避免 App 拿到裸文本解析失败。

写作链路不读写 Siri 的会话历史：原文每次都由客户端带上来，存历史反而会串味。

---

## 视觉搜索：百度识图 → Google Lens

手机端请求（2026-11-05 真机抓包）：

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

**任何一步失败都会原样放行给百度识图**（可选发一条系统通知），所以视觉搜索不会因为 SerpAPI 挂了而不可用。

### 为什么不能纯插件直连 Google

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

## 画图为什么放行

画图请求从形态上和普通提问完全一样（`input` 只有一句话，`server_tools` 里带 `image_generator`），**没法在请求发出前判断这次会不会出图**。

所以脚本只做一件事：命中明确的画图句式就**原样放行**，整条请求回到千问，出图、图片 URL、`image_generator_call` 事件全部由千问原生处理，本模块不参与。

放行时会把原始 body 显式带回去——脚本已经读过请求体流，不带回去上游会收到空 body。

命中规则（`IMAGE_INTENT`）：

- `画/绘制/生成/做/来/设计` + `图片/图像/插画/海报/头像/壁纸/照片/表情包/logo/banner`
- `画/绘制/生成` + 量词（`一只`、`两张`…）
- 英文 `draw/paint/sketch/render/generate/create/make` + `image/picture/photo/...`

代价：说法太绕（例如「帮我弄一张海边日落的图」）可能不被识别，会被当成普通提问交给你的 provider。这种情况换个说法，或者直接说「画一张…」。

---

## 安装

1. Egern → 配置 → 模块 → 添加模块，填上面的地址。
2. 填 **接口地址**、**密钥**、**模型**（Siri / 写作工具用）。接口地址写到 `/v1` 就行。
3. 到 [serpapi.com](https://serpapi.com) 注册，把 key 填进 **SerpAPI 密钥**（识图用，免费 250 次/月）。
4. 确认模块已启用，MITM 里包含 `prod-yabuli.qianwen.com` 和 `qianfan.baidubce.com`（模块会自动合并）。
5. 手机上装好 Egern 的 CA 证书，并在「设置 → 通用 → 关于本机 → 证书信任设置」打开完全信任。
6. 重开 Siri，选千问问一句；再打开视觉搜索试一张图。

两项能力互相独立：不填 SerpAPI key，识图继续走百度；不填 provider，Siri 继续走千问。

---

## 接口地址怎么填

不用写全路径，脚本会自己补：

| 你填的 | 实际请求 |
| --- | --- |
| `https://api.example.com` | `https://api.example.com/v1/chat/completions` |
| `https://api.example.com/v1` | `https://api.example.com/v1/chat/completions` |
| `https://gw.example.com/openai/v1` | `https://gw.example.com/openai/v1/chat/completions` |
| `https://api.example.com/v1/chat/completions` | 原样使用 |
| `https://x.example.com/v1/chat/completions?api-version=1` | 原样使用（带 query 视为完整地址） |

---

## 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `PROVIDER_URL` | 是 | Siri / 写作工具的接口，填到 `/v1` 即可 |
| `API_KEY` | 否 | Bearer 密钥；本地网关无鉴权可留空 |
| `MODEL` | 是 | 传给 provider 的 `model` 字段 |
| `EFFORT` | 否 | 思考强度，按 OpenAI 兼容的 `reasoning_effort` 发送：`default` 不发送 / `off` 发 `none` / `low` `medium` `high` `xhigh` `max` |
| `EXTRA_BODY` | 否 | JSON 对象，原样并入请求体，用于 provider 私有参数 |
| `WEB_SEARCH` | 否 | 搜索来源：`provider`（默认）/ `qwen` / `off` |
| `SYSTEM_PROMPT` | 否 | 留空用内置默认，原文：`Your answer must remain neutral, be accurate, and sound natural in spoken language. Output only the final answer.` |
| `VISION_MODEL` | 否 | 处理视觉智能图片的模型；留空复用 `MODEL` |
| `VISION_PROMPT` | 否 | 视觉智能只发图片不发文字，用这句引导模型作答 |
| `WRITING_MODEL` | 否 | 写作工具用的模型，留空复用 `MODEL` |
| `WRITING_PROMPT` | 否 | 写作工具的系统提示词，留空用内置默认 |
| `SERPAPI_KEY` | 识图必填 | 留空则识图继续走百度 |
| `HL` | 否 | 识图语言，默认 `zh-cn` |
| `COUNTRY` | 否 | 识图国家，默认 `us` |
| `LENS_TYPE` | 否 | `all` / `visual_matches` / `exact_matches`，默认 `all` |
| `TIMEOUT` | 否 | 等待上游或 SerpAPI 的秒数，默认 120，最大 300 |
| `REPORT_MODEL` | 否 | 回给 Siri 的 `model` 字段，默认 `qwenapp-apple-tqa` |
| `CONTINUE_URL` | 否 | 回答下方的跳转链接，留空不显示 |
| `NOTIFY_ON_ERROR` | 否 | 上游 / 识图失败时发系统通知 |

上游对话接口同时兼容 `choices[0].message.content` 和 Responses 的 `output_text` / `output[].content[].text`。

### 思考强度

只发 OpenAI 兼容的标准字段 `reasoning_effort`，不再区分 provider 写法。`EFFORT=default`（默认）时一个字段都不发，请求体与旧版完全一致：

| `EFFORT` | 实际请求字段 |
| --- | --- |
| `default` | 不发送 |
| `off` | `reasoning_effort: "none"` |
| `low` / `medium` / `high` / `xhigh` / `max` | `reasoning_effort` 原样发送 |

`reasoning_effort` 的可选值与模型支持范围由上游决定（OpenAI 文档给出 `none` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`，不同模型支持不全）；档位里没放 `minimal`，确实需要时用 `EXTRA_BODY` 传 `{"reasoning_effort":"minimal"}`。

上游不认这个字段时（返回 400 或 422），脚本会自动去掉它重试一次，并弹一条「思考强度未生效」通知，不会把整条回答拖垮；同一 provider + 模型在 1 小时内不再重复尝试，避免每次多打一次请求。

provider 用非标准字段时（百炼 `enable_thinking`/`thinking_budget`、OpenRouter `reasoning.effort`、Gemini `google.thinking_config` 等），同样走 `EXTRA_BODY`，例如：

```json
{"enable_thinking": true, "thinking_budget": 8192}
```

`EXTRA_BODY` 会原样并入请求体，但不会覆盖 `model` / `messages` / `stream`。

### 联网搜索与来源卡片

原生千问的「多来源」不是客户端能力：Siri 的请求体里带 `server_tools`（`browser` / `image_generator`），由千问服务端执行，结果通过 `text.annotations[].added` 事件回传。模块在请求发出前就把 body 重写了，`server_tools` 不会带过去，所以接自定义 provider 后联网搜索和来源会一起消失——**不是抓包漏了，这条能力本来就跑在千问服务端**。

`WEB_SEARCH` 现在三档：

| 值 | 行为 | 代价 |
| --- | --- | --- |
| `off` | 不联网，也没有引用 | — |
| `provider`（默认） | 向上游发 OpenAI 兼容的 `tools:[{type:"web_search"}]`，由 provider 自己搜、自己回引用 | 零额外调用；要选支持 web_search 的模型 |
| `qwen` | 先把同一个请求再打一次千问（新会话，带原 `Authorization`），只让它检索出标题+链接；把来源拼进 system 交给 provider 作答，并把来源填回 Siri 引用卡片 | 每题多一次调用，约 +2–8 秒 |

`qwen` 模式的前提与坑：

- 依赖拦截到的 Siri `Authorization` JWT；过期或校验变严就失效，失效时自动降级为「无来源」并发通知，不会拖垮回答。
- 问题会先发给千问做检索（内容与你直接用千问时一样，只是不采信它的回答）。
- 检索请求带 `x-aiq-search: 1` 头；脚本看到带这个头的请求直接透传，避免自己调自己。
- 检索强制走 `/v1/sessions/responses`（新会话），不会把「只做联网检索」写进你正在聊的会话。
- 拿到的来源除了写进 system，还会按 `url_citation` 填进 `text.annotations[].added`，Siri 会显示来源卡片。

`provider` 模式的支持度取决于模型，同一个网关实测：

| 模型 | 结果 |
| --- | --- |
| `gpt-6.1-sol` | 真搜索，返回 url_citation，模块实测出现 2 个来源事件 |
| `gemini-3.8-flash` | 接受参数但不搜索，回答不带引用 |
| `deepseek-flash` | 不搜索，直接在正文里说无法联网 |

`provider` 模式下上游把 `tools` 当非法字段回 400/422 时，脚本会关掉联网重试并通知，同一 provider + 模型 1 小时内不再尝试。

### 为什么模型不是下拉

Egern 的 `env_schema.options` 只接受静态数组（官方文档：`options` 为可选值列表，`["true","false"]` 生成开关，其余生成 Picker，未设置生成输入框），没有从 URL 动态拉取的字段，Picker 也没有手输入口。所以「填完接口地址和密钥 → 自动列出 `/v1/models`」在模块设置页做不到，硬塞一个模型名清单反而是假下拉。

三种替代，按真实程度排序：

1. **手填 + 自查**（当前实现）：`curl -H "Authorization: Bearer $KEY" $BASE/v1/models` 拿到名字再填。
2. **脚本内 `auto`**：请求前先 GET `/v1/models` 再挑一个，能真跑，但仍不是下拉，且多一次请求。
3. **自建 Worker 生成模块**：模块 URL 指向自托管服务，服务用你的 key 拉 `/v1/models` 后现场吐出把模型名写进 `options` 的 YAML；Egern 按 `update_interval` 刷新，这才是随 provider 变化的真 Picker。代价是要托管服务，且 URL 里不能放明文 key。

---

## 已知限制

- **Siri 只覆盖「问千问」、视觉智能的识别/询问和写作工具**。端侧模型和苹果自研云端模型不经过这个接口，拦截不到。
- **画图只能靠句式判断**：命中画图句式才放行，说法太绕会被当成普通提问。
- **写作工具只认 `compose_` 前缀的配置组**。抓到的是 `compose_selectedAndAllText`；如果后续系统换了 group id，请求会掉回 Siri 对话逻辑。
- **写作工具是单轮的**。不读会话历史，连续点建议时若只发增量、不带原文，效果会退化。
- **视觉图片只用于当轮**。会话历史里只存 `[图片]` 占位，后续追问看不到那张图。
- **模型只能手填**。Egern 的 `env_schema` 不支持动态选项，设置页无法列出 provider 的模型清单，见上文「为什么模型不是下拉」。
- **思考强度只发标准字段**。统一按 `reasoning_effort` 发送；上游不认时脚本会去掉字段重试并通知，但这也意味着该 provider 上档位不会生效，需要私有参数就写进 `EXTRA_BODY`。
- **来源卡片取决于搜索来源**。`provider` 模式要模型支持 `web_search`（同网关里 `gpt-6.1-sol` 可以、`gemini-3.8-flash` 不行）；`qwen` 模式不挑模型，但每题多一次千问调用，且依赖 Siri 的 JWT。
- **识图没有 AI 摘要**。百度原包里的 `mllm_abstract` 是一段商品总结，Google 不给等价物，脚本只填识别词，摘要留空。
- **识图结果质量取决于 Google**。中文商品图的匹配度通常不如百度，尤其是国内电商和小众商品。
- **识图没有缓存**：同一张图搜两次会计两次 SerpAPI 额度。
- **整段返回，不是逐字流式**。Egern 脚本返回的是完整 body，第一个字的延迟等于整段生成时间。
- 需要 iOS 27.3 及以上、国行设备，且已开通 Apple 智能测试资格。

---

## 排错

| 现象 | 排查 |
| --- | --- |
| Siri 回「配置错误」 | 接口地址或模型没填 |
| Siri 回「后端不可用」 | 上游地址写错、密钥失效，或网关不通 |
| 视觉智能回「图片识别失败」 | `VISION_MODEL`（或 `MODEL`）不是多模态模型，换一个支持图片输入的 |
| 写作工具没变化，或回的是原文 | 看 Egern 请求记录里 `compose_` 请求是否命中脚本；`WRITING_MODEL` 是否只会长篇解释、不按 JSON 输出 |
| 说「画只猫」却回了文字 | 放行判定没命中，换个更直接的说法；在 Egern 请求记录里确认这次请求是否被脚本接管 |
| 识图还是百度的结果 | 没填 `SERPAPI_KEY`，或 MITM 名单里没有 `qianfan.baidubce.com` |
| 弹「Google 识图不可用」通知 | 通知里带具体原因：key 无效、额度用完、网络不通；此时已自动回退百度 |
| 完全没变化 | 模块没启用；MITM 没开；CA 证书没信任 |
| 连接直接失败 | 不要把 `*.apple.com` / `gateway.icloud.com.cn` 加进 MITM，那些有 pinning |

在 Egern 的请求记录里筛 `prod-yabuli.qianwen.com` 或 `qianfan.baidubce.com`，能看到脚本是否命中。

---

## 测试

```bash
node --test tests/apple-intelligence-qwen.test.cjs
```

40 条，覆盖：Siri 三条链路的事件序列与抓包逐项一致、deltas 还原、多轮历史、图片输入解析、引用卡片、写作工具入参/出参解析与降级、画图意图放行（含带回原 body）、识图的 form/base64 解析、multipart、上传+搜索+映射、失败回退、500KB 上限、空结果 schema、非目标 URL 透传。

协议依据来自 2026-11-05 的真机抓包（iOS 27.3 开发者测试版，中国大陆）：Siri 文本、视觉智能、写作工具、百度识图。
