# AI Usage 小组件

模块：<https://raw.githubusercontent.com/Likhixang/Egerny/main/sgmodule/AI-Usage.yaml>

在 Egern「工具 → 模块」添加模块 URL，进入模块的 Env 设置服务平台、地址与对应凭据，再到小组件画廊选择 `AI-Usage`。已有安装需更新模块和脚本；新参数会出现在模块设置中。平台选项统一品牌大小写，旧版小写值继续兼容。

## 凭据与指标

- **CLIProxyAPI**：Auto / Admin，`API_KEY` 填 Management Key，不是模型调用密钥。远程管理必须允许手机访问。读取 v0 `/auth-files`，仅 404 时回退 v8 `/credentials`；Codex / Claude OAuth 经管理 `/api-call`（v8 为 `/requests/api-call`）由服务端替换 `$TOKEN$` 查询实际窗口，客户端不下载 OAuth 文件。最多并发读取 6 个未禁用账号，用 FILTER 序号或邮箱可选择后面的账号。其他类型（包括此适配器尚未接入的 Antigravity）只显示状态与「—」，不宣称上游没有接口。
- **Codex2API**：针对 `james-6-23/codex2api`，不宣称兼容全部同名项目。Auto / Admin 使用管理密钥，`X-Admin-Key` 请求 `/api/admin/accounts`，展示上游实际返回的 5H 与长窗口百分比；月窗不标成 7D。API Key 模式使用模型调用 Key 请求 `/api/key-usage/summary`，需后台启用自助用量页；展示累计 USD 余额及模型请求次数，不当作周百分比。
- **AxonHub**：针对官方 `unstable` 的渠道配额 schema。User / Admin 可用已有用户 JWT；`API_KEY` 留空时用 `EMAIL` / `PASSWORD` 登录 `/admin/auth/signin`，随后 Bearer 请求 `/admin/graphql` 的 `queryChannels`，按游标分页，并按 `accountKey` 聚合同一配额账号。只将 `providerQuotaStatus.quotaData._limits[].usageRatio` 作为已用比例，缺字段显示「—」；不把估算 `periodQuota` 当余额。API Key 模式同样需要该 Key 被服务端授予管理查询权限，普通模型调用 Key 不保证可用；旧版缺 schema 会明确报错。
- **Sub2API**：Auto 默认 API Key，Bearer 请求 `/v1/usage`，展示 API Key 限额、实际配置的窗口额度、订阅余额或钱包余额。User 模式可填写用户 JWT；或在 `API_KEY` 留空时用 `EMAIL` / `PASSWORD` 请求 `/api/v1/auth/login`，再请求 `/api/v1/auth/me`。需要验证码或 2FA 时不尝试绕过，请先在网页登录后填写访问令牌。
- **New API**：Auto 默认 API Key，Bearer 请求 `/api/usage/token/`，读取令牌额度；只有上游允许并返回 `user_quota` 时才展示账户额度。User 模式使用后台 PAT / 用户 JWT 请求 `/api/user/self`；旧版需要 `New-Api-User` 时填 `USER_ID`，新版可留空。保留站点内部 quota 单位，不假设固定兑换率，也不标成美元。未设令牌限额不代表账户无限余额。
- **DeepSeek**：Auto / API Key，使用官方模型调用 Key 请求 `/user/balance`，按 `balance_infos` 返回的币种展示余额。只有该平台可将 `SERVER_URL` 留空，默认 `https://api.deepseek.com`。
- **Agy Tools**：此处专指 [lbjlaq/Antigravity-Manager](https://github.com/lbjlaq/Antigravity-Manager)，不是其他同名项目。读取 `GET /api/accounts` 的已保存配额快照，不调用会刷新/写入服务端状态的 quota 接口。设置了独立 `admin_password` 时，在 `PASSWORD` 填管理密码（Auto / Admin）；未设置时 `API_KEY` 填服务的 API Key。API Key 模式强制使用 `API_KEY`，普通 User Token 无管理权限。优先读取 `quota_groups[].buckets[].remaining_fraction`（剩余比例），兼容旧 `models[].percentage`（剩余百分比）。两者方向与 Codex2API 的已用百分比不同，不反转两次。

## 地址与隐私

- `SERVER_URL` 为手机可达的完整 http(s) 服务地址，可含反代路径前缀。不要填服务器内部 localhost，也不自动探测不同端口。
- 不接受 URL 内嵌凭据、query、fragment 或反斜杠；请求不跟随重定向，不携带全局 Cookie，不关闭 TLS 校验。优先使用 HTTPS。
- 登录返回的访问令牌只在本次运行内存使用；缓存仅保存归一化指标，不保存密码、请求头、OAuth 文件或原始响应。
- `MASK_ACCOUNT=true` 对主屏和锁屏所有尺寸的账号名称/邮箱打码。缓存位于设备存储，仍包含归一化账号信息；打码只控制显示。
- `FILTER` 以账号/邮箱/平台/模型关键字或从 1 开始的账号序号筛选，多条件逗号分隔。

## 显示与缓存

原生 Widget DSL 支持 4 种主屏与 3 种锁屏尺寸，深浅色自动适配。百分比仅展示真实剩余配额与进度条；余额保留币种，次数保留数值；未知为「—」，不会补 100% 或生成演示账号。已禁用、账号异常、无指标、部分失败、截断数量都有明确提示。中、大尺寸每账号最多展示两项，其他指标用数量提示；可用 FILTER 选出关注账号或仅匹配特定模型指标。

刷新失败可展示同平台、同主机、同凭据的六小时内成功快照，同时标记「缓存」与上次成功时间。401/403 同样不会把旧快照说成当前成功。超过六小时不再回退。Agy Tools 的服务端旧快照会额外提示「服务缓存」；刷新小组件不等于强制刷新上游账号配额。

脚本请求五分钟后的刷新时间，但实际刷新频率由 iOS 调度，不保证精确周期。

## 测试与边界

```sh
node --test tests/ai-usage.test.cjs
```

测试响应仅为明确标注的离线契约夹具，绝不作为运行时展示数据。验证内容包括品牌兼容、地址校验、鉴权头、响应结构、缺失值/零值、缓存隔离、脱敏及全尺寸 DSL 状态。测试通过不代表已经登录所有真实平台；没有各平台实例凭据与 iOS Egern 设备时，不声称完成真实账户联机测试或设备视觉验收。

## 官方依据

- [Egern Widget DSL](https://egernapp.com/zh-CN/docs/configuration/widgets)、[JavaScript API](https://egernapp.com/zh-CN/docs/javascript-api)、[模块 Env schema](https://egernapp.com/zh-CN/docs/configuration/modules)
- [CLIProxyAPI 管理接口](https://help.router-for.me/management/api)、[官方源码](https://github.com/router-for-me/CLIProxyAPI)
- [Codex2API API 文档](https://github.com/james-6-23/codex2api/blob/main/docs/API.md)、[公开 Key 用量 DTO](https://github.com/james-6-23/codex2api/blob/main/admin/key_usage_public.go)
- [AxonHub 官方源码](https://github.com/looplj/axonhub)
- [Sub2API 用量实现](https://github.com/Wei-Shaw/sub2api/blob/main/backend/internal/handler/gateway_handler.go)、[登录实现](https://github.com/Wei-Shaw/sub2api/blob/main/backend/internal/handler/auth_handler.go)
- [New API 令牌额度](https://github.com/Calcium-Ion/new-api/blob/main/controller/token.go)、[鉴权](https://github.com/Calcium-Ion/new-api/blob/main/middleware/auth.go)
- [DeepSeek 余额 API](https://api-docs.deepseek.com/api/get-user-balance)
- [Antigravity-Manager 路由与响应 DTO](https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/proxy/server.rs)、[管理鉴权](https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/proxy/middleware/auth.rs)、[配额模型](https://github.com/lbjlaq/Antigravity-Manager/blob/main/src-tauri/src/models/quota.rs)
