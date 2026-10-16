const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/AI-Usage.js'), 'utf8');
const context = vm.createContext({ console, Date, URL, JSON, Math });
vm.runInContext(source.replace('export default async function(ctx)', 'async function main(ctx)') + `\nglobalThis.api = { main, readConfig, numberOrNull, timestampMs, percentMetric, filterAccounts, cacheKey, syncAIUsage, renderUsageWidget };`, context);
const api = context.api;
const plain = value => JSON.parse(JSON.stringify(value));

function makeContext(env = {}, routes = [], storage = new Map(), family = 'systemMedium') {
  const calls = [];
  const dispatch = async (method, url, options = {}) => {
    calls.push({ method, url, ...options });
    const route = routes.find(item => item.method === method && (typeof item.url === 'function' ? item.url(url) : item.url === url));
    assert.ok(route, `unexpected request: ${method} ${url}`);
    if (route.check) route.check(options);
    if (route.error) throw route.error;
    return { status: route.status || 200, json: async () => structuredClone(route.data) };
  };
  return {
    env, widgetFamily: family, calls,
    http: { get: (url, options) => dispatch('GET', url, options), post: (url, options) => dispatch('POST', url, options) },
    storage: { getJSON: key => storage.has(key) ? structuredClone(storage.get(key)) : null, setJSON: (key, value) => storage.set(key, structuredClone(value)) },
  };
}

const flattenText = node => [node.text || '', ...(node.children || []).map(flattenText)].join(' ');

// 以下构造响应仅用于契约/回归测试，不作为运行时数据，也不声称已联机实测。
test('规范品牌名并兼容旧平台标识', () => {
  for (const [name, key] of [['CLIProxyAPI','cliproxyapi'], ['CLIProxy','cliproxyapi'], ['Codex2API','codex2api'], ['AxonHub','axonhub'], ['Sub2API','sub2api'], ['New API','newapi'], ['DeepSeek','deepseek'], ['Agy Tools','agy']]) {
    assert.equal(api.readConfig({env:{ PROVIDER:name, SERVER_URL:'https://unit.invalid' }}).provider, key);
  }
});

test('除 DeepSeek 外必须显式填写服务地址；拒绝内嵌凭据/重定向风险配置', () => {
  assert.equal(api.readConfig({env:{PROVIDER:'DeepSeek'}}).baseUrl, 'https://api.deepseek.com');
  assert.throws(() => api.readConfig({env:{PROVIDER:'AxonHub'}}), /SERVER_URL/);
  for (const url of ['ftp://unit.invalid', 'https://user:pass@unit.invalid', 'https://unit.invalid?key=secret', 'https://unit.invalid/#foo']) {
    assert.throws(() => api.readConfig({env:{SERVER_URL:url}}), /SERVER_URL/);
  }
  assert.throws(() => api.readConfig({env:{PROVIDER:'does-not-exist'}}), /平台/);
});

test('缺失/空数值不变成 0 或 100%；真正的零值正确保留', () => {
  for (const value of [null, undefined, '', ' ', true, 'not-a-number']) assert.equal(api.numberOrNull(value), null);
  assert.equal(api.percentMetric('7D', null).remaining, null);
  assert.equal(api.percentMetric('5H', 0).remaining, 1);
  assert.equal(api.percentMetric('5H', 100).remaining, 0);
  assert.equal(api.percentMetric('5H', 150).remaining, 0);
  assert.equal(api.percentMetric('5H', -1).remaining, null);
});

test('Unix 秒/毫秒和 ISO reset 时间归一化', () => {
  assert.equal(api.timestampMs(1700000000), 1700000000000);
  assert.equal(api.timestampMs(1700000000000), 1700000000000);
  assert.equal(api.timestampMs('2023-11-14T22:13:20Z'), 1700000000000);
  assert.equal(api.timestampMs(null), null);
  assert.equal(api.timestampMs('invalid'), null);
});

