# 🧩 X-search

**Safari 快速搜索 & 页面直达 —— 关键词 + 空格 + 内容，即时跳转**

> ⚡️ 基于 DuckDuckGo Rewrite 规则的极速搜索快捷方案

---

## 📄 基本信息

| 字段 | 说明 |
|:------|:-------------|
| **名称** | X-search |
| **简介** | Safari 快速搜索与页面直达，通过“关键词 + 空格 + 内容”实现即时重定向 |
| **作者** | [Li Khixang](https://github.com/Likhixang) |
| **主页** | [GitHub / Likhixang](https://github.com/Likhixang) |
| **图标** | ![X-search icon](https://raw.githubusercontent.com/Likhixang/Egerny/refs/heads/main/icons/X-search.png) |
| **日期** | 2026-01-17 17:47:00 |

---

## ⚙️ 使用方法

1. **将 Safari 默认搜索引擎设置为** → `DuckDuckGo`
2. **在地址栏输入以下格式：**

关键词 + 空格 + 搜索内容

例如：

- `bd 人工智能` → 打开百度搜索“人工智能”
- `gpt how to use X-search` → 打开 ChatGPT 搜索
- `gh Looney` → 在 GitHub 搜索 “Looney”

---

## 🔍 支持的 Quickword

| Quickword | 说明 | 目标 |
|:----------:|:-------------|:--------|
| **bd** | 百度 | [baidu.com](https://www.baidu.com/) |
| **bdimg** | 百度图片 | [image.baidu.com](https://image.baidu.com/) |
| **b**, **bing** | Bing | [bing.com](https://www.bing.com/) |
| **gai**, **gaimode**, **aimode** | Google 搜索 AI 模式 | [google.com](https://www.google.com/search?udm=50)) |
| **g**, **gg**, **google** | Google 搜索 | [google.com](https://www.google.com/) |
| **gimg** | Google 图片 | [images.google.com](https://images.google.com/) |
| **gpt**, **chatgpt** | ChatGPT | [chatgpt.com](https://chatgpt.com/) |
| **pp** | Perplexity AI | [perplexity.ai](https://www.perplexity.ai/) |
| **wk**, **wiki** | 维基百科（中文） | [zh.wikipedia.org](https://zh.wikipedia.org/) |
| **qm** | 七麦数据 | [qimai.cn](https://www.qimai.cn/) |
| **gh**, **github** | GitHub | [github.com](https://github.com/) |
| **tf**, **testflight** | TestFlight 应用（Google 搜索） | [testflight.apple.com](https://testflight.apple.com/) |
| **fanyi** | Google 翻译 | [translate.google.com](https://translate.google.com/) |
| **yt**, **youtube** | YouTube | [youtube.com](https://www.youtube.com/) |
| **pornhub** | Pornhub | [cn.pornhub.com](https://cn.pornhub.com/) |
| **tmdb** | 电影数据库 | [themoviedb.org](https://www.themoviedb.org/) |
| **ddg** | DuckDuckGo 自搜索 | [duckduckgo.com](https://duckduckgo.com/) |
| **默认** | Bing（兜底） | [bing.com](https://www.bing.com/) |

---

## 🧠 说明

- 本插件通过 **DuckDuckGo 搜索 URL Rewrite 规则** 实现  
- 未识别 `Quickword` 时，**默认使用 Bing 搜索**  
- 仅在 **Safari 搜索引擎 = DuckDuckGo** 时生效  
- 可自由自定义关键词与跳转目标

---

## 🧪 使用示例

| 输入 | 跳转结果 |
|:------|:--------------|
| `bd AI研究` | [百度搜索 AI研究](https://www.baidu.com/s?wd=AI研究) |
| `gimg cat` | [Google 图片 cat](https://www.google.com/search?tbm=isch&q=cat) |
| `gh X-search` | [GitHub 搜索 X-search](https://github.com/search?q=X-search) |
| `fanyi bonjour` | [Google 翻译 bonjour](https://translate.google.com/#view=home&op=translate&sl=auto&tl=zh-CN&text=bonjour) |
| `tf Looney` | Google 搜索 “Looney site:testflight.apple.com” |

---

## 🧩 [Mitm]

hostname = duckduckgo.com

---

## 🕒 更新日志

| 日期 | 变更 |
|:------|:--------|
| **2025-10-13** | 初始发布，支持 17 个 Quickword，默认 Bing 兜底 |
| **2025-12-19** | 由Loon Plugin适配Egern Module |

---

**作者：** [Li Khixang](https://github.com/Likhixang)  
**项目：** [Egerny / X-search](https://github.com/Likhixang/Egerny)  
**许可证：** MIT
