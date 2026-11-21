import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const DIRS: [number, number, string, string][] = [[0, -1, 'u', 'U'], [0, 1, 'd', 'D'], [-1, 0, 'l', 'L'], [1, 0, 'r', 'R']];
const MAX = 250000;
type Lvl = { w: number; h: number; wall: Uint8Array; goals: number[]; boxes: number[]; player: number };
function parse(t: string): Lvl {
  const rows = t.split('\n').filter((r) => r.length > 0);
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const wall = new Uint8Array(w * h).fill(1);
  const goals: number[] = [], boxes: number[] = [];
  let player = -1;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x], i = y * w + x;
      if (c === '#') continue;
      wall[i] = 0;
      if (c === '.' || c === '*' || c === '+') goals.push(i);
      if (c === '$' || c === '*') boxes.push(i);
      if (c === '@' || c === '+') player = i;
    }
  });
  return { w, h, wall, goals, boxes: boxes.sort((a, b) => a - b), player };
}
function live(L: Lvl): Uint8Array {
  const { w, wall, goals } = L, lv = new Uint8Array(wall.length), q = [...goals];
  for (const g of goals) lv[g] = 1;
  for (let i = 0; i < q.length; i++) {
    const x = q[i];
    for (const [dx, dy] of DIRS) {
      const d = dy * w + dx, y = x - d;
      if (!wall[y] && !wall[y - d] && !lv[y]) { lv[y] = 1; q.push(y); }
    }
  }
  return lv;
}
function reach(L: Lvl, occ: Uint8Array, from: number, seen: Int32Array, stamp: number, st: Int32Array): number {
  const { w, wall } = L;
  let low = from, n = 0;
  st[n++] = from; seen[from] = stamp;
  while (n > 0) {
    const p = st[--n];
    if (p < low) low = p;
    for (const d of [-w, w, -1, 1]) {
      const q = p + d;
      if (!wall[q] && !occ[q] && seen[q] !== stamp) { seen[q] = stamp; st[n++] = q; }
    }
  }
  return low;
}
function frozen(L: Lvl, occ: Uint8Array, goal: Uint8Array, t: number): boolean {
  const { w, wall } = L;
  for (const a of [t, t - 1, t - w, t - w - 1]) {
    const b = a + 1, c = a + w, d = c + 1;
    if (!(wall[a] || occ[a]) || !(wall[b] || occ[b]) || !(wall[c] || occ[c]) || !(wall[d] || occ[d])) continue;
    if ((occ[a] && !goal[a]) || (occ[b] && !goal[b]) || (occ[c] && !goal[c]) || (occ[d] && !goal[d])) return true;
  }
  return false;
}
function walk(L: Lvl, occ: Uint8Array, from: number, to: number): string {
  if (from === to) return '';
  const { w, wall } = L;
  const prev = new Int32Array(wall.length).fill(-1);
  const how: string[] = new Array(wall.length);
  const q = [from];
  prev[from] = from;
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    if (p === to) break;
    for (const [dx, dy, ch] of DIRS) {
      const n = p + dy * w + dx;
      if (wall[n] || occ[n] || prev[n] !== -1) continue;
      prev[n] = p; how[n] = ch; q.push(n);
    }
  }
  if (prev[to] === -1) return '';
  let s = '';
  for (let p = to; p !== from; p = prev[p]) s = how[p] + s;
  return s;
}
function solvePush(L: Lvl, max: number): { pushes: number; moves: string } | null {
  const { w, wall, goals } = L, size = wall.length;
  const goal = new Uint8Array(size);
  for (const g of goals) goal[g] = 1;
  const lv = live(L);
  if (L.boxes.some((b) => !lv[b])) return null;
  const occ = new Uint8Array(size);
  const seen = new Int32Array(size), mark = new Int32Array(size), st = new Int32Array(size);
  let stamp = 0;
  const solved = (bs: number[]): boolean => bs.every((b) => goal[b]);
  const key = (bs: number[], low: number): number | string => {
    if (bs.length > 5) return bs.join(',') + ':' + low;
    let k = low;
    for (const b of bs) k = k * size + b;
    return k;
  };
  const SB: number[][] = [L.boxes.slice()], SP: number[] = [L.player], pa: number[] = [-1];
  const ix = new Map();
  for (const b of L.boxes) occ[b] = 1;
  ix.set(key(SB[0], reach(L, occ, L.player, seen, ++stamp, st)), 0);
  for (const b of L.boxes) occ[b] = 0;
  let found = solved(L.boxes) ? 0 : -1;
  for (let head = 0; found < 0 && head < SB.length; head++) {
    const boxes = SB[head];
    for (const b of boxes) occ[b] = 1;
    reach(L, occ, SP[head], seen, ++stamp, st);
    const here = stamp;
    for (let bi = 0; bi < boxes.length && found < 0; bi++) {
      const b = boxes[bi];
      for (let k = 0; k < 4; k++) {
        const dx = DIRS[k][0], dy = DIRS[k][1], d = dy * w + dx, t = b + d;
        if (seen[b - d] !== here || wall[t] || occ[t] || !lv[t]) continue;
        occ[b] = 0; occ[t] = 1;
        const fr = frozen(L, occ, goal, t);
        let kk: number | string = -1, nx: number[] | null = null;
        if (!fr) {
          nx = boxes.slice(); nx[bi] = t; nx.sort((a, b) => a - b);
          kk = key(nx, reach(L, occ, b, mark, ++stamp, st));
        }
        occ[t] = 0; occ[b] = 1;
        if (fr || ix.has(kk)) continue;
        if (SB.length >= max) { for (const x of boxes) occ[x] = 0; return null; }
        ix.set(kk, SB.length); SB.push(nx as number[]); SP.push(b); pa.push(head);
        if (solved(nx as number[])) { found = SB.length - 1; break; }
      }
    }
    for (const x of boxes) occ[x] = 0;
  }
  if (found < 0) return null;
  const path: number[] = [];
  for (let s = found; s > 0; s = pa[s]) path.push(s);
  path.reverse();
  let moves = '', player = L.player, boxes: number[] = L.boxes;
  for (const s of path) {
    const nb = SB[s];
    const from = boxes.find((b) => !nb.includes(b)) as number;
    const to = nb.find((b) => !boxes.includes(b)) as number;
    const d = to - from;
    const dir = DIRS.find(([dx, dy]) => dy * w + dx === d) as [number, number, string, string];
    for (const b of boxes) occ[b] = 1;
    moves += walk(L, occ, player, from - d);
    for (const b of boxes) occ[b] = 0;
    moves += dir[3]; player = from; boxes = nb;
  }
  return { pushes: path.length, moves };
}
function roomsOf(L: Lvl): { squares: number[]; boxes: number[]; goals: number[]; done?: boolean }[] | null {
  const { w, wall, goals, boxes, player } = L;
  const lv = live(L);
  const row = Math.floor(player / w);
  const cut = new Uint8Array(wall.length);
  for (let i = row * w; i < (row + 1) * w; i++) if (!wall[i] && !lv[i]) cut[i] = 1;
  if (boxes.some((b) => cut[b])) return null;
  const part = new Int32Array(wall.length).fill(-1);
  const rooms: { squares: number[]; boxes: number[]; goals: number[]; done?: boolean }[] = [];
  for (let s = 0; s < wall.length; s++) {
    if (wall[s] || cut[s] || part[s] >= 0) continue;
    const squares = [s];
    part[s] = rooms.length;
    for (let i = 0; i < squares.length; i++) {
      for (const [dx, dy] of DIRS) {
        const q = squares[i] + dy * w + dx;
        if (!wall[q] && !cut[q] && part[q] < 0) { part[q] = rooms.length; squares.push(q); }
      }
    }
    rooms.push({ squares, boxes: [], goals: [] });
  }
  if (boxes.some((b) => part[b] < 0)) return null;
  for (const b of boxes) rooms[part[b]].boxes.push(b);
  for (const g of goals) if (part[g] >= 0) rooms[part[g]].goals.push(g);
  if (goals.some((g) => part[g] < 0) || rooms.some((r) => r.boxes.length !== r.goals.length)) return null;
  return rooms.filter((r) => r.boxes.length > 0);
}
function endOf(w: number, from: number, moves: string): number {
  let p = from;
  for (const c of moves.toLowerCase()) p += c === 'u' ? -w : c === 'd' ? w : c === 'l' ? -1 : 1;
  return p;
}
function solveRooms(L: Lvl): string | null {
  const rooms = roomsOf(L);
  if (rooms === null) {
    const s = solvePush(L, MAX);
    return s === null ? null : s.moves;
  }
  let player = L.player, moves = '';
  for (const room of rooms) {
    const wall = L.wall.slice();
    for (const o of rooms) if (o !== room) for (const b of (o.done ? o.goals : o.boxes)) wall[b] = 1;
    const sub: Lvl = { w: L.w, h: L.h, wall, goals: room.goals.slice().sort((a, b) => a - b), boxes: room.boxes.slice().sort((a, b) => a - b), player };
    const s = solvePush(sub, MAX);
    if (s === null) return null;
    moves += s.moves; player = endOf(L.w, player, s.moves); room.done = true;
  }
  return moves;
}
function solve(text: string): string {
  const L = parse(text);
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (x === 0 || y === 0 || x === L.w - 1 || y === L.h - 1) L.wall[y * L.w + x] = 1;
  const m = solveRooms(L);
  return m === null ? '' : m;
}
for (const id of readdirSync(I).sort()) {
  const moves = solve(readFileSync(join(I, id, 'level.txt'), 'utf8'));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'solution.txt'), moves + '\n');
}
