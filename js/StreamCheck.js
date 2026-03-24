/*
 * StreamCheck 流媒体解锁检测
 * 支持：Netflix / Disney+ / YouTube Premium / HBO Max / Hulu
 *       Amazon Prime / BBC iPlayer / Bahamut / Bilibili
 *       Abema / DAZN / Crunchyroll / Paramount+ / Peacock
 *       Apple TV+ / Spotify / Discovery+ / ESPN+
 */

// 解析参数：IPv4:true,IPv6:false
const args = (() => {
  const obj = { IPv4: true, IPv6: false }
  const raw = $argument || ''
  raw.split(',').forEach(seg => {
    const [k, v] = seg.split('=')
    if (k && v !== undefined) obj[k.trim()] = v.trim().toLowerCase() === 'true'
  })
  return obj
})()

const TIMEOUT = 6000

// 各服务检测配置
const SERVICES = [
  {
    name: 'Netflix',
    url: 'https://www.netflix.com/title/81280792',
    check: (status, body) => {
      if (status === 404) return { ok: true, region: 'US' }
      if (status === 200) {
        const m = body.match(/"requestCountry":"([^"]+)"/)
        return { ok: true, region: m ? m[1] : '?' }
      }
      if (status === 403 || status === 0) return { ok: false }
      return { ok: true, region: '?' }
    }
  },
  {
    name: 'Disney+',
    url: 'https://www.disneyplus.com',
    check: (status, body) => {
      if (body && body.includes('disneyplus.com/login')) return { ok: true, region: '?' }
      if (body && body.includes('unavailable')) return { ok: false }
      if (status === 200) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'YouTube Premium',
    url: 'https://www.youtube.com/premium',
    check: (status, body) => {
      if (!body) return { ok: false }
      if (body.includes('Premium is not available in your country')) return { ok: false }
      if (body.includes('youtubepremium') || body.includes('MWEB_TIER')) return { ok: true, region: '?' }
      if (status === 200) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'HBO Max',
    url: 'https://www.max.com',
    check: (status, body) => {
      if (status === 200 && body && !body.includes('not available')) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'Hulu',
    url: 'https://www.hulu.com',
    check: (status, body) => {
      if (status === 200) return { ok: true, region: 'US' }
      if (status === 403) return { ok: false }
      return { ok: false }
    }
  },
  {
    name: 'Amazon Prime',
    url: 'https://www.amazon.com/gp/video/storefront',
    check: (status, body) => {
      if (status === 200 && body && body.includes('prime-video')) return { ok: true, region: '?' }
      if (status === 403 || status === 302) return { ok: false }
      return { ok: status === 200 }
    }
  },
  {
    name: 'BBC iPlayer',
    url: 'https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/bbc_one_london',
    check: (status, body) => {
      if (!body) return { ok: false }
      if (body.includes('geolocation')) return { ok: false }
      if (body.includes('href')) return { ok: true, region: 'UK' }
      return { ok: false }
    }
  },
  {
    name: 'Bahamut',
    url: 'https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=14667',
    check: (status, body) => {
      if (!body) return { ok: false }
      if (body.includes('animeSn')) return { ok: true, region: 'TW' }
      const j = tryJSON(body)
      if (j && j.error && j.error.includes('restricted')) return { ok: false }
      return { ok: false }
    }
  },
  {
    name: 'Bilibili',
    url: 'https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&session=&module=bangumi',
    check: (status, body) => {
      if (!body) return { ok: false }
      const j = tryJSON(body)
      if (!j) return { ok: false }
      if (j.code === 0) return { ok: true, region: 'CN' }
      if (j.code === -10403) return { ok: false }  // 大陆地区专属
      // 尝试港澳台
      return { ok: false }
    }
  },
  {
    name: 'Abema',
    url: 'https://api.abema.io/v1/ip/check?device=pc',
    check: (status, body) => {
      if (!body) return { ok: false }
      const j = tryJSON(body)
      if (!j) return { ok: false }
      if (j.isoCountryCode === 'JP') return { ok: true, region: 'JP' }
      if (j.isoCountryCode) return { ok: false, region: j.isoCountryCode }
      return { ok: false }
    }
  },
  {
    name: 'DAZN',
    url: 'https://startup.core.indazn.com/misl/v5/Startup?Platform=web',
    check: (status, body) => {
      if (!body) return { ok: false }
      const j = tryJSON(body)
      if (!j) return { ok: false }
      if (j.Region) return { ok: true, region: j.Region }
      return { ok: false }
    }
  },
  {
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com',
    check: (status, body) => {
      if (status === 200 && body && !body.includes('not available')) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'Paramount+',
    url: 'https://www.paramountplus.com',
    check: (status, body) => {
      if (status === 200) return { ok: true, region: '?' }
      if (status === 403 || status === 302) return { ok: false }
      return { ok: false }
    }
  },
  {
    name: 'Peacock',
    url: 'https://www.peacocktv.com',
    check: (status, body) => {
      if (status === 200) return { ok: true, region: 'US' }
      return { ok: false }
    }
  },
  {
    name: 'Apple TV+',
    url: 'https://tv.apple.com',
    check: (status, body) => {
      if (status === 200) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'Spotify',
    url: 'https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=support%40spotify.com',
    check: (status, body) => {
      if (!body) return { ok: false }
      const j = tryJSON(body)
      if (!j) return { ok: false }
      if (j.country) return { ok: true, region: j.country }
      return { ok: false }
    }
  },
  {
    name: 'Discovery+',
    url: 'https://www.discoveryplus.com',
    check: (status, body) => {
      if (status === 200 && body && !body.includes('not available')) return { ok: true, region: '?' }
      return { ok: false }
    }
  },
  {
    name: 'ESPN+',
    url: 'https://www.espnplus.com',
    check: (status, body) => {
      if (status === 200) return { ok: true, region: 'US' }
      return { ok: false }
    }
  }
]

function tryJSON(str) {
  try { return JSON.parse(str) } catch { return null }
}

// 单次请求，node 指定 'IPv4' 或 'IPv6'
function request(svc, node, cb) {
  $httpClient.get(
    {
      url: svc.url,
      timeout: TIMEOUT / 1000,
      node,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    },
    (err, resp, body) => {
      const status = err ? 0 : (resp ? resp.status : 0)
      let r
      try { r = svc.check(status, body || '') } catch { r = { ok: false } }
      cb({ name: `${svc.name}${node === 'IPv6' ? ' (v6)' : ''}`, ...r })
    }
  )
}

// 并发请求所有服务（按 IPv4/IPv6 参数决定）
function checkAll() {
  if (!args.IPv4 && !args.IPv6) {
    $done({ title: '流媒体解锁', content: '请至少启用 IPv4 或 IPv6 其中一项', icon: 'exclamationmark.circle' })
    return
  }

  const tasks = []
  SERVICES.forEach(svc => {
    if (args.IPv4) tasks.push({ svc, node: 'IPv4' })
    if (args.IPv6) tasks.push({ svc, node: 'IPv6' })
  })

  const results = []
  let pending = tasks.length

  tasks.forEach(({ svc, node }) => {
    request(svc, node, r => {
      results.push(r)
      pending--
      if (pending === 0) render(results)
    })
  })
}

function render(results) {
  const unlocked = results.filter(r => r.ok)
  const locked   = results.filter(r => !r.ok)

  const unlockedCount = unlocked.length
  const total = results.length

  // 标题颜色按解锁率
  let titleColor
  const ratio = unlockedCount / total
  if (ratio >= 0.7) titleColor = '#34C759'
  else if (ratio >= 0.4) titleColor = '#FF9500'
  else titleColor = '#FF3B30'

  // 解锁列表
  const unlockedLines = unlocked.map(r => {
    const region = (r.region && r.region !== '?') ? ` · ${r.region}` : ''
    return `✅ ${r.name}${region}`
  })

  // 未解锁列表
  const lockedLines = locked.map(r => `❌ ${r.name}`)

  const content = [
    `解锁 ${unlockedCount}/${total}`,
    '',
    ...unlockedLines,
    ...(lockedLines.length ? ['', ...lockedLines] : [])
  ].join('\n')

  $done({
    title: `流媒体解锁 ${unlockedCount}/${total}`,
    content,
    icon: ratio >= 0.7 ? 'play.tv.fill' : ratio >= 0.4 ? 'play.tv' : 'xmark.circle',
    'title-color': titleColor
  })
}

checkAll()
