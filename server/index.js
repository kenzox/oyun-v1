import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { GAMES, COLORS, createGame, tickGame, inputGame, publicGame, currentPlayer } from './games.js';

const token = () => randomBytes(24).toString('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function makeServer({ port = 3000 } = {}) {
  const app = express(); const http = createServer(app);
  const io = new Server(http, { maxHttpBufferSize: 16000 });
  const rooms = new Map();
  app.use(express.json({ limit: '8kb' }));
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
  const addresses = () => [...new Set(Object.values(networkInterfaces()).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => `http://${n.address}:${http.address()?.port || port}`))];
  app.get('/api/config', (_req, res) => res.json({ games: GAMES, addresses: addresses() }));
  app.post('/api/rooms', (_req, res) => {
    if (rooms.size >= 100) return res.status(429).json({ error: 'Çok fazla açık oda var. Biraz sonra tekrar deneyin.' });
    let code; do { code = Array.from(randomBytes(6), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 31]).join(''); } while (rooms.has(code));
    const room = { code, hostToken: token(), host: null, players: [], phase: 'lobby', selected: 'sling', game: null, touched: Date.now(), lastTick: Date.now() };
    rooms.set(code, room); res.json({ code, hostToken: room.hostToken });
  });
  app.get('/api/qr', async (req, res) => {
    const code = String(req.query.room || '').toUpperCase();
    const base = String(req.query.base || '');
    if (!rooms.has(code) || ![...addresses(), `http://localhost:${http.address()?.port || port}`, `http://127.0.0.1:${http.address()?.port || port}`].includes(base)) return res.status(400).send('Geçersiz oda veya adres');
    res.type('svg').send(await QRCode.toString(`${base}/?room=${code}`, { type: 'svg', margin: 1, color: { dark: '#20232A', light: '#FFFFFF' } }));
  });
  const state = room => ({ code: room.code, phase: room.phase, selected: room.selected, hostOnline: !!room.host, players: room.players.map(({ secret, socket, ...p }) => ({ ...p, connected: !!socket })), game: publicGame(room.game), serverNow: Date.now() });
  function broadcast(room) {
    io.to(room.code).emit('state', state(room));
    if (room.phase === 'playing' && room.game?.id === 'draw') {
      const p = room.players.find(p => p.id === currentPlayer(room.game));
      if (p?.socket) io.to(p.socket).emit('secret', { word: room.game.word, round: room.game.round });
    }
  }
  io.on('connection', socket => {
    socket.on('enter', (data = {}, ack = () => {}) => {
      if (typeof ack !== 'function') return;
      if (!data || typeof data !== 'object') return ack({ error: 'Geçersiz katılım isteği.' });
      if (socket.data.room) return ack({ error: 'Zaten bir odadasınız.' });
      const room = rooms.get(String(data.code || '').toUpperCase());
      if (!room) return ack({ error: 'Oda bulunamadı. TV’deki yeni QR kodu okutun.' });
      if (equal(data.hostToken, room.hostToken)) {
        if (room.host && room.host !== socket.id) io.sockets.sockets.get(room.host)?.disconnect(true);
        room.host = socket.id; socket.data.role = 'host';
      } else {
        let player = room.players.find(p => equal(p.secret, data.playerToken));
        if (player) { if (player.socket) io.sockets.sockets.get(player.socket)?.disconnect(true); player.socket = socket.id; }
        else {
          if (room.players.length >= 8) return ack({ error: 'Oda 8 kişiyle dolu. Bir telefonu paylaşarak takım olabilirsiniz.' });
          const name = String(data.name || '').trim().slice(0, 16);
          if (!name) return ack({ error: 'Önce bir oyuncu adı yazın.' });
          player = { id: randomUUID(), name, color: COLORS.find(c => !room.players.some(p => p.color === c)), avatar: Math.max(0, Math.min(7, Math.floor(Number(data.avatar) || 0))), secret: token(), socket: socket.id };
          room.players.push(player);
        }
        socket.data.role = 'player'; socket.data.player = player.id;
        ack({ id: player.id, playerToken: player.secret });
      }
      socket.data.room = room.code; socket.join(room.code); room.touched = Date.now();
      if (socket.data.role === 'host') ack({ host: true });
      broadcast(room);
    });
    socket.on('host', (data = {}, ack = () => {}) => {
      if (typeof ack !== 'function') return;
      if (!data || typeof data !== 'object') return ack({ error: 'Geçersiz oyun isteği.' });
      const r = rooms.get(socket.data.room);
      if (!r || r.host !== socket.id) return ack({ error: 'Bu işlem TV ekranından yapılabilir.' });
      if (data.type === 'select' && GAMES.some(g => g.id === data.id) && r.phase !== 'playing') r.selected = data.id;
      if (data.type === 'start') {
        const meta = GAMES.find(g => g.id === r.selected); const active = r.players.filter(p => p.socket);
        if (active.length < meta.min) return ack({ error: `Bu oyun için en az ${meta.min} bağlı oyuncu gerekiyor.` });
        r.game = createGame(r.selected, active); r.phase = 'playing'; r.lastTick = Date.now();
      }
      if (data.type === 'lobby') { r.phase = 'lobby'; r.game = null; }
      if (data.type === 'remove' && r.phase === 'lobby') {
        const p = r.players.find(p => p.id === data.id);
        if (p && !p.socket) r.players = r.players.filter(player => player.id !== p.id);
      }
      r.touched = Date.now(); broadcast(r); ack({ ok: true });
    });
    socket.on('input', data => {
      const r = rooms.get(socket.data.room); const now = Date.now();
      if (!r || r.phase !== 'playing' || !r.host || socket.data.role !== 'player') return;
      if (now - (socket.data.window || 0) > 1000) { socket.data.window = now; socket.data.count = 0; }
      if ((socket.data.count = (socket.data.count || 0) + 1) > 80) return;
      if (data?.type === 'guess') { if (now - (socket.data.guessAt || 0) < 700) return; socket.data.guessAt = now; }
      inputGame(r.game, socket.data.player, data, now);
    });
    socket.on('disconnect', () => {
      const r = rooms.get(socket.data.room); if (!r) return;
      if (r.host === socket.id) r.host = null;
      const p = r.players.find(p => p.socket === socket.id); if (p) p.socket = null;
      broadcast(r);
    });
  });
  let frame = 0;
  const timer = setInterval(() => {
    const now = Date.now(); frame++;
    for (const r of rooms.values()) {
      const elapsed = now - r.lastTick; r.lastTick = now;
      if (!r.host && r.players.every(p => !p.socket) && now - r.touched > 2 * 60 * 60 * 1000) { rooms.delete(r.code); continue; }
      if (r.phase !== 'playing') continue;
      if (!r.host) { r.game.end += elapsed; r.game.turnAt += elapsed; if (r.game.roundEnd) r.game.roundEnd += elapsed; }
      else {
        tickGame(r.game, Math.min(elapsed / 1000, .06), now, r.players.filter(p => p.socket).map(p => p.id));
        if (now >= r.game.end) r.phase = 'results';
      }
      if (frame % 2 === 0 || r.phase === 'results') broadcast(r);
    }
  }, 1000 / 30);
  const close = () => new Promise(resolve => { clearInterval(timer); io.close(() => { http.close(() => resolve()); }); });
  return { app, http, io, rooms, close };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000); const server = makeServer({ port });
  server.http.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} kullanımda. Farklı bir port için: PORT=3001 npm start` : `Sunucu başlatılamadı: ${error.message}`);
    process.exit(1);
  });
  server.http.listen(port, '0.0.0.0', () => {
    console.log(`\n  SALON · Ailece oyun zamanı\n  TV: http://localhost:${port}\n  Telefonlar aynı Wi-Fi ağına bağlı olmalı.\n`);
  });
  const stop = async () => { await server.close(); process.exit(0); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