test('FILTER 按账号/模型关键字或 1-based 序号筛选', () => {
  const accounts = [{name:'one',email:'a@unit.invalid',provider:'codex',metrics:[]}, {name:'two',provider:'gemini',metrics:[{label:'flash'}]}];
  assert.equal(api.filterAccounts(accounts, '2')[0].name, 'two');
  assert.equal(api.filterAccounts(accounts, 'flash')[0].name, 'two');
  assert.equal(api.filterAccounts([{name:'fixture',metrics:[{label:'one'},{label:'flash'}]}], 'flash')[0].metrics.length,1);
  assert.equal(api.filterAccounts(accounts, 'a@unit')[0].name, 'one');
  assert.equal(api.filterAccounts(accounts, 'no-match').length, 0);
});

test('缓存隔离平台/主机/凭据/登录账号，cache key 不包含明文 secret', () => {
  const config = {provider:'deepseek',baseUrl:'https://unit.invalid',apiKey:'fixture-secret',mode:'auto',email:'u',password:'p'};
  const base = api.cacheKey(config);
  for (const property of ['provider', 'baseUrl', 'apiKey', 'email', 'password', 'mode']) assert.notEqual(api.cacheKey({...config,[property]:config[property]+'-changed'}), base);
  assert.ok(!base.includes('fixture-secret'));
});

test('配置错误没有任何 HTTP 请求，也没有 demo 或假配额', async () => {
  const ctx = makeContext({PROVIDER:'AxonHub'});
  const widget = await api.main(ctx);
  assert.equal(ctx.calls.length, 0);
  const text = flattenText(widget);
  assert.match(text, /SERVER_URL/);
  assert.doesNotMatch(text, /demo@gmail|100%|Pro 账号示例/);
});

const server = 'https://unit.invalid';
const envFor = (provider, extra = {}) => ({PROVIDER:provider, SERVER_URL:server, API_KEY:'contract-test-key', ...extra});
const route = (url, data, extra = {}) => ({method:'GET',url:server+url,data,...extra});
const sync = async ctx => plain(await api.syncAIUsage(ctx, api.readConfig(ctx)));

test('密码保留原始空格；地址拒绝反斜杠和 query', () => {
  assert.equal(api.readConfig({env:envFor('Agy Tools',{PASSWORD:' pass '})}).password, ' pass ');
  for (const url of ['https://unit.invalid\\\\@evil.invalid','https://unit.invalid\\\\evil','https://unit.invalid/?x=1']) assert.throws(() => api.readConfig({env:{SERVER_URL:url}}));
});

test('DeepSeek Bearer + balance_infos；零/负余额与币种不丢失', async () => {
  const ctx=makeContext(envFor('DeepSeek'),[route('/user/balance',{is_available:false,balance_infos:[{currency:'CNY',total_balance:'0'},{currency:'USD',total_balance:'-0.25'}]},{check:opts=>{
    assert.equal(opts.headers.Authorization,'Bearer contract-test-key');
    assert.equal(opts.redirect,'error'); assert.equal(opts.credentials,'omit'); assert.equal(opts.timeout,5000);
  }})]);
  const data=await sync(ctx); assert.equal(data.error,null);
  assert.deepEqual(data.accounts[0].metrics.map(m=>[m.kind,m.remaining,m.currency]),[['balance',0,'CNY'],['balance',-0.25,'USD']]);
  const text=flattenText(await api.main(ctx)); assert.doesNotMatch(text,/7D|5H|100%/);
});

test('DeepSeek 缺字段为 null，错误 envelope 不得伪装成功', async () => {
  let data=await sync(makeContext(envFor('DeepSeek'),[route('/user/balance',{is_available:true,balance_infos:[{currency:'CNY'}]})]));
  assert.equal(data.accounts[0].metrics[0].remaining,null);
  data=await sync(makeContext(envFor('DeepSeek'),[route('/user/balance',{error:'bad key'})]));
  assert.equal(data.accounts.length,0); assert.match(data.error,/结构/);
});

