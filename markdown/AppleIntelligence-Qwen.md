# Apple 智能换模型（问千问）

把国行 Apple 智能里「问千问」那条链路，改接到你自己的 OpenAI 兼容 provider。文本、出图、视觉智能和写作工具都支持。

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
| UA | `Siri (iPhone - Version 27.3.0)` |
| 模型 | `qwenapp-apple-tqa` |
| 响应 | `text/event-stream` + brotli，事件名 `session.response.*` |
| 服务端工具 | `image_generator` / `file_generator` / `browser` |
| 视觉智能 | 同一端点，UA 换成 `VisualIntelligence (iPhone - Version 27.3.0)`，`response_configuration_group_id` 为 `siri.visualIntelligenceCamera` |
| 写作工具 | 同一端点，UA 换成 `WritingTools (iPhone - Version 27.3.0)`，`response_configuration_group_id` 为 `compose_selectedAndAllText` |

所以可以在 Egern 的 `http_request` 脚本里直接吞掉请求，按原样 SSE 事件壳回包。

两个容易踩的点：

1. **`input` 里只有当前这一句**，多轮历史存在服务端 session。本模块自己用 `ctx.storage` 按 `sess_xxx` 存历史。
2. **正文是双重 JSON 编码**。`text.value.delta` 的 `delta` 是字符串片段，拼起来之后本身还要再 `JSON.parse` 一次，内层才是：

```json
{"content":"...","isRequestingUserInput":false,"summary":"...","suggestions":["","",""]}
```

---

## 四条链路

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

### 出图：20 个事件，两个 item

```
session.response.choices[].items[].added                                   ← item 0: image_generator_call
session.response.choices[].items[].image_generator_call.in_progress
session.response.choices[].items[].image_generator_call.prompt.done
session.response.choices[].items[].image_generator_call.generating
session.response.choices[].items[].image_generator_call.images[].added
session.response.choices[].items[].image_generator_call.completed
session.response.choices[].items[].done
session.response.choices[].items[].added                                   ← item 1: message
session.response.choices[].items[].message.content[].added                 ← content 0: image_generator_image
session.response.choices[].items[].message.content[].done
session.response.choices[].items[].message.content[].added                 ← content 1: text
session.response.choices[].items[].message.content[].text.value.delta      ×N
session.response.choices[].items[].message.content[].text.value.done
session.response.choices[].items[].message.content[].done
session.response.choices[].items[].done
session.response.choices[].completed
session.response.choices[].done
session.response.done
```

关键结构：

- `items[0]` 是 `image_generator_call`，`completed` 事件里带 `tool_name`、`images[].url`、`prompt`、`status`。
- `items[1]` 是 `message`，`content[0]` 是 `image_generator_image`（`{width, height, url, prompt}`，这才是真正显示的图），`content[1]` 才是那段双重编码的文本。
- `choices[].completed` 的 `output` 里两个 item 都要在。
- 真实后端在 `items[].added` 里就给了 `status: "completed"` 和空 `prompt`，这不是笔误，照抄才能对齐。

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

系统写作工具（WritingTools）打的是**同一个端点**，UA 换成 `WritingTools (iPhone - Version 27.3.0)`，`response_configuration_group_id` 为 `compose_selectedAndAllText`。

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

## 出图是怎么触发的

1. 请求上游时带上 `image_generator` 的 function 定义，`tool_choice: "auto"`。
2. 上游返回 `tool_calls` → 取出 `arguments.prompt` → 调 `IMAGE_URL` 生成图片。
3. 拿到 URL 后按上面 20 个事件回包。

上游 400 且报错里带 `tool` 字样时，自动去掉 `tools` 重发一次，然后用句式兜底（`画只猫`、`生成图片：海边日落`、`draw me a cat image` 之类）。普通提问不会误触。

**图片 URL 必须设备能直接抓取。** `dall-e-3` 这类默认回 `url`，直接可用；`gpt-image-1` 只回 `b64_json`，需要配 `IMAGE_UPLOAD_URL`，否则降级成纯文本并提示。

转存接口约定：

```
POST <IMAGE_UPLOAD_URL>
Content-Type: application/json
{"image": "<base64>", "mimeType": "image/png"}

→ 200 {"url": "https://..."}   或   纯文本 URL
```

---

## 安装

1. Egern → 配置 → 模块 → 添加模块，填上面的地址。
2. 进入模块设置，至少填 **接口地址**、**密钥**、**模型**。接口地址写到 `/v1` 就行，例如 `https://api.openai.com/v1`。
3. 需要出图就再填 **图像接口地址**（同样写到 `/v1`）和 **图像模型**。
4. 确认模块已启用，MITM 里包含 `prod-yabuli.qianwen.com`（模块会自动合并）。
5. 手机上装好 Egern 的 CA 证书，并在「设置 → 通用 → 关于本机 → 证书信任设置」打开完全信任。
6. 重开 Siri，选千问问一句。

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

图像接口同理，补的是 `/images/generations`。

---

