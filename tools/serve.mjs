// Winziger statischer Server für den Film – ohne Abhängigkeiten, damit der
// Ordner auf jedem Rechner mit Node läuft (Doppelklick auf start.cmd).
//
//   node tools/serve.mjs [port]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, url === '/' ? 'index.html' : url);
  // Kein Ausbruch aus dem Filmordner
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('nicht gefunden');
  }
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';

  // Videos brauchen Bereichsanfragen, sonst springt der Browser nicht im Clip
  const range = req.headers.range;
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = s ? Number(s) : 0;
    const end = e ? Number(e) : size - 1;
    res.writeHead(206, {
      'content-type': type, 'content-length': end - start + 1,
      'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes',
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => {
  const url = `http://localhost:${port}/`;
  console.log(`Ceyx & Alcyone läuft auf ${url}\nZum Beenden dieses Fenster schließen.`);
  spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
});
