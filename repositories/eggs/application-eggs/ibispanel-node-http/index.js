'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const port = Number(process.env.SERVER_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('SERVER_PORT must be an integer between 1 and 65535');
  process.exit(1);
}

const messageFile = path.join(__dirname, 'message.txt');
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' || request.url !== '/') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found\n');
    return;
  }

  const message = fs.readFileSync(messageFile, 'utf8').trim();
  console.log(`GET / from ${request.socket.remoteAddress}`);
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(`${message}\n`);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`IbisPanel development HTTP ready on 0.0.0.0:${port}`);
});

function shutdown(signal) {
  console.log(`IbisPanel development HTTP stopping on ${signal}`);
  server.close(() => {
    console.log('IbisPanel development HTTP stopped');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