## 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `PROVIDER_URL` | 是 | 填到 `/v1` 即可，会自动补 `/chat/completions`；只写域名也行，会自动补 `/v1` |
| `API_KEY` | 否 | Bearer 密钥；本地网关无鉴权可留空 |
| `MODEL` | 是 | 传给 provider 的 `model` 字段 |
| `SYSTEM_PROMPT` | 否 | 留空用内置默认：简洁、准确、口语化 |
| `VISION_MODEL` | 否 | 处理视觉智能图片的模型；留空复用 `MODEL`，主模型不支持图片时填多模态模型 |
| `VISION_PROMPT` | 否 | 视觉智能只发图片不发文字，用这句引导模型作答 |
| `WRITING_MODEL` | 否 | 写作工具用的模型，留空复用 `MODEL`；想要更好的改写效果可以单独指一个 |
| `WRITING_PROMPT` | 否 | 写作工具的系统提示词，留空用内置默认（输出 `{body, refinements}`） |
| `TIMEOUT` | 否 | 等待上游的秒数，默认 120，最大 300 |
| `REPORT_MODEL` | 否 | 回给 Siri 的 `model` 字段，默认 `qwenapp-apple-tqa` |
| `CONTINUE_URL` | 否 | 回答下方的跳转链接，留空不显示 |
| `NOTIFY_ON_ERROR` | 否 | 上游失败时发系统通知 |
| `IMAGE_ENABLE` | 否 | 出图总开关，默认 `true` |
| `IMAGE_URL` | 出图必填 | 同样填到 `/v1` 即可，会自动补 `/images/generations` |
| `IMAGE_MODEL` | 出图必填 | 例如 `dall-e-3`、`gpt-image-1`、`flux-schnell` |
| `IMAGE_SIZE` | 否 | `宽x高`，默认 `1024x1024`，同时决定回包的 `width`/`height` |
| `IMAGE_KEY` | 否 | 留空复用 `API_KEY` |
| `IMAGE_TIMEOUT` | 否 | 默认 180 秒 |
| `IMAGE_UPLOAD_URL` | 否 | base64 转存地址 |
| `IMAGE_DESCRIBE` | 否 | 额外一次模型调用写图片描述，默认关闭 |

上游对话接口同时兼容 `choices[0].message.content` 和 Responses 的 `output_text` / `output[].content[].text`。

---

## 已知限制

- **只覆盖「问千问」、视觉智能的识别/询问和写作工具**。端侧模型和苹果自研云端模型不经过这个接口，拦截不到。
- **写作工具只认 `compose_` 前缀的配置组**。抓到的是 `compose_selectedAndAllText`；如果后续系统换了 group id 或不带这个字段，请求会掉回 Siri 对话逻辑。
- **写作工具是单轮的**。不读会话历史，每次只按客户端带上来的原文和改写要求处理；App 里连续点建议时若只发增量、不带原文，效果会退化。
- **视觉搜索（以图搜物/以图搜图）还没接**。目前抓到的视觉智能只有 `siri.visualIntelligenceCamera` 这一条，没有独立的搜图请求；等抓到再补。
- **只实现了 `image_generator` 一个工具**。抓包里的 `call_emergency_services` 不会转发给上游，所以「让 Siri 报警」不会触发；`file_generator` / `browser` 同样不支持。
- **视觉图片只用于当轮**。会话历史里只存 `[图片]` 占位，后续追问看不到那张图。
- **整段返回，不是逐字流式**。Egern 脚本返回的是完整 body，第一个字的延迟等于整段生成时间。
- 需要 iOS 27.3 及以上、国行设备，且已开通 Apple 智能测试资格。

---

## 排错

| 现象 | 排查 |
| --- | --- |
| Siri 回「配置错误」 | 接口地址或模型没填 |
| Siri 回「后端不可用」 | 上游地址写错、密钥失效，或网关不通 |
| 该出图却回了文字 | 上游不支持 tool calling，或提示词没被识别；看 `IMAGE_URL` / `IMAGE_MODEL` 是否填了 |
| 视觉智能回「图片识别失败」 | `VISION_MODEL`（或 `MODEL`）不是多模态模型，换一个支持图片输入的 |
| 写作工具没变化，或回的是原文 | 看 Egern 请求记录里 `compose_` 请求是否命中脚本；`WRITING_MODEL` 是否只会长篇解释、不按 JSON 输出（必要时换模型或改 `WRITING_PROMPT`） |
| 「图片生成失败：… IMAGE_UPLOAD_URL」 | 图像模型只回 base64，配转存地址或换回 url 型的模型 |
| 完全没变化 | 模块没启用；MITM 没开；CA 证书没信任 |
| 连接直接失败 | 不要把 `*.apple.com` / `gateway.icloud.com.cn` 加进 MITM，那些有 pinning |

在 Egern 的请求记录里筛 `prod-yabuli.qianwen.com`，能看到脚本是否命中。

---

## 测试

```bash
node --test tests/apple-intelligence-qwen.test.cjs
```

34 条，覆盖：四条链路的事件序列与抓包逐项一致、deltas 还原、多轮历史、图片输入解析、工具调用、tools 被拒后的降级、base64 转存、引用卡片、写作工具入参/出参解析与降级、非目标 URL 透传。

协议依据来自 2026-11-05 的三次真实抓包（iOS 27.3 开发者测试版，中国大陆）：文本/出图、视觉智能、写作工具。