test('Codex2API Admin 使用 X-Admin-Key；缺配额不补满，月窗不误写7D', async () => {
  const ctx=makeContext(envFor('Codex2API'),[route('/api/admin/accounts',{accounts:[{id:1,email:'test@unit.invalid',enabled:true,status:'active',usage_percent_5h:0,usage_percent_7d:null},{id:2,enabled:false,usage_percent_7d:25,usage_window_7d_kind:'monthly'}]},{check:opts=>{
    assert.equal(opts.headers['X-Admin-Key'],'contract-test-key'); assert.equal(opts.headers.Authorization,undefined);
  }})]);
  const data=await sync(ctx); assert.equal(data.error,null);
  assert.equal(data.accounts[0].metrics[0].remaining,1); assert.equal(data.accounts[0].metrics[1].remaining,null);
  assert.equal(data.accounts[1].status,'disabled'); assert.equal(data.accounts[1].metrics[1].label,'月窗配额');
});

test('Codex2API API Key 用公开用量接口，不把累计余额/请求次数当百分比', async () => {
  const data=await sync(makeContext(envFor('Codex2API',{AUTH_MODE:'API Key'}),[route('/api/key-usage/summary',{key:{name:'test',status:'active',quota_limit:10,quota_used:2},model_request_usage:[{model:'codex',window:'weekly',limit:20,used:5,remaining:15,reset_at:'2030-01-01T00:00:00Z'}]})]));
  assert.equal(data.accounts[0].metrics[0].remaining,8); assert.equal(data.accounts[0].metrics[0].currency,'USD');
  assert.equal(data.accounts[0].metrics[1].kind,'number'); assert.equal(data.accounts[0].metrics[1].remaining,15);
});

test('New API 保留站点额度单位，支持无限Key与可选用户额度', async () => {
  const data=await sync(makeContext(envFor('New API'),[route('/api/usage/token/',{code:true,data:{object:'token_usage',name:'fixture',unlimited_quota:true,total_available:0,total_used:8,user_quota:{total_available:123456,total_used:9}}})]));
  assert.equal(data.error,null); assert.equal(data.accounts[0].metrics[0].remaining,null);
  assert.equal(data.accounts[0].metrics[1].remaining,123456); assert.equal(data.accounts[0].metrics[1].currency,'');
  const widget=api.renderUsageWidget({},data,{title:'New API'},{}); assert.doesNotMatch(flattenText(widget),/USD|7D|5H|100%/);
});

test('New API User ID 可选；填写时发送 New-Api-User 兼容旧站点', async () => {
  const ctx=makeContext(envFor('New API',{AUTH_MODE:'User',USER_ID:'bad'}));
  let data=await sync(ctx); assert.equal(ctx.calls.length,0); assert.match(data.error,/USER_ID/);
  const good=makeContext(envFor('New API',{AUTH_MODE:'User',USER_ID:'7'}),[route('/api/user/self',{success:true,data:{id:7,status:1,username:'fixture',quota:42}},{check:opts=>assert.equal(opts.headers['New-Api-User'],'7')})]);
  data=await sync(good); assert.equal(data.accounts[0].metrics[0].remaining,42);
  data=await sync(makeContext(envFor('New API',{AUTH_MODE:'User'}),[route('/api/user/self',{success:true,data:{id:7,status:1,quota:9}})])); assert.equal(data.accounts[0].metrics[0].remaining,9);
});

test('Sub2API /v1/usage 支持窗口限额与余额；不采用伪造百分比', async () => {
  let data=await sync(makeContext(envFor('Sub2API'),[route('/v1/usage',{mode:'quota_limited',isValid:true,status:'active',quota:{limit:20,used:5,remaining:15,unit:'USD'},rate_limits:[{window:'5h',limit:10,used:2,remaining:8,reset_at:'2030-01-01T00:00:00Z'}]})]));
  assert.equal(data.accounts[0].metrics[0].remaining,15); assert.equal(data.accounts[0].metrics[1].remaining,8); assert.equal(data.accounts[0].metrics[1].kind,'balance');
  data=await sync(makeContext(envFor('Sub2API'),[route('/v1/usage',{mode:'unrestricted',isValid:true,balance:0,unit:'USD'})]));
  assert.equal(data.accounts[0].metrics[0].remaining,0);
});

