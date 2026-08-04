// ~基本方式 只有一種環境變數
// import 'dotenv/config' // 確保第一行加載環境變數
// ~進階方式 根據不同環境NODE_ENV,加載不同的 .env 檔案
import '../server/config/env.js' // 確保第一行加載環境變數
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
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

// 這是 Collection 已存在的錯誤碼
const COLLECTION_EXISTS_ERROR = 48
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
// ==========================================
// Utilities (輔助函式)
// ==========================================
// 從 Entity 解析真正的 Collection 名稱
function getCollectionName(entity) {
  // prettier-ignore
  return entity.collectionName 
  || entity.schema?.get('collection') 
  || entity.name?.replace(/Model$/, '')
}
// 為指定的單一 Database 批量建立 Collections
async function getModelsForDb(Instance, dbConfig, entities) {
  const { dbName, label } = dbConfig
  if (!dbName) return

  // db：是你透過 mongoose.connection.useDb('devDB') 切換出來的指定資料庫連線實體
  const db = Instance.connection.useDb(dbName, { useCache: true })
  if (!db) {
    throw new Error(`無法取得 [${label}] (DB: ${dbName}) 的連線實體`)
  }

  for (const entity of entities) {
    const collectionName = getCollectionName(entity)
    // 取得 Entity 對應的 Schema (依據你的專案結構調整，
    // 若 entity 本身就是 Schema 則直接使用)
    const schema = entity.schema || entity

    try {
      // 在指定連線實體上註冊/取得 Model
      // 如果該 Model 已經在 connObj 上註冊過，優先使用已註冊的 Model
      const Model = db.models[entity.name] || db.model(entity.name, schema, collectionName)

      // 透過 Mongoose Model 建立 Collection
      await Model.createCollection()
    } catch (err) {
      // Mongoose 內部通常會自動忽略 NamespaceExists (48) 錯誤，
      // 但若是手動呼叫 createCollection 遇到例外時仍可保留保險檢查
      if (err?.code !== COLLECTION_EXISTS_ERROR) {
        throw err
      }
    }
  }

  console.log(`✅ 資料庫 [${label} / ${dbName}] Collections 初始化完成`)
}

// ==========================================
// Database Initialization
// ==========================================
async function initDatabases() {
  console.log('------')
  console.log(`🚀 開始初始化資料庫連線與 Collections... (當前環境: ${nodeEnv})`)

  // 根據當前環境選擇主連線，預設退回 development
  // ?? 只會判斷： undefined 和 null 所以 更比 ||更嚴井
  const mainConfig = envDbMap[nodeEnv] ?? envDbMap.dev

  if (!mainConfig?.uri) {
    throw new Error(`[DB Error] 找不到對應環境 (${nodeEnv}) 的主要資料庫連線 URI`)
  }

  console.log(`📌 已選定主連線目標: [${mainConfig.label}] -> DB: ${mainConfig.dbName}`)

  // 建立主連線實體
  // 'mongodb://localhost:27017..' / 'devDB
  const Instance = await connectDB(mainConfig.uri, mainConfig.dbName)

  // 透過 useDb 為所有配置中的 DB 建立 Collections
  for (const dbConfig of Object.values(envDbMap)) {
    try {
      await getModelsForDb(Instance, dbConfig, allEntities)
    } 
    catch (err) {
      console.error(`❌ 資料庫 [${dbConfig.label} / ${dbConfig.dbName}] 初始化失敗:`, err)
    }
  }

  return Instance
}
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
  let isDbInitialized = false

  // 資料庫初始化與連線
  try {
    await initDatabases()
    isDbInitialized = true
  } 
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    console.error(`❌ 資料庫初始化連線失敗: ${msg}`)
    console.warn('⚠️ 伺服器將以「降級模式」啟動 (無資料庫連線)。')
  }

  // 連線成功後，建立種子資料
  if (isDbInitialized) {
    try {
      await initSeedsData()
    } 
    catch (err) {
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
