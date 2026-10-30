import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[n] = c
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(12 + len)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4, 4, 'ascii')
  data.copy(buf, 8)
  const crc = crc32(buf.subarray(4, 8 + len))
  buf.writeUInt32BE(crc, 8 + len)
  return buf
}

function createPNG(size) {
  const width = size
  const height = size
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdrChunk = makeChunk('IHDR', ihdrData)

  const rawScanlineLen = 1 + width * 4
  const rawBuf = Buffer.alloc(height * rawScanlineLen)

  const center = size / 2
  const radius = size * 0.44

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawScanlineLen
    rawBuf[rowOffset] = 0 // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4
      const dx = x - center + 0.5
      const dy = y - center + 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= radius) {
        // Inside rounded badge
        const innerDist = Math.sqrt(dx * dx + (dy + size * 0.05) * (dy + size * 0.05))
        if (innerDist < size * 0.18) {
          // Neon cyan core: #00D4FF
          rawBuf[pxOffset] = 0
          rawBuf[pxOffset + 1] = 212
          rawBuf[pxOffset + 2] = 255
          rawBuf[pxOffset + 3] = 255
        } else if (dist > radius - size * 0.08) {
          // Outer cyan ring
          rawBuf[pxOffset] = 0
          rawBuf[pxOffset + 1] = 212
          rawBuf[pxOffset + 2] = 255
          rawBuf[pxOffset + 3] = 240
        } else {
          // Deep navy background: #0D1324
          rawBuf[pxOffset] = 13
          rawBuf[pxOffset + 1] = 19
          rawBuf[pxOffset + 2] = 36
          rawBuf[pxOffset + 3] = 255
        }
      } else {
        // Transparent outside
        rawBuf[pxOffset] = 0
        rawBuf[pxOffset + 1] = 0
        rawBuf[pxOffset + 2] = 0
        rawBuf[pxOffset + 3] = 0
      }
    }
  }

  const idatData = zlib.deflateSync(rawBuf)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const outDir = path.resolve('extension/icons')
fs.mkdirSync(outDir, { recursive: true })

for (const size of [16, 48, 128]) {
  const png = createPNG(size)
  const filePath = path.join(outDir, `icon${size}.png`)
  fs.writeFileSync(filePath, png)
  console.log(`Generated ${filePath} (${png.length} bytes)`)
}
