import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 80);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

async function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const body = await readFile(filePath);

  response.writeHead(200, { 'Content-Type': contentType });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.join(distDir, pathname);

    if (!filePath.startsWith(distDir)) {
      sendNotFound(response);
      return;
    }

    try {
      await sendFile(response, filePath);
    } catch {
      await sendFile(response, path.join(distDir, 'index.html'));
    }
  } catch {
    sendNotFound(response);
  }
});

server.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});
