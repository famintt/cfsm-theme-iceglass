import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A local-only demo server, not a backend proxy. No credentials or live metrics.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = new Map([
  ['/', ['demo/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['demo/index.html', 'text/html; charset=utf-8']],
  ['/demo/', ['demo/index.html', 'text/html; charset=utf-8']],
  ['/demo/index.html', ['demo/index.html', 'text/html; charset=utf-8']]
]);
const port = Number(process.env.PORT || 4178);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT 必须是 1 至 65535 的整数。');
  process.exit(1);
}
const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const asset = files.get(url.pathname);
    if (!asset) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('本地服务仅提供演示页面，不提供后台或监控 API。');
      return;
    }
    const content = await fs.readFile(path.join(root, asset[0]));
    response.writeHead(200, {
      'Content-Type': asset[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('演示页面加载失败，请确认 demo/index.html 完整存在。');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `端口 ${port} 已被占用；可用 PORT 环境变量指定其他本机端口。`
    : '预览服务器启动失败。');
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Iceglass 演示：http://127.0.0.1:${port}/`);
  console.log('仅限本机访问；演示数据，不连接真实后端。按 Ctrl+C 停止。');
});