test('Sub2API User 登录是 POST JSON，JWT 只在内存使用', async () => {
  const storage=new Map();
  const ctx=makeContext(envFor('Sub2API',{AUTH_MODE:'User',API_KEY:'',EMAIL:'user@unit.invalid',PASSWORD:' login-password '}),[
    {method:'POST',url:server+'/api/v1/auth/login',data:{code:0,data:{access_token:'fixture-session-token'}},check:opts=>assert.deepEqual(plain(opts.body),{email:'user@unit.invalid',password:' login-password '})},
    route('/api/v1/auth/me',{code:0,data:{id:7,email:'user@unit.invalid',status:'active',balance:12.5}},{check:opts=>assert.equal(opts.headers.Authorization,'Bearer fixture-session-token')})
  ],storage);
  const data=await sync(ctx); assert.equal(data.error,null); assert.equal(data.accounts[0].metrics[0].remaining,12.5);
  assert.doesNotMatch(JSON.stringify([...storage]),/fixture-session-token|login-password|access_token/);
});

test('Sub2API 2FA 不猜码、不请求其它账号接口', async () => {
  const ctx=makeContext(envFor('Sub2API',{AUTH_MODE:'User',API_KEY:'',EMAIL:'test@unit.invalid',PASSWORD:'password'}),[{method:'POST',url:server+'/api/v1/auth/login',data:{code:0,data:{requires_2fa:true,temp_token:'private-session'}}}]);
  const data=await sync(ctx); assert.equal(ctx.calls.length,1); assert.match(data.error,/2FA/); assert.doesNotMatch(JSON.stringify(data),/private-session/);
});

test('Agy Tools 使用最终指定项目 /api/accounts；管理密码优先，新旧配额共存', async () => {
  const ctx=makeContext(envFor('Agy Tools',{PASSWORD:'admin-password'}),[route('/api/accounts',{accounts:[
    {id:'a',email:'one@unit.invalid',quota:{last_updated:Math.floor(Date.now()/1000),models:[{name:'legacy',percentage:90}],quota_groups:[{display_name:'Gemini',buckets:[{window:'weekly',remaining_fraction:0.25,reset_time:'2030-01-01T00:00:00Z'},{window:'5h',remaining_fraction:null}]}]}},
    {id:'b',proxy_disabled:true,quota:{models:[{name:'claude',percentage:0}]}},
    {id:'c',quota:null}
  ]},{check:opts=>assert.equal(opts.headers.Authorization,'Bearer admin-password')})]);
  const data=await sync(ctx); assert.equal(data.error,null); assert.equal(data.accounts.length,3);
  assert.equal(data.accounts[0].metrics[0].remaining,0.25); assert.equal(data.accounts[0].metrics[1].remaining,null);
  assert.equal(data.accounts[1].metrics[0].remaining,0); assert.equal(data.accounts[1].status,'disabled'); assert.equal(data.accounts[2].metrics.length,0);
  assert.equal(ctx.calls.length,1); assert.doesNotMatch(JSON.stringify(data),/admin-password|contract-test-key/);
});

test('Agy Tools 空列表不生成示例账号，User 模式明确拒绝', async () => {
  let data=await sync(makeContext(envFor('Agy Tools'),[route('/api/accounts',{accounts:[]})])); assert.deepEqual(data.accounts,[]);
  const ctx=makeContext(envFor('Agy Tools',{AUTH_MODE:'User'})); data=await sync(ctx); assert.equal(ctx.calls.length,0); assert.match(data.error,/普通用户/);
});

test('失败使用同配置最近成功快照并标 stale；凭据变化/过期不得回落旧值', async () => {
  const store=new Map(), env=envFor('DeepSeek');
  const ok=makeContext(env,[route('/user/balance',{is_available:true,balance_infos:[{currency:'USD',total_balance:'5'}]})],store);
  const data=await sync(ok);
  const failed=makeContext(env,[route('/user/balance',null,{status:401})],store);
  let cached=await sync(failed); assert.equal(cached.stale,true); assert.equal(cached.lastUpdated,data.lastUpdated); assert.match(cached.error,/401/);
  cached=await sync(makeContext({...env,API_KEY:'another-key'},[route('/user/balance',null,{status:401})],store)); assert.equal(cached.accounts.length,0);
  const key=api.cacheKey(api.readConfig(ok)); store.set(key,{...store.get(key),lastUpdated:Date.now()-7*3600000});
  cached=await sync(failed); assert.equal(cached.accounts.length,0); assert.equal(cached.lastUpdated,null);
});

