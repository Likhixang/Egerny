/*
 * 由@LucaLin233编写
 * 原脚本地址：https://raw.githubusercontent.com/LucaLin233/Luca_Conf/main/Surge/JS/stream-all.js
 * 由@Rabbit-Spec修改
 * 更新日期：2024.06.01
 * 版本：3.1
 */

const REQUEST_HEADERS = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
    'Accept-Language': 'en',
}

// 即将登陆
const STATUS_COMING = 2
// 支持解锁
const STATUS_AVAILABLE = 1
// 不支持解锁
const STATUS_NOT_AVAILABLE = 0
// 检测超时
const STATUS_TIMEOUT = -1
// 检测异常
const STATUS_ERROR = -2

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'

function timeout(delay) {
  delay = delay || 5000
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('Timeout'), delay)
  })
}

  ;(async () => {
    let panel_result = {
      title: '流媒体解锁检测',
      content: '',
      icon: 'play.tv.fill',
      'icon-color': '#FF2D55',
    }
  let [{ region, status }] = await Promise.all([testDisneyPlus()])
    await Promise.all([
      check_youtube_premium(),
      check_netflix(),
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
      .then((result) => {
        let disney_result = ''
        let regionStr = (region && typeof region === 'string') ? region.toUpperCase() : ''
        if (status == STATUS_COMING) {
          disney_result = 'Disney+: 即将登陆 ' + regionStr
        } else if (status == STATUS_AVAILABLE) {
          disney_result = 'Disney+: 已解锁 ➟ ' + regionStr
        } else if (status == STATUS_NOT_AVAILABLE) {
          disney_result = 'Disney+: 未支持 🚫'
        } else if (status == STATUS_TIMEOUT) {
          disney_result = 'Disney+: 检测超时 🚦'
        }
        result.splice(1, 0, disney_result)
        let content = result.join('\n')
        panel_result['content'] = content
      })
      .finally(() => {
        $done(panel_result)
      })
  })()
  async function check_youtube_premium() {
    let inner_check = () => {
      return new Promise((resolve, reject) => {
        let option = {
          url: 'https://www.youtube.com/premium',
          headers: REQUEST_HEADERS,
        }
        $httpClient.get(option, function (error, response, data) {
          if (error != null || response.status !== 200) {
            reject('Error')
            return
          }
  
          if (data.indexOf('Premium is not available in your country') !== -1) {
            resolve('Not Available')
            return
          }
  
          let region = ''
          let re = new RegExp('"countryCode":"(.*?)"', 'gm')
          let result = re.exec(data)
          if (result != null && result.length === 2) {
            region = result[1]
          } else if (data.indexOf('www.google.cn') !== -1) {
            region = 'CN'
          } else {
            region = 'US'
          }
          resolve(region)
        })
      })
    }
  
    let youtube_check_result = 'YouTube: '
  
    await inner_check()
      .then((code) => {
        if (code === 'Not Available') {
          youtube_check_result += '不支持解锁'
        } else {
          youtube_check_result += '已解锁 ➟ ' + code.toUpperCase()
        }
      })
      .catch((error) => {
        youtube_check_result += '检测失败，请刷新面板'
      })
  
    return youtube_check_result
  }

  async function check_netflix() {
    let inner_check = (filmId) => {
      return new Promise((resolve, reject) => {
        let option = {
          url: 'https://www.netflix.com/title/' + filmId,
          headers: REQUEST_HEADERS,
        }
        $httpClient.get(option, function (error, response, data) {
          if (error != null) {
            reject('Error')
            return
          }
  
          if (response.status === 403) {
            reject('Not Available')
            return
          }
  
          if (response.status === 404) {
            resolve('Not Found')
            return
          }
  
          if (response.status === 200) {
            let url = response.headers['x-originating-url']
            let region = url.split('/')[3]
            region = region.split('-')[0]
            if (region == 'title') {
              region = 'us'
            }
            resolve(region)
            return
          }
  
          reject('Error')
        })
      })
    }
  
    let netflix_check_result = 'Netflix: '
  
    await inner_check(81280792)
      .then((code) => {
        if (code === 'Not Found') {
          return inner_check(80018499)
        }
        netflix_check_result += '已完整解锁 ➟ ' + code.toUpperCase()
        return Promise.reject('BreakSignal')
      })
      .then((code) => {
        if (code === 'Not Found') {
          return Promise.reject('Not Available')
        }
  
        netflix_check_result += '仅解锁自制剧 ➟ ' + code.toUpperCase()
        return Promise.reject('BreakSignal')
      })
      .catch((error) => {
        if (error === 'BreakSignal') {
          return
        }
        if (error === 'Not Available') {
          netflix_check_result += '该节点不支持解锁'
          return
        }
        netflix_check_result += '检测失败，请刷新面板'
      })
  
    return netflix_check_result
  }

  async function testDisneyPlus() {
    try {
        let { region, cnbl } = await Promise.race([testHomePage(), timeout(7000)])
        console.log(`homepage: region=${region}, cnbl=${cnbl}`)
        // 即将登陆
    //  if (cnbl == 2) {
    //    return { region, status: STATUS_COMING }
    //  }
        let { countryCode, inSupportedLocation } = await Promise.race([getLocationInfo(), timeout(7000)])
        console.log(`getLocationInfo: countryCode=${countryCode}, inSupportedLocation=${inSupportedLocation}`)
        
        region = countryCode ?? region
        console.log( "region:"+region)
        // 即将登陆
        if (inSupportedLocation === false || inSupportedLocation === 'false') {
          return { region, status: STATUS_COMING }
        } else {
          // 支持解锁
          return { region, status: STATUS_AVAILABLE }
        }
        
      } catch (error) {
        console.log("error:"+error)
        
        // 不支持解锁
        if (error === 'Not Available') {
          console.log("不支持")
          return { status: STATUS_NOT_AVAILABLE }
        }
        
        // 检测超时
        if (error === 'Timeout') {
          return { status: STATUS_TIMEOUT }
        }
        
        return { status: STATUS_ERROR }
      } 
      
    }
      
      function getLocationInfo() {
        return new Promise((resolve, reject) => {
          let opts = {
            url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
            headers: {
              'Accept-Language': 'en',
              Authorization: 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
              'Content-Type': 'application/json',
              'User-Agent': UA,
            },
            body: JSON.stringify({
              query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
              variables: {
                input: {
                  applicationRuntime: 'chrome',
                  attributes: {
                    browserName: 'chrome',
                    browserVersion: '94.0.4606',
                    manufacturer: 'apple',
                    model: null,
                    operatingSystem: 'macintosh',
                    operatingSystemVersion: '10.15.7',
                    osDeviceIds: [],
                  },
                  deviceFamily: 'browser',
                  deviceLanguage: 'en',
                  deviceProfile: 'macosx',
                },
              },
            }),
          }
      
          $httpClient.post(opts, function (error, response, data) {
            if (error) {
              reject('Error')
              return
            }
      
            if (response.status !== 200) {
              console.log('getLocationInfo: ' + data)
              reject('Not Available')
              return
            }
      
            data = JSON.parse(data)
            if(data?.errors){
              console.log('getLocationInfo: ' + data)
              reject('Not Available')
              return
            }
      
            let {
              token: { accessToken },
              session: {
                inSupportedLocation,
                location: { countryCode },
              },
            } = data?.extensions?.sdk
            resolve({ inSupportedLocation, countryCode, accessToken })
          })
        })
      }
      
      function testHomePage() {
        return new Promise((resolve, reject) => {
          let opts = {
            url: 'https://www.disneyplus.com/',
            headers: {
              'Accept-Language': 'en',
              'User-Agent': UA,
            },
          }
      
          $httpClient.get(opts, function (error, response, data) {
            if (error) {
              reject('Error')
              return
            }
            if (response.status !== 200 || data.indexOf('Sorry, Disney+ is not available in your region.') !== -1) {
              reject('Not Available')
              return
            }
      
            let match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/)
            if (!match) {
              resolve({ region: '', cnbl: '' })
              return
            }
      
            let region = match[1]
            let cnbl = match[2]
            resolve({ region, cnbl })
          })
        })
      }
      

async function check_hbomax() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.max.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200 && data.indexOf('not available in your region') === -1) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'HBO Max: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_hulu() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.hulu.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('US'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Hulu: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_amazon() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.amazon.com/gp/video/storefront', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Amazon Prime: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_bbc() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/bbc_one_london', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (data.indexOf('geolocation') !== -1) { resolve('Not Available'); return }
        if (data.indexOf('href') !== -1) { resolve('UK'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'BBC iPlayer: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_bahamut() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=14667', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (data.indexOf('animeSn') !== -1) { resolve('TW'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Bahamut: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_bilibili() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&module=bangumi', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        try {
          let j = JSON.parse(data)
          if (j.code === 0) { resolve('大陆'); return }
        } catch(e) {}
        resolve('Not Available')
      })
    })
  }
  let result = 'Bilibili: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_abema() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://api.abema.io/v1/ip/check?device=pc', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        try {
          let j = JSON.parse(data)
          if (j.isoCountryCode === 'JP') { resolve('JP'); return }
        } catch(e) {}
        resolve('Not Available')
      })
    })
  }
  let result = 'Abema: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_dazn() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://startup.core.indazn.com/misl/v5/Startup?Platform=web', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        try {
          let j = JSON.parse(data)
          if (j.Region) { resolve(j.Region.toUpperCase()); return }
        } catch(e) {}
        resolve('Not Available')
      })
    })
  }
  let result = 'DAZN: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_crunchyroll() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.crunchyroll.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200 && data.indexOf('not available') === -1) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Crunchyroll: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_paramount() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.paramountplus.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Paramount+: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_peacock() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.peacocktv.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('US'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Peacock: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_appletv() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://tv.apple.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Apple TV+: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_spotify() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=support%40spotify.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        try {
          let j = JSON.parse(data)
          if (j.country) { resolve(j.country.toUpperCase()); return }
        } catch(e) {}
        resolve('Not Available')
      })
    })
  }
  let result = 'Spotify: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_discovery() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.discoveryplus.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200 && data.indexOf('not available') === -1) { resolve('Available'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'Discovery+: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Available' ? '已解锁 ✅' : '未支持 🚫'
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}

async function check_espn() {
  let inner_check = () => {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: 'https://www.espnplus.com', headers: REQUEST_HEADERS }, function(error, response, data) {
        if (error) { reject('Error'); return }
        if (response.status === 200) { resolve('US'); return }
        resolve('Not Available')
      })
    })
  }
  let result = 'ESPN+: '
  await Promise.race([inner_check(), timeout()]).then((code) => {
    result += code === 'Not Available' ? '未支持 🚫' : '已解锁 ➟ ' + code
  }).catch((e) => { result += e === 'Timeout' ? '检测超时 🚦' : '检测失败' })
  return result
}