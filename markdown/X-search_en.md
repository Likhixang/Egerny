# 🧩 X-search

**Safari Quick Search & Page Jump — Instant redirect via keyword + space + content**

> ⚡️ Superfast search shortcuts integrated with DuckDuckGo rewrite rules.

---

## 📄 Basic Info

| Field | Description |
|:------|:-------------|
| **Name** | X-search |
| **Description** | Safari quick search and page jump, keywords + space + content for instant redirect |
| **Author** | [Li Khixang](https://github.com/Likhixang) |
| **Homepage** | [GitHub / Likhixang](https://github.com/Likhixang) |
| **Icon** | ![X-search icon](https://raw.githubusercontent.com/Likhixang/Egerny/refs/heads/main/icons/X-search.png) |
| **Date** | 2026-11-11 20:50:00 |

---

## ⚙️ How to Use

1. **Set Safari's default search engine** → `DuckDuckGo`  
2. **Type in the address bar** using this format:

Quickword + Space + Search content

例如：

- `bd 人工智能` → 打开百度搜索“人工智能”  
- `gpt how to use X-search` → 打开 ChatGPT 搜索  
- `gh Looney` → 在 GitHub 搜索 “Looney”  

---

## 🔍 Quickwords Support

| Quickword | Description | Target |
|:----------:|:-------------|:--------|
| **bd** | Baidu | [baidu.com](https://www.baidu.com/) |
| **bdimg** | Baidu Image | [image.baidu.com](https://image.baidu.com/) |
| **b**, **bing** | Bing | [bing.com](https://www.bing.com/) |
| **gai**, **gaimode**, **aimode** | Google Search AI Mode| [google.com](https://www.google.com/search?udm=50) |
| **g**, **gg**, **google** | Google Search | [google.com](https://www.google.com/) |
| **gimg** | Google Image | [images.google.com](https://images.google.com/) |
| **qq**, **so** | Yuanbao Search (Tencent) | [so.qq.com](https://so.qq.com/) |
| **gpt**, **chatgpt** | ChatGPT | [chatgpt.com](https://chatgpt.com/) |
| **pp** | Perplexity AI | [perplexity.ai](https://www.perplexity.ai/) |
| **wk**, **wiki** | Wikipedia (ZH) | [zh.wikipedia.org](https://zh.wikipedia.org/) |
| **qm** | Qimai App Intelligence | [qimai.cn](https://www.qimai.cn/) |
| **gh**, **github** | GitHub | [github.com](https://github.com/) |
| **tf**, **testflight** | Google Search for TestFlight apps | [testflight.apple.com](https://testflight.apple.com/) |
| **fanyi** | Google Translate | [translate.google.com](https://translate.google.com/) |
| **yt**, **youtube** | YouTube | [youtube.com](https://www.youtube.com/) |
| **pornhub** | Pornhub | [cn.pornhub.com](https://cn.pornhub.com/) |
| **tmdb** | The Movie Database | [themoviedb.org](https://www.themoviedb.org/) |
| **ddg** | DuckDuckGo self-search | [duckduckgo.com](https://duckduckgo.com/) |
| **Default** | Bing (fallback) | [bing.com](https://www.bing.com/) |

---

## 🧠 Notes

- The plugin works by **rewriting DuckDuckGo search URLs** via **Rewrite rules**.  
- If no `Quickword` is detected, **search defaults to Bing**.  
- Supported only when **Safari search engine = DuckDuckGo**.  
- You can freely customize the keyword list or redirect destinations.  

---

## 🧪 Example Usages

| Input | Redirects to |
|:------|:--------------|
| `bd AI研究` | [百度搜索 AI研究](https://www.baidu.com/s?wd=AI研究) |
| `qq AI` | [Yuanbao Search AI](https://so.qq.com/isearch?query=AI) |
| `gimg cat` | [Google 图片 cat](https://www.google.com/search?tbm=isch&q=cat) |
| `gh X-search` | [GitHub 搜索 X-search](https://github.com/search?q=X-search) |
| `fanyi bonjour` | [Google 翻译 bonjour](https://translate.google.com/#view=home&op=translate&sl=auto&tl=zh-CN&text=bonjour) |
| `tf Wechat` | Google 搜索 “Wechat site:testflight.apple.com” |

---

## 🧩 [Mitm]

hostname = duckduckgo.com

---

## 🕒 Update Log

| Date | Change |
|:------|:--------|
| **2025-10-13** | Initial release with 17 Quickwords and Bing fallback. |
| **2025-12-19** | Loon2Egern. |
| **2026-11-11** | Add Yuanbao Search (`qq`, `so`). |

---

**Author:** [Li Khixang](https://github.com/Likhixang)  
**Project:** [Egerny / X-search](https://github.com/Likhixang/Egerny)  
**License:** MIT

---
