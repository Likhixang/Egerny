/*
 * StreamCheck 流媒体解锁检测
 * 参考 Stream-All by LucaLin233 / Rabbit-Spec
 */

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  'Accept-Language': 'en',
}

function timeout(delay = 5000) {
  return new Promise((_, reject) => setTimeout(() => reject('Timeout'), delay))
}

function get(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers: REQUEST_HEADERS, timeout: 5 }, (err, resp, data) => {
      if (err) { reject('Error'); return }
      resolve({ status: resp.status, body: data || '' })
    })
  })
}

function tryJSON(s) { try { return JSON.parse(s) } catch { return null } }

async function check_netflix() {
  try {
    const r = await Promise.race([get('https://www.netflix.com/title/81280792'), timeout()])
    if (r.status === 404) return 'Netflix: ✅ US'
    if (r.status === 200) {
      const m = r.body.match(/"requestCountry":"([^"]+)"/)
      return 'Netflix: ✅ ' + (m ? m[1].toUpperCase() : '?')
    }
    return 'Netflix: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Netflix: ⏱' : 'Netflix: ❌'
  }
}

async function check_disney() {
  try {
    const r = await Promise.race([get('https://www.disneyplus.com/'), timeout()])
    if (r.status !== 200 || r.body.indexOf('Sorry, Disney+ is not available in your region.') !== -1) return 'Disney+: ❌'
    const m = r.body.match(/Region: ([A-Za-z]{2})/)
    return 'Disney+: ✅ ' + (m ? m[1].toUpperCase() : '?')
  } catch (e) {
    return e === 'Timeout' ? 'Disney+: ⏱' : 'Disney+: ❌'
  }
}

async function check_youtube() {
  try {
    const r = await Promise.race([get('https://www.youtube.com/premium'), timeout()])
    if (!r.body || r.body.indexOf('Premium is not available in your country') !== -1) return 'YouTube Premium: ❌'
    const m = r.body.match(/"countryCode":"([^"]+)"/)
    return 'YouTube Premium: ✅ ' + (m ? m[1].toUpperCase() : '?')
  } catch (e) {
    return e === 'Timeout' ? 'YouTube Premium: ⏱' : 'YouTube Premium: ❌'
  }
}

async function check_hbomax() {
  try {
    const r = await Promise.race([get('https://www.max.com'), timeout()])
    if (r.status === 200 && r.body.indexOf('not available in your region') === -1) return 'HBO Max: ✅'
    return 'HBO Max: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'HBO Max: ⏱' : 'HBO Max: ❌'
  }
}

async function check_hulu() {
  try {
    const r = await Promise.race([get('https://www.hulu.com'), timeout()])
    if (r.status === 200) return 'Hulu: ✅ US'
    return 'Hulu: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Hulu: ⏱' : 'Hulu: ❌'
  }
}

async function check_amazon() {
  try {
    const r = await Promise.race([get('https://www.amazon.com/gp/video/storefront'), timeout()])
    if (r.status === 200) return 'Amazon Prime: ✅'
    return 'Amazon Prime: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Amazon Prime: ⏱' : 'Amazon Prime: ❌'
  }
}

async function check_bbc() {
  try {
    const r = await Promise.race([get('https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/bbc_one_london'), timeout()])
    if (r.body.indexOf('geolocation') !== -1) return 'BBC iPlayer: ❌'
    if (r.body.indexOf('href') !== -1) return 'BBC iPlayer: ✅ UK'
    return 'BBC iPlayer: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'BBC iPlayer: ⏱' : 'BBC iPlayer: ❌'
  }
}

async function check_bahamut() {
  try {
    const r = await Promise.race([get('https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=14667'), timeout()])
    if (r.body.indexOf('animeSn') !== -1) return 'Bahamut: ✅ TW'
    return 'Bahamut: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Bahamut: ⏱' : 'Bahamut: ❌'
  }
}

