# Apple 智能换模型（问千问）

把国行 Apple 智能里「问千问」那条链路，改接到你自己的 OpenAI 兼容 provider。

覆盖 **纯文本回答、视觉智能识别、写作工具** 三条链路。**画图不接管**：识别到画图意图时原样放行，仍由千问出图。

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

所以可以在 Egern 的 `http_request` 脚本里直接吞掉请求，按原样 SSE 事件壳回包。

两个容易踩的点：

1. **`input` 里只有当前这一句**，多轮历史存在服务端 session。本模块自己用 `ctx.storage` 按 `sess_xxx` 存历史（写作工具除外）。
2. **正文是双重 JSON 编码**。`text.value.delta` 的 `delta` 是字符串片段，拼起来之后本身还要再 `JSON.parse` 一次，内层才是：

```json
{"content":"...","isRequestingUserInput":false,"summary":"...","suggestions":["","",""]}
```

---

## 三条链路

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

## 画图为什么放行

画图请求从形态上和普通提问完全一样（`input` 只有一句话，`server_tools` 里带 `image_generator`），**没法在请求发出前判断这次会不会出图**。

所以脚本只做一件事：命中明确的画图句式就**返回 `undefined` 原样放行**，整条请求回到千问，出图、图片 URL、`image_generator_call` 事件全部由千问原生处理，本模块不参与。

命中规则（`IMAGE_INTENT`）：

- `画/绘制/生成/做/来/设计` + `图片/图像/插画/海报/头像/壁纸/照片/表情包/logo/banner`
- `画/绘制/生成` + 量词（`一只`、`两张`…）
- 英文 `draw/paint/sketch/render/generate/create/make` + `image/picture/photo/...`

代价：说法太绕（例如「帮我弄一张海边日落的图」）可能不被识别，会被当成普通提问交给你的 provider。这种情况换个说法，或者直接说「画一张…」。

---

## 安装

1. Egern → 配置 → 模块 → 添加模块，填上面的地址。
2. 进入模块设置，至少填 **接口地址**、**密钥**、**模型**。接口地址写到 `/v1` 就行，例如 `https://api.openai.com/v1`。
3. 确认模块已启用，MITM 里包含 `prod-yabuli.qianwen.com`（模块会自动合并）。
4. 手机上装好 Egern 的 CA 证书，并在「设置 → 通用 → 关于本机 → 证书信任设置」打开完全信任。
5. 重开 Siri，选千问问一句。

不需要再配任何图片相关参数。

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

上游对话接口同时兼容 `choices[0].message.content` 和 Responses 的 `output_text` / `output[].content[].text`。

---

## 已知限制

- **只覆盖「问千问」、视觉智能的识别/询问和写作工具**。端侧模型和苹果自研云端模型不经过这个接口，拦截不到。
- **画图只能靠句式判断**：命中画图句式才放行，说法太绕会被当成普通提问。
- **写作工具只认 `compose_` 前缀的配置组**。抓到的是 `compose_selectedAndAllText`；如果后续系统换了 group id 或不带这个字段，请求会掉回 Siri 对话逻辑。
- **写作工具是单轮的**。不读会话历史，每次只按客户端带上来的原文和改写要求处理；App 里连续点建议时若只发增量、不带原文，效果会退化。
- **视觉图片只用于当轮**。会话历史里只存 `[图片]` 占位，后续追问看不到那张图。
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
| 完全没变化 | 模块没启用；MITM 没开；CA 证书没信任 |
| 连接直接失败 | 不要把 `*.apple.com` / `gateway.icloud.com.cn` 加进 MITM，那些有 pinning |

在 Egern 的请求记录里筛 `prod-yabuli.qianwen.com`，能看到脚本是否命中。

---

## 测试

```bash
node --test tests/apple-intelligence-qwen.test.cjs
```

28 条，覆盖：三条链路的事件序列与抓包逐项一致、deltas 还原、多轮历史、图片输入解析、引用卡片、写作工具入参/出参解析与降级、画图意图放行、非目标 URL 透传。

协议依据来自 2026-11-05 的三次真实抓包（iOS 27.3 开发者测试版，中国大陆）：文本、视觉智能、写作工具。
