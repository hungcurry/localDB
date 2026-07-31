import http from 'http'
import connectDB from '../db/connection.js'
import { app, mongoURIs, defaultDbMap } from './app.js'
import { getConfig } from '../server/config/index.js'
import { allEntities } from '../db/models/index.js'
// seeds資料
import { seedMockData } from '../server/seeds/index.js'

const server = http.createServer(app)
const PORT = getConfig('server.port') || 3000
const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'

// 定義各環境配置 Mapping
const envDbMap = {
  production: {
    uri: mongoURIs.api,
    dbName: defaultDbMap.api,
    label: 'prodDB',
  },
  dev: {
    uri: mongoURIs.api2,
    dbName: defaultDbMap.api2,
    label: 'devDB',
  },
  test: {
    uri: mongoURIs.api3,
    dbName: defaultDbMap.api3,
    label: 'testDB',
  },
}
const initDatabases = async () => {
  console.log(`🚀 開始初始化資料庫連線與 Collections... (當前環境: ${nodeEnv})`)

  // 根據當前環境選擇主連線，預設退回 development (避免開發生態連到 prodDB)
  const mainConfig = envDbMap[nodeEnv] || envDbMap.development

  if (!mainConfig || !mainConfig.uri) {
    throw new Error(`[DB Error] 找不到對應環境 (${nodeEnv}) 的主要資料庫連線 URI`)
  }

  console.log(`📌 已選定主連線目標: [${mainConfig.label}] -> DB: ${mainConfig.dbName}`)

  // 4. 建立主連線實體
  const mongooseInstance = await connectDB(mainConfig.uri, mainConfig.dbName)

  // 5. 需要被輪詢初始化的所有 DB Config 清單
  const allDbConfigs = Object.values(envDbMap)

  // 6. 透過 useDb 為所有指定的 DB 建立 Collections
  for (const { dbName, label } of allDbConfigs) {
    if (!dbName) continue

    try {
      // 取得該 DB 的獨立連線實體
      const db = mongooseInstance.connection.useDb(dbName).db

      if (db) {
        // 動態使用 allEntities 中的 entity.name，取代原本硬寫的 ['User', 'Article', 'People']
        for (const entity of allEntities) {
          await db.createCollection(entity.name).catch((err) => {
            // Error code 48: NamespaceExists (Collection 已存在則忽略)
            if (err.code !== 48) {
              throw err
            }
          })
        }
      }
      console.log(`✅ 資料庫 [${label} / ${dbName}] Collections 初始化完成`)
    } catch (err) {
      console.error(`❌ 資料庫 [${label} / ${dbName}] 初始化失敗:`, err)
    }
  }
}
// 啟動伺服器
const startServer = async () => {
  try {
    // 步驟 1: 啟動時先連線並初始化 3 個 DB
    await initDatabases()

    const isProd = nodeEnv === 'production'
    const isDev = nodeEnv === 'dev'
    const isTest = nodeEnv === 'test'
    // 步驟 2: 執行假資料寫入
    if (isDev) {
      await seedMockData()
    }

    // 步驟 3: 啟動 HTTP 伺服器
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
      // console.log(`Server running on http://localhost:${post}`)
      console.log(`=================================`)
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`=================================`)
    })
  } 
  catch (error) {
    console.error('❌ 伺服器啟動失敗:', error)
    process.exit(1)
  }
}

startServer()