test('401/403 不轮番猜鉴权或泄漏上游错误内容', async () => {
  for (const status of [401,403]) {
    const ctx=makeContext(envFor('DeepSeek'),[route('/user/balance',{message:'contract-test-key'},{status})]);
    const data=await sync(ctx); assert.equal(ctx.calls.length,1); assert.match(data.error,new RegExp(String(status))); assert.doesNotMatch(JSON.stringify(data),/contract-test-key/);
  }
});

test('CLIProxyAPI auth-files 不当作配额；Codex 通过服务端token替换查询并双层校验', async () => {
  const ctx=makeContext(envFor('CLIProxyAPI'),[
    route('/v0/management/auth-files',{files:[{auth_index:'c1',type:'codex',status:'ready',id_token:{chatgpt_account_id:'account-1'}},{auth_index:'g1',type:'gemini',status:'ready'}]},{check:opts=>assert.equal(opts.headers['X-Management-Key'],'contract-test-key')}),
    {method:'POST',url:server+'/v0/management/api-call',data:{status_code:200,body:JSON.stringify({rate_limit:{primary_window:{used_percent:25,limit_window_seconds:604800,reset_at:1900000000},secondary_window:{used_percent:null,limit_window_seconds:18000}}})},check:opts=>{
      assert.equal(opts.body.auth_index,'c1'); assert.equal(opts.body.url,'https://chatgpt.com/backend-api/wham/usage');
      assert.equal(opts.body.header.Authorization,'Bearer $TOKEN$'); assert.equal(opts.body.header['Chatgpt-Account-Id'],'account-1');
      assert.ok(opts.timeout<=5000); assert.doesNotMatch(JSON.stringify(opts.body),/contract-test-key/);
    }}
  ]);
  const data=await sync(ctx); assert.equal(data.error,null); assert.equal(data.accounts[0].metrics[0].remaining,0.75);
  assert.equal(data.accounts[0].metrics[0].label,'7D 配额'); assert.equal(data.accounts[0].metrics[1].remaining,null);
  assert.equal(data.accounts[1].metrics[0].remaining,null); assert.equal(ctx.calls.length,2);
});

test('CLIProxyAPI Claude utilization 是已用百分比；上游401不当作外层200成功', async () => {
  const routes=[route('/v0/management/auth-files',{files:[{auth_index:'x',type:'claude',status:'ready'}]}),{method:'POST',url:server+'/v0/management/api-call',data:{status_code:200,body:{five_hour:{utilization:0,resets_at:'2030-01-01T00:00:00Z'},seven_day:{utilization:100}}},check:opts=>{
    assert.equal(opts.body.url,'https://api.anthropic.com/api/oauth/usage'); assert.equal(opts.body.header['anthropic-beta'],'oauth-2025-04-20');
  }}];
  let data=await sync(makeContext(envFor('CLIProxyAPI'),routes)); assert.deepEqual(data.accounts[0].metrics.map(m=>m.remaining),[1,0]);
  data=await sync(makeContext(envFor('CLIProxyAPI'),[routes[0],{...routes[1],check:null,data:{status_code:401,body:'{"error":"private"}'}}]));
  assert.match(data.accounts[0].error,/401/); assert.equal(data.accounts[0].metrics[0].remaining,null);
});

test('CLIProxyAPI v8 仅在v0返回404回退，鉴权错误不可重试', async () => {
  let ctx=makeContext(envFor('CLIProxyAPI'),[route('/v0/management/auth-files',null,{status:404}),route('/v8/management/credentials',{files:[]})]);
  let data=await sync(ctx); assert.equal(data.error,null); assert.equal(ctx.calls.length,2);
  for(const status of [401,403]){
    ctx=makeContext(envFor('CLIProxyAPI'),[route('/v0/management/auth-files',null,{status})]); data=await sync(ctx); assert.equal(ctx.calls.length,1);assert.match(data.error,new RegExp(String(status)));
  }
});

