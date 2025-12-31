let body = $response.body;

//环境伪装成 Surge 拿到正确的模块配置内容
body = body.replace(/Lock\s*=\s*\d/g, 'Lock=2');

// 将 Surge 的 "surge:///install-module" 替换为 Egern 的 "egern:///modules/new"

body = body.replace(/surge:\/\/\/install-module/g, 'egern:///modules/new');

body = body.replace(/surge:\/\/install-module/g, 'egern:///modules/new');

body = body.replace(/<\/i>\s*QuantumultX/g, '</i> Egern');

$done({ body });
