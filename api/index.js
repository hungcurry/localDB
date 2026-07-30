import http from 'http'
import connectDB from '../db/connection.js'
import { app, mongoURIs, defaultDbMap } from './app.js'
// seeds資料
import { seedMockData } from '../server/seeds/index.js'

const server = http.createServer(app)
const port = process.env.PORT || 3000

const initDatabases = async () => {
  const dbConfigs = [
    { uri: mongoURIs.api, dbName: defaultDbMap.api }, // prodDB
    { uri: mongoURIs.api2, dbName: defaultDbMap.api2 }, // devDB
    { uri: mongoURIs.api3, dbName: defaultDbMap.api3 }, // testDB
  ]

  console.log('🚀 開始初始化資料庫連線與 Collections...')

  // 1. 先建立主連線 (使用 api 預設 URI)
  const mainConfig = dbConfigs[0]
  if (!mainConfig.uri) {
    throw new Error('未找不到主要資料庫的連線 URI (mongoURIs.api)')
  }

  const mongooseInstance = await connectDB(mainConfig.uri, mainConfig.dbName)
  const collections = ['User', 'Article', 'People']

  // 2. 透過 useDb 分別為 3 個 DB 建立 Collections
  for (const { dbName } of dbConfigs) {
    if (!dbName) continue

    try {
      // 取得特定 DB 的連線實體
      const db = mongooseInstance.connection.useDb(dbName).db

      if (db) {
        for (const colName of collections) {
          await db.createCollection(colName).catch((err) => {
            // Error code 48: NamespaceExists (Collection 已存在則忽略)
            if (err.code !== 48) {
              throw err
            }
          })
        }
      }
      console.log(`✅ 資料庫 [${dbName}] Collections 初始化完成`)
    } 
    catch (err) {
      console.error(`❌ 資料庫 [${dbName}] 初始化失敗:`, err)
    }
  }
}

// 啟動伺服器
const startServer = async () => {
  try {
    // 步驟 1: 啟動時先連線並初始化 3 個 DB
    await initDatabases()

    // 步驟 2: 執行假資料寫入
    await seedMockData()

    // 步驟 3: 啟動 HTTP 伺服器
    server.listen(port, () => {
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
      // console.log(`Server running on http://localhost:${post}`)
      console.log(`=================================`)
      console.log(`🚀 Server running on http://localhost:${port}`)
      console.log(`=================================`)
    })
  } 
  catch (error) {
    console.error('❌ 伺服器啟動失敗:', error)
    process.exit(1)
  }
}

startServer()
