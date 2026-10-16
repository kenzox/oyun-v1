// Render 100 ms behind the server so most frames interpolate two known snapshots.
export class SnapshotBuffer {
  constructor() { this.frames = []; }
  push(state, receivedAt) {
    const last = this.frames.at(-1);
    if (last && state.serverNow < last.state.serverNow) return;
    if (last && state.serverNow === last.state.serverNow) this.frames.pop();
    this.frames.push({ state, receivedAt }); this.frames = this.frames.slice(-8);
  }
  sample(now) {
    const latest = this.frames.at(-1); if (!latest) return null;
    if (latest.state.pauseReason) return { before: latest.state, after: latest.state, alpha: 1 };
    const target = latest.state.serverNow + Math.min(100, Math.max(0, now - latest.receivedAt)) - 100;
    for (let i = 1; i < this.frames.length; i++) {
      const a = this.frames[i - 1].state, b = this.frames[i].state;
      if (target <= b.serverNow) return { before: a, after: b, alpha: Math.max(0, Math.min(1, (target - a.serverNow) / Math.max(1, b.serverNow - a.serverNow))) };
    }
    return { before: latest.state, after: latest.state, alpha: 1 };
  }
}
