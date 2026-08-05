// ~基本方式 只有一種環境變數
// import 'dotenv/config' // 確保第一行加載環境變數
// ~進階方式 根據不同環境NODE_ENV,加載不同的 .env 檔案
import '../src/config/env/env.js' // 確保第一行加載環境變數
import app  from '../src/app.js'
import http from 'http'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/connection.js'
import { getConfig } from '../src/config/env/index.js'
import { initDatabases, envDbMap } from '../src/config/databases.js'
// seeds資料
import { seedMockData } from '../src/seeds/index.js'

const server = http.createServer(app)
const PORT = getConfig('server.port') || 3000
const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

async function initSeedsData() {
  // 依環境注入不同的 Seed 資料
  if (isDev) {
    await seedMockData()
  }
  if (isProd) {
    // await seedProdData()
  }
}
async function startServer() {
  let isDbConnected = false
  const mainConfig = envDbMap[nodeEnv] ?? envDbMap.dev
  // 專注建立資料庫主連線
  try {
    await connectDB(mainConfig.uri, mainConfig.dbName)
    isDbConnected = true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`❌ 資料庫初始化連線失敗: ${msg}`)
    console.warn('⚠️ 伺服器將以「降級模式」啟動 (無資料庫連線)。')
  }

  // 連線成功後，建立種子資料
  if (isDbConnected) {
    try {
      await initDatabases()
      await initSeedsData()
    } catch (err) {
      console.error('⚠️ [DB-Seed] 假資料寫入失敗，但伺服器仍繼續啟動:', err)
    }
  }

  // 啟動 HTTP 伺服器
  server.listen(PORT, () => {
    // *api
    // http://localhost:3000/api/users
    // http://localhost:3000/api/users/get-users

    // *查看生成的 API 文檔
    // http://localhost:3000/api-docs

    // *websocket
    // ws://localhost:3000/ws
    // ws://localhost:3000/ws2

    // *public
    // http://localhost:3000/about.html
    // http://localhost:3000/stylesheets/style.css

    // *ejs模板首頁
    // http://localhost:3000
    console.log('=================================')
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log('=================================')
  })
}

startServer()
