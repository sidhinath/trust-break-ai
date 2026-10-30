import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import analyzeHandler from './api/analyze.js'
import healthHandler from './api/health.js'
import analyzeVoiceHandler from './api/analyze-voice.js'
import blocklistLiteHandler from './api/blocklist-lite.js'
import tinyfishHandler from './api/tinyfish/investigate.js'


function createMockRequest(req, body) {
  return {
    method: req.method,
    headers: req.headers,
    body,
    query: {},
    url: req.url,
  }
}

function createMockResponse(res) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value
      res.setHeader(key, value)
    },
    status(code) {
      this.statusCode = code
      res.statusCode = code
      return this
    },
    json(payload) {
      if (!res.writableEnded) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
      }
      return this
    },
    send(payload) {
      if (!res.writableEnded) {
        if (typeof payload === 'object' && payload !== null) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        } else {
          res.setHeader('Content-Type', 'text/plain')
          res.end(String(payload))
        }
      }
      return this
    },
    end(payload) {
      if (!res.writableEnded) {
        res.end(payload)
      }
      return this
    },
  }
}

async function readJsonBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) return {}

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

function localApiPlugin() {
  return {
    name: 'ghostnet-local-api',
    configureServer(server) {
      server.middlewares.use('/api/health', async (req, res) => {
        const mockRes = createMockResponse(res)
        await healthHandler(createMockRequest(req, {}), mockRes)
      })

      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const body = req.method === 'POST' ? await readJsonBody(req) : {}
        const mockReq = createMockRequest(req, body)
        const mockRes = createMockResponse(res)

        await analyzeHandler(mockReq, mockRes)
      })

      server.middlewares.use('/api/analyze-voice', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const body = req.method === 'POST' ? await readJsonBody(req) : {}
        const mockReq = createMockRequest(req, body)
        const mockRes = createMockResponse(res)

        await analyzeVoiceHandler(mockReq, mockRes)
      })

      server.middlewares.use('/api/blocklist-lite', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const mockReq = createMockRequest(req, {})
        const mockRes = createMockResponse(res)

        await blocklistLiteHandler(mockReq, mockRes)
      })

      server.middlewares.use('/api/tinyfish/investigate', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const body = req.method === 'POST' ? await readJsonBody(req) : {}
        const mockReq = createMockRequest(req, body)
        const mockRes = createMockResponse(res)

        await tinyfishHandler(mockReq, mockRes)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    base: './',
    logLevel: 'info',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@designcodeio/threeui/style.css': path.resolve(__dirname, './src/shaders/threeui.css'),
        '@designcodeio/threeui': path.resolve(__dirname, './src/shaders/index.ts'),
      },
    },
    plugins: [react(), localApiPlugin()],
    esbuild: {
      target: 'es2018',
    },
    build: {
      target: ['chrome75', 'es2018'],
      cssTarget: ['chrome75'],
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) return 'three'
              if (id.includes('framer-motion')) return 'motion'
              if (id.includes('lucide-react')) return 'icons'
              if (id.includes('@radix-ui')) return 'radix'
              if (id.includes('recharts') || id.includes('d3-')) return 'charts'
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'
              if (id.includes('@supabase') || id.includes('@tanstack')) return 'data'
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
