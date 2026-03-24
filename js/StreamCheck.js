/*
 * StreamCheck 流媒体解锁检测
 * 参考 Stream-All by LucaLin233 / Rabbit-Spec
 */

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  'Accept-Language': 'en',
}

function timeout(delay) {
  delay = delay || 5000
  return new Promise(function(resolve, reject) {
    setTimeout(function() { reject('Timeout') }, delay)
  })
}

async function check_netflix() {
  let inner = function() {
    return new Promise(function(resolve, reject) {
      $httpClient.get(
        { url: 'https://www.netflix.com/title/81280792', headers: REQUEST_HEADERS },
        function(error, response, data) {
          if (error) { reject('Error'); return }
          if (response.status === 404) { resolve('Netflix: ✅ US'); return }
          if (response.status === 200) {
            var m = data.match(/"requestCountry":"([^"]+)"/)
            resolve('Netflix: ✅ ' + (m ? m[1].toUpperCase() : '?'))
            return
          }
          resolve('Netflix: ❌')
        }
      )
    })
  }
  return Promise.race([inner(), timeout()]).catch(function(e) {
    return e === 'Timeout' ? 'Netflix: ⏱' : 'Netflix: ❌'
  })
}

async function check_disney() {
  let inner = function() {
    return new Promise(function(resolve, reject) {
      $httpClient.get(
        { url: 'https://www.disneyplus.com/', headers: REQUEST_HEADERS },
        function(error, response, data) {
          if (error) { reject('Error'); return }
          if (response.status !== 200 || data.indexOf('Sorry, Disney+ is not available in your region.') !== -1) {
            resolve('Disney+: ❌'); return
          }
          var m = data.match(/Region: ([A-Za-z]{2})/)
          resolve('Disney+: ✅ ' + (m ? m[1].toUpperCase() : '?'))
        }
      )
    })
  }
  return Promise.race([inner(), timeout()]).catch(function(e) {
    return e === 'Timeout' ? 'Disney+: ⏱' : 'Disney+: ❌'
  })
}

async function check_youtube() {
  let inner = function() {
    return new Promise(function(resolve, reject) {
      $httpClient.get(
        { url: 'https://www.youtube.com/premium', headers: REQUEST_HEADERS },
        function(error, response, data) {
          if (error || response.status !== 200) { reject('Error'); return }
          if (data.indexOf('Premium is not available in your country') !== -1) {
            resolve('YouTube Premium: ❌'); return
          }
          var m = data.match(/"countryCode":"([^"]+)"/)
          resolve('YouTube Premium: ✅ ' + (m ? m[1].toUpperCase() : '?'))
        }
      )
    })
  }
  return Promise.race([inner(), timeout()]).catch(function(e) {
    return e === 'Timeout' ? 'YouTube Premium: ⏱' : 'YouTube Premium: ❌'
  })
}

;(async () => {
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
  ]).then(function(results) {
    panel.content = results.join('\n')
    panel.title = '流媒体解锁'
  }).finally(function() {
    $done(panel)
  })
})()
