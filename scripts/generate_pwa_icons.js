import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

function generatePwaPng(size, filename) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type RGBA (6)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Pixel data: RGBA
  const rawRows = [];
  const bgR = 8, bgG = 126, bgB = 121; // #087E79
  const fgR = 255, fgG = 255, fgB = 255; // White logo

  const center = size / 2;
  const radius = size * 0.38;

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte = 0 (None)
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;

      // Icon shape: Stylish rounded square background with white inner diamond icon
      const isInnerShape = Math.abs(dx) + Math.abs(dy) < radius * 0.65;

      let r = bgR, g = bgG, b = bgB, a = 255;
      if (isInnerShape) {
        r = fgR; g = fgG; b = fgB;
      }

      row.push(r, g, b, a);
    }
    rawRows.push(Buffer.from(row));
  }

  const uncompressedData = Buffer.concat(rawRows);
  const compressedData = zlib.deflateSync(uncompressedData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
  const destPath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(destPath, pngBuffer);
  console.log(`Generated ${filename} (${size}x${size}) at ${destPath}`);
}

generatePwaPng(192, 'pwa-192.png');
generatePwaPng(512, 'pwa-512.png');
generatePwaPng(180, 'apple-touch-icon.png');
