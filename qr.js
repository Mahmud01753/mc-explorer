// ছোট QR কোড জেনারেটর (Byte mode, সংশোধন স্তর M, ভার্সন ১–৬)। window.makeQR(text) → { size, dark(x,y) } বা null
window.makeQR = function (text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const EPB = [10, 16, 26, 18, 24, 16], NB = [1, 1, 1, 2, 2, 4];
  const raw = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; } return r >> 3; };
  let ver = 0;
  for (let v = 1; v <= 6; v++) if ((raw(v) - EPB[v - 1] * NB[v - 1]) * 8 >= 12 + bytes.length * 8) { ver = v; break; }
  if (!ver) return null;
  const size = ver * 4 + 17, nb = NB[ver - 1], el = EPB[ver - 1], rc = raw(ver);
  // data bits
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  const cap = (rc - el * nb) * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let p = 0xEC; data.length < rc - el * nb; p ^= 0xEC ^ 0x11) data.push(p);
  // Reed-Solomon
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
  const div = new Array(el).fill(0); div[el - 1] = 1; let root = 1;
  for (let i = 0; i < el; i++) { for (let j = 0; j < el; j++) { div[j] = mul(div[j], root); if (j + 1 < el) div[j] ^= div[j + 1]; } root = mul(root, 2); }
  const rem = (d) => { const r = new Array(el).fill(0); d.forEach((b) => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }); return r; };
  const ns = nb - (rc % nb), sl = Math.floor(rc / nb), blocks = []; let k = 0;
  for (let i = 0; i < nb; i++) { const d = data.slice(k, k + sl - el + (i < ns ? 0 : 1)); k += d.length; const e = rem(d); if (i < ns) d.push(0); blocks.push(d.concat(e)); }
  const out = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== sl - el || j >= ns) out.push(b[i]); });
  // matrix
  const M = Array.from({ length: size }, () => new Array(size).fill(0)), F = Array.from({ length: size }, () => new Array(size).fill(false));
  const sf = (x, y, v) => { if (x >= 0 && y >= 0 && x < size && y < size) { M[y][x] = v ? 1 : 0; F[y][x] = true; } };
  for (let i = 0; i < size; i++) { sf(6, i, i % 2 === 0); sf(i, 6, i % 2 === 0); }
  [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); sf(cx + dx, cy + dy, d !== 2 && d !== 4); } });
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, pos = [6]; for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    pos.forEach((cy, i) => pos.forEach((cx, j) => { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sf(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); })); }
  const fmt = (mask) => { const d = (0 << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const b = ((d << 10) | r) ^ 0x5412, g = (i) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) sf(8, i, g(i)); sf(8, 7, g(6)); sf(8, 8, g(7)); sf(7, 8, g(8)); for (let i = 9; i < 15; i++) sf(14 - i, 8, g(i));
    for (let i = 0; i < 8; i++) sf(size - 1 - i, 8, g(i)); for (let i = 8; i < 15; i++) sf(8, size - 15 + i, g(i)); sf(8, size - 8, true); };
  fmt(0);
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
      if (!F[y][x] && bi < out.length * 8) { M[y][x] = (out[bi >>> 3] >>> (7 - (bi & 7))) & 1; bi++; } } }
  const MK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0, (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const apply = (m) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && MK[m](x, y)) M[y][x] ^= 1; };
  const pen = () => { let p = 0;
    for (let a = 0; a < size; a++) for (const row of [true, false]) { let run = 1; for (let b = 1; b < size; b++) { const c = row ? M[a][b] === M[a][b - 1] : M[b][a] === M[b - 1][a]; if (c) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3; return p; };
  let best = 0, bp = 1e9; for (let m = 0; m < 8; m++) { apply(m); fmt(m); const p = pen(); if (p < bp) { bp = p; best = m; } apply(m); }
  apply(best); fmt(best);
  return { size, dark: (x, y) => M[y][x] === 1 };
};
