import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Raw image scanlines: filter byte 0 followed by 4 bytes per pixel (RGBA)
  const rowBytes = 1 + width * 4;
  const raw = Buffer.alloc(rowBytes * height);

  const radius = size * 0.22; // Squircle corner radius

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Check if inside squircle
      let insideSquircle = true;
      if (x < radius && y < radius) {
        insideSquircle = Math.hypot(x - radius, y - radius) <= radius;
      } else if (x > width - radius && y < radius) {
        insideSquircle = Math.hypot(x - (width - radius), y - radius) <= radius;
      } else if (x < radius && y > height - radius) {
        insideSquircle = Math.hypot(x - radius, y - (height - radius)) <= radius;
      } else if (x > width - radius && y > height - radius) {
        insideSquircle = Math.hypot(x - (width - radius), y - (height - radius)) <= radius;
      }

      if (!insideSquircle) {
        raw[pxOffset] = 0;
        raw[pxOffset + 1] = 0;
        raw[pxOffset + 2] = 0;
        raw[pxOffset + 3] = 0;
        continue;
      }

      // Inside squircle: Background is dark metallic gradient with subtle cyan ambient glow
      const ny = y / height;
      const nx = x / width;
      let r = Math.round(15 + 15 * ny);
      let g = Math.round(23 + 12 * (1 - ny));
      let b = Math.round(42 + 25 * ny);
      let a = 255;

      // Subtle top/left specular border highlight
      const isTopBorder = y <= 1 || (x <= 1 && y < height * 0.5);
      if (isTopBorder) {
        r = Math.min(255, r + 70);
        g = Math.min(255, g + 80);
        b = Math.min(255, b + 100);
      }

      // Draw bookmark ribbon icon in center
      const bmLeft = width * 0.30;
      const bmRight = width * 0.70;
      const bmTop = height * 0.22;
      const bmBottom = height * 0.78;
      const bmCutHeight = height * 0.15;
      const midX = width * 0.5;

      const inBookmarkX = x >= bmLeft && x <= bmRight;
      const inBookmarkY = y >= bmTop && y <= bmBottom;

      // Ribbon notch at bottom
      const inCut = y >= (bmBottom - bmCutHeight) &&
        Math.abs(x - midX) < (y - (bmBottom - bmCutHeight)) * ((bmRight - bmLeft) / (2 * bmCutHeight));

      if (inBookmarkX && inBookmarkY && !inCut) {
        // Vibrant modern electric cyan to purple gradient
        const bt = (x - bmLeft + (y - bmTop) * 1.2) / ((bmRight - bmLeft) * 2.2);
        const clampedT = Math.max(0, Math.min(1, bt));

        // Start: #38bdf8 (56, 189, 248), Mid: #6366f1 (99, 102, 241), End: #a855f7 (168, 85, 247)
        if (clampedT < 0.5) {
          const st = clampedT * 2;
          r = Math.round(56 * (1 - st) + 99 * st);
          g = Math.round(189 * (1 - st) + 102 * st);
          b = Math.round(248 * (1 - st) + 241 * st);
        } else {
          const st = (clampedT - 0.5) * 2;
          r = Math.round(99 * (1 - st) + 168 * st);
          g = Math.round(102 * (1 - st) + 85 * st);
          b = Math.round(241 * (1 - st) + 247 * st);
        }

        // Bookmark inner shadow / specular edge
        if (y === Math.round(bmTop) || x === Math.round(bmLeft)) {
          r = Math.min(255, r + 50);
          g = Math.min(255, g + 50);
          b = Math.min(255, b + 50);
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  // PNG Header
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatData = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 32, 48, 128].forEach((size) => {
  const png = generatePng(size);
  const filePath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated ${filePath}`);
});
