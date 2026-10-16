import { shiftGameClock, tickGame, disposeGame } from './games.js';

export function pauseReason(room) {
  if (room.phase !== 'playing') return null;
  if (!room.host) return 'host';
  if (room.paused) return 'manual';
  if (!room.players.some(p => p.socket && room.game.ids.includes(p.id))) return 'players';
  return null;
}

export function advanceRoom(room, now) {
  const elapsed = Math.max(0, now - room.lastTick);
  room.lastTick = now;
  if (room.phase !== 'playing') return;
  if (pauseReason(room)) {
    shiftGameClock(room.game, elapsed);
    return;
  }
  tickGame(room.game, Math.min(elapsed / 1000, .06), now, room.players.filter(p => p.socket).map(p => p.id));
  if (now >= room.game.end || room.game.finished) { room.phase = 'results'; disposeGame(room.game); }
}
