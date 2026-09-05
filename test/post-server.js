// 本地复现服务器：服务 bunny.ui 静态文件，同时让 POST /test/data/*.json 也返回文件内容
// 用于验证 hx-post 表格模式（http-server 对 POST 返回 405，无法直接测）：
//   表格 hx-post="/test/data/table-static.json" → 本服务器对任意方法的该路径都返回 JSON 文件
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// 端口可用命令行参数指定：node test/post-server.js [port]（默认 8898）
const PORT = parseInt(process.argv[2] || '8898', 10);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

http.createServer(function (req, res) {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // 允许 POST/GET/PUT/DELETE 都被当成静态文件请求（重点：POST JSON）
    let filePath = path.join(ROOT, urlPath.replace(/^\/+/, ''));
    fs.readFile(filePath, function (err, buf) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: ' + urlPath);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream'
        });
        res.end(buf);
    });
}).listen(PORT, function () {
    console.log('post-server running at http://127.0.0.1:' + PORT + '/ (POST supported)');
});