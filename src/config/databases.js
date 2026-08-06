import mongoose from 'mongoose'
import { getConfig } from './env/index.js'
import { allEntities } from '../models/index.js'

const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const mongoUriProd = getConfig('db.mongoUriProd')
const mongoUriDev = getConfig('db.mongoUriDev')
const mongoUriTest = getConfig('db.mongoUriTest')
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

// 各環境資料庫配置 Mapping
const envDbMap = {
  // *開發環境dev
  // api: 'prodDB',
  // api2: 'devDB',
  // api3: 'testDB',

  // *正式環境prod
  // api: 'nuxt3-test',
  // api2: 'nuxt3-test',
  // api3: 'nuxt3-test',

  production: {
    label: 'prodDB',
    uri: mongoUriProd,
    dbName: isDev ? 'prodDB' : 'nuxt3-test',
  },
  dev: {
    label: 'devDB',
    uri: mongoUriDev,
    dbName: isDev ? 'devDB' : 'nuxt3-test',
  },
  test: {
    label: 'testDB',
    uri: mongoUriTest,
    dbName: isDev ? 'testDB' : 'nuxt3-test',
  },
}
// ==========================================
// Utilities
// ==========================================
// 針對指定的單一 DB 建立所有對應的 Collections
async function getModelsForDb(dbName, entities) {

  // db：是你透過 mongoose.connection.useDb('devDB') 切換出來的指定資料庫連線實體
  const db = mongoose.connection.useDb(dbName, { useCache: true }) // devDB

  for (const entity of entities) {
    const collectionName = entity.collectionName // User
    const schema = entity.schema || entity // userSchema

    try {
      // 檢查 db 連線實例中是否已經編譯/註冊過該 Model
      let Model = db.models[entity.name] // UserModel
      if (!Model) {
        // 若未註冊過，則透過 schema 與指定 collection 名稱建立新的 Mongoose Model
        // db.model('UserModel', userSchema, 'User')
        Model = db.model(entity.name, schema, collectionName)
      }

      // 透過 Mongoose Model 建立 Collection
      await Model.createCollection()
    }
    catch (err) {
      // 這是 Collection 已存在的錯誤碼
      const COLLECTION_EXISTS_ERROR = 48
      // Mongoose 內部通常會自動忽略 NamespaceExists (48) 錯誤，
      // 但若是手動呼叫 createCollection 遇到例外時仍可保留保險檢查
      if (err?.code !== COLLECTION_EXISTS_ERROR) {
        throw err
      }
    }
  }

  console.log(`✅ 資料庫 [ ${dbName} ] 的 Collections 初始化完成`)
}
// ==========================================
// Database Init Collections
// ==========================================
const initDatabases = async () => {
  const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'

  console.log('------')
  console.log(`🚀 開始初始化各環境 Collections... (當前主環境: ${nodeEnv})`)

  // 前置檢查：確保已先調用 connectDB()
  if (mongoose.connection.readyState !== 1) {
    // 0：已斷線（Disconnected）
    // 1：已連線（Connected）
    // 2：連線中（Connecting）
    // 3：斷線中（Disconnecting）
    // --------------------------
    // 意思是： 「只要不是『已連線』，通通算進來」
    // 包含狀態： 0（已斷線）、2（連線中）、3（斷線中）。
    throw new Error('[DB Error] 必須先執行 connectDB() 建立主連線後才能初始化資料庫')
  }

  const configAry = Object.values(envDbMap)
  // [
  //   { uri: '...', dbName: 'prodDB', label: '...' },
  //   { uri: '...', dbName: 'devDB', label: '...' },
  //   { uri: '...', dbName: 'testDB', label: '...' }
  // ]
  // 遍歷所有配置，依序初始化 Collections
  for (const dbConfig of configAry) {
    try {
      // 傳入設定檔案 / 與Schema藍圖檔案，建立對應的 Collections
      await getModelsForDb(dbConfig.dbName, allEntities)
    }
    catch (err) {
      console.error(`❌ 資料庫 [${dbConfig.label} / ${dbConfig.dbName}] 初始化失敗:`, err)
    }
  }
}

export { initDatabases, envDbMap }