test('CLIProxyAPI 禁用不查配额；FILTER序号可查询第7个账号；最多6个并发', async () => {
  const files=Array.from({length:8},(_,i)=>({auth_index:String(i+1),type:'codex',status:'ready',name:'account'+(i+1)}));
  const post={method:'POST',url:server+'/v0/management/api-call',data:{status_code:200,body:{rate_limit:{primary_window:{used_percent:10}}}}};
  let ctx=makeContext(envFor('CLIProxyAPI',{FILTER:'7'}),[route('/v0/management/auth-files',{files}),{...post,check:opts=>assert.equal(opts.body.auth_index,'7')}]);
  let data=await sync(ctx); assert.equal(ctx.calls.length,2);assert.equal(data.accounts[6].metrics[0].remaining,0.9);
  ctx=makeContext(envFor('CLIProxyAPI'),[route('/v0/management/auth-files',{files}),post]);data=await sync(ctx); assert.equal(ctx.calls.length,7);assert.equal(data.accounts[6].metrics[0].remaining,null);
  ctx=makeContext(envFor('CLIProxyAPI'),[route('/v0/management/auth-files',{files:[{...files[0],disabled:true}]})]);data=await sync(ctx);assert.equal(ctx.calls.length,1);assert.equal(data.accounts[0].status,'disabled');
});

test('AxonHub 登录、游标分页与accountKey聚合；仅使用usageRatio不把估算当余额', async () => {
  const store=new Map();
  const node=(id,window,ratio)=>({id,name:'channel-'+id,type:'openai',providerQuotaStatus:{providerType:'zenmux',status:'available',ready:true,accountKey:'shared-account',quotaData:{_limits:[{window,usageRatio:ratio,periodQuota:999999}]}}});
  const ctx=makeContext(envFor('AxonHub',{AUTH_MODE:'User',API_KEY:'',EMAIL:'user@unit.invalid',PASSWORD:'login-password'}),[
    {method:'POST',url:server+'/admin/auth/signin',data:{token:'jwt-in-memory'},check:o=>assert.deepEqual(plain(o.body),{email:'user@unit.invalid',password:'login-password'})},
    {method:'POST',url:server+'/admin/graphql',data:{data:{queryChannels:{edges:[{node:node('1','5h',0.25)}],pageInfo:{hasNextPage:false}}}},check:o=>{assert.equal(o.headers.Authorization,'Bearer jwt-in-memory');assert.equal(o.body.variables.input.first,100);assert.doesNotMatch(o.body.query,/mutation|credentials|apiKey/);}}
  ],store);
  // 响应随游标变化，真正走两页以验证分页请求。
  const dispatch=ctx.http.post;let pages=0;
  ctx.http.post=async(url,opts)=>{
    if(!url.endsWith('/graphql')) return dispatch(url,opts);
    ctx.calls.push({method:'POST',url,...opts});pages++;
    assert.equal(opts.headers.Authorization,'Bearer jwt-in-memory');
    assert.equal(opts.body.variables.input.first,100);
    assert.equal(opts.body.variables.input.after,pages===1?undefined:'cursor-1');
    return {status:200,json:async()=>({data:{queryChannels:{edges:[{node:node(String(pages),pages===1?'5h':'7d',pages===1?0.25:null)}],pageInfo:{hasNextPage:pages===1,endCursor:'cursor-'+pages}}}})};
  };
  const data=await sync(ctx);assert.equal(data.error,null);assert.equal(ctx.calls.length,3);assert.equal(data.accounts.length,1);
  assert.deepEqual(data.accounts[0].metrics.map(m=>m.remaining),[0.75,null]);
  assert.equal(data.accounts[0].metrics[0].total,undefined);assert.doesNotMatch(JSON.stringify([...store]),/jwt-in-memory|login-password|999999/);
});

