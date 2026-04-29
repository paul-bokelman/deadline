/**
 * Generates Blackjack pixel-art assets from the design's inline pixel grids.
 *
 * Outputs:
 *   src/assets/img/icons/blackjack/blackjack_{16,32}.png   (program icon)
 *   src/assets/img/blackjack/chip_{red,blue,gold}.png      (chip art, 32x32)
 *
 * Self-contained PNG encoder (no deps beyond Node's zlib).
 *
 * Run:  node scripts/generate-blackjack-assets.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── PNG encoder ───────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/**
 * Encode a width x height RGBA pixel buffer as a PNG.
 * `pixels` is a flat Uint8Array of length width*height*4 (RGBA, row-major).
 */
function encodePng(width, height, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Add a filter byte (0 = none) at the start of each scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.subarray(y * stride, y * stride + stride).copy
      ? pixels.subarray(y * stride, y * stride + stride).copy(raw, y * (stride + 1) + 1)
      : Buffer.from(pixels.subarray(y * stride, y * stride + stride)).copy(
          raw,
          y * (stride + 1) + 1
        );
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Pixel-grid helpers ────────────────────────────────────────────
const PALETTE = {
  '.': null,
  '#': [0, 0, 0, 255],
  w: [255, 255, 255, 255],
  s: [192, 192, 192, 255],
  S: [128, 128, 128, 255],
  k: [64, 64, 64, 255],
  y: [254, 242, 0, 255],
  Y: [192, 160, 0, 255],
  o: [212, 160, 80, 255],
  O: [160, 96, 48, 255],
  r: [170, 0, 0, 255],
  R: [255, 80, 80, 255],
  g: [10, 107, 44, 255],
  G: [14, 138, 58, 255],
  b: [0, 0, 128, 255],
  B: [16, 132, 208, 255],
  p: [232, 184, 154, 255],
  P: [184, 128, 96, 255],
  l: [7, 61, 24, 255],
  d: [58, 58, 58, 255],
};

function rowsToPixels(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const ch = rows[y][x];
      const c = PALETTE[ch];
      const o = (y * w + x) * 4;
      if (c) {
        pixels[o] = c[0];
        pixels[o + 1] = c[1];
        pixels[o + 2] = c[2];
        pixels[o + 3] = c[3];
      } else {
        pixels[o] = 0;
        pixels[o + 1] = 0;
        pixels[o + 2] = 0;
        pixels[o + 3] = 0;
      }
    }
  }
  return { width: w, height: h, pixels };
}

/** Nearest-neighbour upscale of an RGBA pixel buffer. */
function scalePixels(width, height, pixels, scale) {
  const w = width * scale;
  const h = height * scale;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const sy = Math.floor(y / scale);
    for (let x = 0; x < w; x += 1) {
      const sx = Math.floor(x / scale);
      const si = (sy * width + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = pixels[si];
      out[di + 1] = pixels[si + 1];
      out[di + 2] = pixels[si + 2];
      out[di + 3] = pixels[si + 3];
    }
  }
  return { width: w, height: h, pixels: out };
}

function writePng(relPath, width, height, pixels) {
  const abs = join(ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, encodePng(width, height, pixels));
  console.log(`wrote ${relPath}  (${width}x${height})`);
}

// ─── Program icon (16x16) ──────────────────────────────────────────
const ICON_PROGRAM = [
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kwwwwwwwwwwwwk.',
  '.kwSwwwwwwwwwwk.',
  '.kwwwwrwwrwwwwk.',
  '.kwwwrrrrrrrwwk.',
  '.kwwwrrrrrrrwwk.',
  '.kwwwwrrrrrwwwk.',
  '.kwwwwwrrrwwwwk.',
  '.kwwwwwwrwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwSwk.',
  '.kwwwwwwwwwwwwk.',
  '.kkkkkkkkkkkkkk.',
  '................',
];

const programIcon = rowsToPixels(ICON_PROGRAM);
writePng(
  'src/assets/img/icons/blackjack/blackjack_16.png',
  programIcon.width,
  programIcon.height,
  programIcon.pixels
);
const programIcon32 = scalePixels(
  programIcon.width,
  programIcon.height,
  programIcon.pixels,
  2
);
writePng(
  'src/assets/img/icons/blackjack/blackjack_32.png',
  programIcon32.width,
  programIcon32.height,
  programIcon32.pixels
);

// ─── Chip art (32x32) ──────────────────────────────────────────────
// Mirrors `makeChip()` + `stampDollar()` from the design.

function makeChipGrid(rim, face, faceLt) {
  const W = 32;
  const H = 32;
  const rows = [];
  for (let y = 0; y < H; y += 1) {
    const dy = y - 15.5;
    let row = '';
    for (let x = 0; x < W; x += 1) {
      const dx = x - 15.5;
      const r = Math.sqrt(dx * dx + dy * dy);
      let ch = '.';
      if (r > 15.5) ch = '.';
      else if (r > 13) ch = '#';
      else if (r > 11.5) {
        const seg = Math.floor(((Math.atan2(dy, dx) + Math.PI) * 8) / Math.PI);
        ch = seg % 2 === 0 ? rim : 'w';
      } else if (r > 10) ch = rim;
      else if (r > 8.5) ch = '#';
      else ch = r > 7 ? faceLt : face;
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

function stampDollar(grid, color = '#') {
  const out = grid.map((r) => [...r]);
  // vertical stem of $
  for (let y = 8; y <= 22; y += 1) out[y][15] = color;
  // S-shape pixels (matches the design's stampDollar curves)
  const sCurve = [
    [13, 10],
    [14, 9],
    [15, 9],
    [16, 9],
    [17, 10],
    [12, 11],
    [12, 12],
    [13, 13],
    [14, 13],
    [15, 13],
    [16, 13],
    [17, 13],
    [17, 14],
    [17, 15],
    [12, 17],
    [12, 18],
    [13, 19],
    [14, 19],
    [15, 19],
    [16, 19],
    [17, 19],
    [17, 18],
  ];
  for (const [x, y] of sCurve) {
    if (out[y] && out[y][x] !== undefined) out[y][x] = color;
  }
  return out.map((r) => r.join(''));
}

const CHIP_VARIANTS = [
  { name: 'red', rim: 'r', face: 'R', faceLt: 'w' },
  { name: 'blue', rim: 'b', face: 'B', faceLt: 'w' },
  { name: 'gold', rim: 'Y', face: 'y', faceLt: 'w' },
];

for (const v of CHIP_VARIANTS) {
  const grid = stampDollar(makeChipGrid(v.rim, v.face, v.faceLt));
  const { width, height, pixels } = rowsToPixels(grid);
  writePng(`src/assets/img/blackjack/chip_${v.name}.png`, width, height, pixels);
}

console.log('done.');