async function check_bilibili() {
  try {
    const r = await Promise.race([get('https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&module=bangumi'), timeout()])
    const j = tryJSON(r.body)
    if (!j) return 'Bilibili: ❌'
    if (j.code === 0) return 'Bilibili: ✅ 大陆'
    return 'Bilibili: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Bilibili: ⏱' : 'Bilibili: ❌'
  }
}

async function check_abema() {
  try {
    const r = await Promise.race([get('https://api.abema.io/v1/ip/check?device=pc'), timeout()])
    const j = tryJSON(r.body)
    if (!j) return 'Abema: ❌'
    if (j.isoCountryCode === 'JP') return 'Abema: ✅ JP'
    return 'Abema: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Abema: ⏱' : 'Abema: ❌'
  }
}

async function check_dazn() {
  try {
    const r = await Promise.race([get('https://startup.core.indazn.com/misl/v5/Startup?Platform=web'), timeout()])
    const j = tryJSON(r.body)
    if (j && j.Region) return 'DAZN: ✅ ' + j.Region.toUpperCase()
    return 'DAZN: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'DAZN: ⏱' : 'DAZN: ❌'
  }
}

async function check_crunchyroll() {
  try {
    const r = await Promise.race([get('https://www.crunchyroll.com'), timeout()])
    if (r.status === 200 && r.body.indexOf('not available') === -1) return 'Crunchyroll: ✅'
    return 'Crunchyroll: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Crunchyroll: ⏱' : 'Crunchyroll: ❌'
  }
}

async function check_paramount() {
  try {
    const r = await Promise.race([get('https://www.paramountplus.com'), timeout()])
    if (r.status === 200) return 'Paramount+: ✅'
    return 'Paramount+: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Paramount+: ⏱' : 'Paramount+: ❌'
  }
}

async function check_peacock() {
  try {
    const r = await Promise.race([get('https://www.peacocktv.com'), timeout()])
    if (r.status === 200) return 'Peacock: ✅ US'
    return 'Peacock: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Peacock: ⏱' : 'Peacock: ❌'
  }
}

async function check_appletv() {
  try {
    const r = await Promise.race([get('https://tv.apple.com'), timeout()])
    if (r.status === 200) return 'Apple TV+: ✅'
    return 'Apple TV+: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Apple TV+: ⏱' : 'Apple TV+: ❌'
  }
}

async function check_spotify() {
  try {
    const r = await Promise.race([get('https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=support%40spotify.com'), timeout()])
    const j = tryJSON(r.body)
    if (j && j.country) return 'Spotify: ✅ ' + j.country.toUpperCase()
    return 'Spotify: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Spotify: ⏱' : 'Spotify: ❌'
  }
}

async function check_discovery() {
  try {
    const r = await Promise.race([get('https://www.discoveryplus.com'), timeout()])
    if (r.status === 200 && r.body.indexOf('not available') === -1) return 'Discovery+: ✅'
    return 'Discovery+: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'Discovery+: ⏱' : 'Discovery+: ❌'
  }
}

async function check_espn() {
  try {
    const r = await Promise.race([get('https://www.espnplus.com'), timeout()])
    if (r.status === 200) return 'ESPN+: ✅ US'
    return 'ESPN+: ❌'
  } catch (e) {
    return e === 'Timeout' ? 'ESPN+: ⏱' : 'ESPN+: ❌'
  }
}

;(async () => {
  console.log('[StreamCheck] script started')
  let panel = {
    title: '流媒体解锁',
    content: '',
    icon: 'play.tv.fill',
    'icon-color': '#FF2D55',
  }

  await Promise.all([
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
  ]).then((results) => {
    const unlocked = results.filter(r => r.indexOf('✅') !== -1).length
    const total = results.length
    const ratio = unlocked / total
    if (ratio >= 0.7) panel['icon-color'] = '#34C759'
    else if (ratio >= 0.4) panel['icon-color'] = '#FF9500'
    else panel['icon-color'] = '#FF3B30'
    panel.title = '流媒体解锁 ' + unlocked + '/' + total
    panel.content = results.join('\n')
  }).finally(() => {
    console.log('[StreamCheck] done: ' + panel.title)
    $done(panel)
  })
})()