test('AxonHub GraphQL errors、错误schema及重复游标不伪装成功', async () => {
  for(const response of [{errors:[{message:'permission denied'}]},{data:{}},{data:{queryChannels:{edges:[],pageInfo:{hasNextPage:true,endCursor:'same'}}}}]){
    const ctx=makeContext(envFor('AxonHub'),[{method:'POST',url:server+'/admin/graphql',data:response}]);
    const data=await sync(ctx);assert.ok(data.error);assert.equal(data.accounts.length,0);assert.ok(ctx.calls.length<=2);
  }
});

test('CLIProxyAPI 指标筛选先取配额再按返回指标过滤，不误报无匹配', async () => {
  const ctx=makeContext(envFor('CLIProxyAPI',{FILTER:'7D'}),[
    route('/v0/management/auth-files',{files:[{auth_index:'1',type:'codex',status:'ready'}]}),
    {method:'POST',url:server+'/v0/management/api-call',data:{status_code:200,body:{rate_limit:{primary_window:{used_percent:25,limit_window_seconds:604800},secondary_window:{used_percent:50,limit_window_seconds:18000}}}}}
  ]);
  const data=await sync(ctx);assert.equal(ctx.calls.length,2);assert.equal(api.filterAccounts(data.accounts,'7D')[0].metrics.length,1);
  assert.equal(api.filterAccounts(data.accounts,'7D')[0].metrics[0].remaining,0.75);
  const text=flattenText(await api.main(ctx));assert.match(text,/75%/);assert.doesNotMatch(text,/没有匹配|50%/);
});

function validateDSL(node) {
  assert.ok(node && ['widget','stack','text','date','image','spacer'].includes(node.type));
  if(node.text!==undefined) assert.equal(typeof node.text,'string');
  if(node.type==='date') assert.ok(Number.isFinite(Date.parse(node.date)));
  if(node.flex!==undefined) assert.ok(Number.isFinite(node.flex)&&node.flex>0);
  if(node.direction!==undefined) assert.ok(['row','column'].includes(node.direction));
  for(const child of node.children||[]) validateDSL(child);
}

test('全7尺寸真实指标/空数据/失败/缓存/打码状态返回合法原生DSL', () => {
  const families=['systemSmall','systemMedium','systemLarge','systemExtraLarge','accessoryCircular','accessoryRectangular','accessoryInline'];
  const metrics=[{label:'周配额',kind:'percent',remaining:0.25,resetAt:Date.now()+3600000},{label:'余额',kind:'balance',remaining:5,currency:'USD'},{label:'未知配额',kind:'percent',remaining:null}];
  const states=[{accounts:[]},{accounts:[],error:'HTTP 401'},{accounts:[{id:'x',email:'private@unit.invalid',name:'Private',status:'ready',metrics}],lastUpdated:Date.now()},{accounts:[{id:'x',email:'private@unit.invalid',status:'error',metrics,error:'private@unit.invalid 不可用'}],stale:true,lastUpdated:Date.now()-3600000,error:'HTTP 403'}];
  for(const family of families) for(const snapshot of states){
    const widget=api.renderUsageWidget({widgetFamily:family},snapshot,{title:'Test'},{baseUrl:server,maskAccount:true});
    validateDSL(widget); assert.equal(widget.type,'widget'); assert.doesNotMatch(JSON.stringify(widget),/private@unit.invalid|Private|NaN|undefined/);
    if(snapshot.stale) {assert.match(flattenText(widget),/缓存/);assert.match(JSON.stringify(widget),/"type":"date"/);}
  }
});

test('未知配额不出现100%，停用/过期账号不会显示绿色可用', () => {
  for(const status of ['unknown','disabled','error']){
    const snapshot={accounts:[{name:'fixture',status,metrics:[{label:'额度',kind:'percent',remaining:null}]}]};
    const widget=api.renderUsageWidget({},snapshot,{title:'Test'},{baseUrl:server});
    assert.doesNotMatch(flattenText(widget),/100%|可用|就绪/); assert.match(flattenText(widget),/—/);
  }
});
