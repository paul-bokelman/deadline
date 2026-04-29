import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
};

const encodePng = (width, height, pixels) => {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.subarray(y * stride, y * stride + stride)).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

const COLORS = {
  yellow: [240, 196, 41, 255],
  black: [0, 0, 0, 255],
  transparent: [0, 0, 0, 0],
};

// Build a 5-point star polygon centered in [0, size] box.
// `padding` is space between square edge and star bbox.
const buildStarPolygon = (size, padding) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - padding;
  const innerR = outerR * 0.42;
  const points = [];
  // Start at top point: angle = -PI/2
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return points;
};

const pointInPolygon = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i];
    const b = poly[j];
    const intersect =
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
};

const setPx = (pixels, w, x, y, c) => {
  const i = (y * w + x) * 4;
  pixels[i] = c[0];
  pixels[i + 1] = c[1];
  pixels[i + 2] = c[2];
  pixels[i + 3] = c[3];
};

// Render star icon: yellow square background, black 5-point star foreground.
// `padding` is pixels of yellow visible around the star.
const renderStarIcon = (size, padding) => {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      setPx(pixels, size, x, y, COLORS.yellow);
    }
  }
  const poly = buildStarPolygon(size, padding);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Sample at pixel center for crisper edges at small sizes.
      if (pointInPolygon(x + 0.5, y + 0.5, poly)) {
        setPx(pixels, size, x, y, COLORS.black);
      }
    }
  }
  return { w: size, h: size, pixels };
};

const write = (path, img) => {
  const abs = join(ROOT, path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, encodePng(img.w, img.h, img.pixels));
  console.log(`wrote ${path}`);
};

// App icons: tight black 5-point star on yellow square, no padding around the
// square — matches the reference image (color fills the full tile).
write('src/assets/img/icons/leaderboard/leaderboard_8.png', renderStarIcon(8, 1));
write('src/assets/img/icons/leaderboard/leaderboard_16.png', renderStarIcon(16, 2));
write('src/assets/img/icons/leaderboard/leaderboard_24.png', renderStarIcon(24, 3));
write('src/assets/img/icons/leaderboard/leaderboard_32.png', renderStarIcon(32, 3));

// Hero badge used on the leaderboard "GAME OVER" header (rendered larger via
// image-rendering: pixelated). 64px source keeps the star crisp when scaled.
write('src/assets/img/leaderboard/star_badge_32.png', renderStarIcon(64, 6));
