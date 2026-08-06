// ~基本方式 只有一種環境變數
// import 'dotenv/config' // 確保第一行加載環境變數
// ~進階方式 根據不同環境NODE_ENV,加載不同的 .env 檔案
import '../src/config/env/env.js' // 確保第一行加載環境變數
import app from '../src/app.js'
import http from 'http'
import { connectDB } from '../src/config/connection.js'
import { getConfig } from '../src/config/env/index.js'
import { wss1, wss2 } from '../src/routes/ws.js'
import { initDatabases } from '../src/config/databases.js'
// seeds資料
import { seedMockData } from '../src/seeds/index.js'

// 整個系統只有一個 server 實例
const server = http.createServer(app)
const PORT = getConfig('server.port') || 3000
const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

function initWebSocket(server) {
  server.on('upgrade', function upgrade(request, socket, head) {
    const { pathname } = parse(request.url)

    switch (pathname) {
      case '/ws':
        wss1.handleUpgrade(request, socket, head, function done(ws) {
          wss1.emit('connection', ws, request)
        })
        break
      case '/ws2':
        wss2.handleUpgrade(request, socket, head, function done(ws) {
          wss2.emit('connection', ws, request)
        })
        break
      default:
        socket.destroy()
        break
    }
  })
}
async function initSeedsData() {
  if (!isDev && !isProd && !isTest) return

  // 依環境注入不同的 Seed 資料
  if (isProd) {
    // await seedProdData()
  }
  if (isDev) {
    await seedMockData()
  }
  if (isTest) {
    // await seedTestData()
  }
}
async function startServer() {
  let isDbConnected = false
  try {
    await connectDB()
    console.log('🚀 Starting server...')
    isDbConnected = true
  }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`❌ 資料庫初始化連線失敗: ${msg}`)
    console.warn('⚠️ 伺服器將以「降級模式」啟動 (無資料庫連線)。')
  }

  // 連線成功後，建立種子資料
  if (isDbConnected) {
    try {
      // await initDatabases()
      await initSeedsData()
    }
    catch (err) {
      console.error('⚠️ [DB-Seed] 假資料寫入失敗，但伺服器仍繼續啟動:', err)
    }
  }

  // ~創建 WebSocket 伺服器(務必在 server.listen 前)
  initWebSocket(server)

  // ~啟動 HTTP 伺服器
  server.listen(PORT, () => {
    console.log('=================================')
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log('=================================')
  })
}

startServer()
