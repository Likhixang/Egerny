# Apple 智能换模型（问千问）

把国行 Apple 智能里「问千问」那条链路，改接到你自己的 OpenAI 兼容 provider。Siri 界面照常显示，模型换成你的。

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

所以可以在 Egern 的 `http_request` 脚本里直接吞掉请求，按原样 SSE 事件壳回包。

两个容易踩的点：

1. **`input` 里只有当前这一句**，多轮历史存在服务端 session。本模块自己用 `ctx.storage` 按 `sess_xxx` 存历史。
2. **正文是双重 JSON 编码**。`text.value.delta` 的 `delta` 是字符串片段，拼起来之后本身还要再 `JSON.parse` 一次，内层才是：

```json
{"content":"...","isRequestingUserInput":false,"summary":"...","suggestions":["","",""]}
```

---

## 安装

1. Egern → 配置 → 模块 → 添加模块，填上面的地址。
2. 进入模块设置，填 **接口地址**、**密钥**、**模型** 三项，其余保持默认即可。
3. 确认模块已启用，且 MITM 里包含 `prod-yabuli.qianwen.com`（模块会自动合并，不用手动加）。
4. 手机上装好 Egern 的 CA 证书，并在「设置 → 通用 → 关于本机 → 证书信任设置」打开完全信任。
5. 重新打开 Siri，选择用千问回答，问一句试试。

---

## 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `PROVIDER_URL` | 是 | 完整的 `/chat/completions` 地址，不是 `/v1` 根路径 |
| `API_KEY` | 否 | Bearer 密钥；本地网关无鉴权可留空 |
| `MODEL` | 是 | 传给 provider 的 `model` 字段 |
| `SYSTEM_PROMPT` | 否 | 留空用内置默认：简洁、准确、口语化 |
| `TEMPERATURE` | 否 | 0–2，默认 `0.7` |
| `TIMEOUT` | 否 | 等待上游的秒数，默认 120，最大 300 |
| `REPORT_MODEL` | 否 | 回给 Siri 的 `model` 字段，默认 `qwenapp-apple-tqa` |
| `CONTINUE_URL` | 否 | 回答下方的跳转链接，留空不显示 |
| `NOTIFY_ON_ERROR` | 否 | 上游失败时发系统通知 |

上游同时兼容两种返回格式：Chat Completions 的 `choices[0].message.content`，以及 Responses 的 `output_text` / `output[].content[].text`。

---

## 已知限制

- **只覆盖「问千问」**。端侧模型和苹果自研云端模型不经过这个接口，拦截不到。
- **不支持工具调用**。抓包里的 `client_tools` 只有一个 `call_emergency_services`，本模块不会把它转发给上游，所以「让 Siri 报警」这类动作不会触发。
- **不支持服务端工具**。`image_generator` / `file_generator` / `browser` 不会工作，画图请求会退化成纯文本回答。
- **整段返回，不是逐字流式**。Egern 脚本返回的是完整 body，第一个字的延迟等于整段生成时间。
- 需要 iOS 27.3 及以上、国行设备，且已开通 Apple 智能测试资格。

---

## 排错

| 现象 | 排查 |
| --- | --- |
| Siri 回「配置错误」 | 接口地址或模型没填 |
| Siri 回「后端不可用」 | 上游地址写错、密钥失效，或网关不通 |
| 完全没有变化 | 模块没启用；MITM 没开；CA 证书没信任 |
| 连接直接失败 | 不要把 `*.apple.com` / `gateway.icloud.com.cn` 加进 MITM，那些有 pinning |

在 Egern 的请求记录里筛 `prod-yabuli.qianwen.com`，能看到脚本是否命中。

---

## 测试

```bash
node --test tests/apple-intelligence-qwen.test.cjs
```

覆盖：事件序列与抓包一致、deltas 拼接还原、多轮历史、上游失败兜底、非目标 URL 透传。

协议依据来自 2026-11-05 的一次真实抓包（iOS 27.3 开发者测试版，中国大陆）。
