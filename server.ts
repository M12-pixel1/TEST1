import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = parseInt(process.env.PORT || '3100', 10);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const browserDir = join(__dirname, 'app', 'browser');

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ts': 'application/javascript'
};

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url!;
  const filePath = join(browserDir, url);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime });
  res.end(content);
});

server.listen(PORT, () => {
  console.log('Augimo Programa V1 running on port ' + PORT);
});

