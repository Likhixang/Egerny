/*
 * StreamCheck 流媒体解锁检测
 * 支持：Netflix / Disney+ / YouTube Premium / HBO Max / Hulu
 *       Amazon Prime / BBC iPlayer / Bahamut / Bilibili
 *       Abema / DAZN / Crunchyroll / Paramount+ / Peacock
 *       Apple TV+ / Spotify / Discovery+ / ESPN+
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'en' }
const TIMEOUT_MS = 8000

function http_get(url) {
  return Promise.race([
    new Promise((resolve) => {
      $httpClient.get({ url, headers: HEADERS, timeout: 8 }, (err, resp, body) => {
        if (err) resolve({ status: 0, body: '' })
        else resolve({ status: resp.status, body: body || '' })
      })
    }),
    new Promise((resolve) => setTimeout(() => resolve({ status: -1, body: '' }), TIMEOUT_MS))
  ])
}

async function check_netflix() {
  try {
    const r = await http_get('https://www.netflix.com/title/81280792')
    if (r.status === 404) return 'Netflix: ✅ US'
    if (r.status === 200) {
      const m = r.body.match(/"requestCountry":"([^"]+)"/)
      return `Netflix: ✅ ${m ? m[1].toUpperCase() : '?'}`
    }
    if (r.status === -1) return 'Netflix: ⏱ 超时'
    return 'Netflix: ❌'
  } catch { return 'Netflix: ❌' }
}

async function check_disney() {
  try {
    const r = await http_get('https://www.disneyplus.com/')
    if (r.status === -1) return 'Disney+: ⏱ 超时'
    if (r.status !== 200 || r.body.includes('Sorry, Disney+ is not available in your region.')) return 'Disney+: ❌'
    const m = r.body.match(/Region: ([A-Za-z]{2})/)
    return `Disney+: ✅ ${m ? m[1].toUpperCase() : '?'}`
  } catch { return 'Disney+: ❌' }
}

async function check_youtube() {
  try {
    const r = await http_get('https://www.youtube.com/premium')
    if (r.status === -1) return 'YouTube Premium: ⏱ 超时'
    if (!r.body || r.body.includes('Premium is not available in your country')) return 'YouTube Premium: ❌'
    const m = r.body.match(/"countryCode":"([^"]+)"/)
    return `YouTube Premium: ✅ ${m ? m[1].toUpperCase() : '?'}`
  } catch { return 'YouTube Premium: ❌' }
}

async function check_hbomax() {
  try {
    const r = await http_get('https://www.max.com')
    if (r.status === -1) return 'HBO Max: ⏱ 超时'
    if (r.status === 200 && !r.body.includes('not available in your region')) return 'HBO Max: ✅'
    return 'HBO Max: ❌'
  } catch { return 'HBO Max: ❌' }
}

async function check_hulu() {
  try {
    const r = await http_get('https://www.hulu.com')
    if (r.status === -1) return 'Hulu: ⏱ 超时'
    if (r.status === 200) return 'Hulu: ✅ US'
    return 'Hulu: ❌'
  } catch { return 'Hulu: ❌' }
}

async function check_amazon() {
  try {
    const r = await http_get('https://www.amazon.com/gp/video/storefront')
    if (r.status === -1) return 'Amazon Prime: ⏱ 超时'
    if (r.status === 200) return 'Amazon Prime: ✅'
    return 'Amazon Prime: ❌'
  } catch { return 'Amazon Prime: ❌' }
}

async function check_bbc() {
  try {
    const r = await http_get('https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/bbc_one_london')
    if (r.status === -1) return 'BBC iPlayer: ⏱ 超时'
    if (r.body.includes('geolocation')) return 'BBC iPlayer: ❌'
    if (r.body.includes('href')) return 'BBC iPlayer: ✅ UK'
    return 'BBC iPlayer: ❌'
  } catch { return 'BBC iPlayer: ❌' }
}

async function check_bahamut() {
  try {
    const r = await http_get('https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=14667')
    if (r.status === -1) return 'Bahamut: ⏱ 超时'
    if (r.body.includes('animeSn')) return 'Bahamut: ✅ TW'
    return 'Bahamut: ❌'
  } catch { return 'Bahamut: ❌' }
}

async function check_bilibili() {
  try {
    const r = await http_get('https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&module=bangumi')
    if (r.status === -1) return 'Bilibili: ⏱ 超时'
    const j = tryJSON(r.body)
    if (!j) return 'Bilibili: ❌'
    if (j.code === 0) return 'Bilibili: ✅ 大陆'
    if (j.code === -10403) return 'Bilibili: ❌'
    return 'Bilibili: ❌'
  } catch { return 'Bilibili: ❌' }
}

async function check_abema() {
  try {
    const r = await http_get('https://api.abema.io/v1/ip/check?device=pc')
    if (r.status === -1) return 'Abema: ⏱ 超时'
    const j = tryJSON(r.body)
    if (!j) return 'Abema: ❌'
    if (j.isoCountryCode === 'JP') return 'Abema: ✅ JP'
    return 'Abema: ❌'
  } catch { return 'Abema: ❌' }
}

async function check_dazn() {
  try {
    const r = await http_get('https://startup.core.indazn.com/misl/v5/Startup?Platform=web')
    if (r.status === -1) return 'DAZN: ⏱ 超时'
    const j = tryJSON(r.body)
    if (j && j.Region) return `DAZN: ✅ ${j.Region.toUpperCase()}`
    return 'DAZN: ❌'
  } catch { return 'DAZN: ❌' }
}

async function check_crunchyroll() {
  try {
    const r = await http_get('https://www.crunchyroll.com')
    if (r.status === -1) return 'Crunchyroll: ⏱ 超时'
    if (r.status === 200 && !r.body.includes('not available')) return 'Crunchyroll: ✅'
    return 'Crunchyroll: ❌'
  } catch { return 'Crunchyroll: ❌' }
}

async function check_paramount() {
  try {
    const r = await http_get('https://www.paramountplus.com')
    if (r.status === -1) return 'Paramount+: ⏱ 超时'
    if (r.status === 200) return 'Paramount+: ✅'
    return 'Paramount+: ❌'
  } catch { return 'Paramount+: ❌' }
}

async function check_peacock() {
  try {
    const r = await http_get('https://www.peacocktv.com')
    if (r.status === -1) return 'Peacock: ⏱ 超时'
    if (r.status === 200) return 'Peacock: ✅ US'
    return 'Peacock: ❌'
  } catch { return 'Peacock: ❌' }
}

async function check_appletv() {
  try {
    const r = await http_get('https://tv.apple.com')
    if (r.status === -1) return 'Apple TV+: ⏱ 超时'
    if (r.status === 200) return 'Apple TV+: ✅'
    return 'Apple TV+: ❌'
  } catch { return 'Apple TV+: ❌' }
}

async function check_spotify() {
  try {
    const r = await http_get('https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=support%40spotify.com')
    if (r.status === -1) return 'Spotify: ⏱ 超时'
    const j = tryJSON(r.body)
    if (j && j.country) return `Spotify: ✅ ${j.country.toUpperCase()}`
    return 'Spotify: ❌'
  } catch { return 'Spotify: ❌' }
}

async function check_discovery() {
  try {
    const r = await http_get('https://www.discoveryplus.com')
    if (r.status === -1) return 'Discovery+: ⏱ 超时'
    if (r.status === 200 && !r.body.includes('not available')) return 'Discovery+: ✅'
    return 'Discovery+: ❌'
  } catch { return 'Discovery+: ❌' }
}

async function check_espn() {
  try {
    const r = await http_get('https://www.espnplus.com')
    if (r.status === -1) return 'ESPN+: ⏱ 超时'
    if (r.status === 200) return 'ESPN+: ✅ US'
    return 'ESPN+: ❌'
  } catch { return 'ESPN+: ❌' }
}

function tryJSON(str) {
  try { return JSON.parse(str) } catch { return null }
}

;(async () => {
  const results = await Promise.all([
    check_netflix(),
    check_disney(),
    check_youtube(),
    check_hbomax(),
    check_hulu(),
    check_amazon(),
    check_bbc(),
    check_bahamut(),
    check_bilibili(),
    check_abema(),
    check_dazn(),
    check_crunchyroll(),
    check_paramount(),
    check_peacock(),
    check_appletv(),
    check_spotify(),
    check_discovery(),
    check_espn(),
  ])

  const unlocked = results.filter(r => r.includes('✅')).length
  const total = results.length
  const ratio = unlocked / total

  let iconColor
  if (ratio >= 0.7) iconColor = '#34C759'
  else if (ratio >= 0.4) iconColor = '#FF9500'
  else iconColor = '#FF3B30'

  $done({
    title: `流媒体解锁 ${unlocked}/${total}`,
    content: results.join('\n'),
    icon: 'play.tv.fill',
    'icon-color': iconColor,
  })
})()
