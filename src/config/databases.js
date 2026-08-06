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

// 這是 Collection 已存在的錯誤碼
const COLLECTION_EXISTS_ERROR = 48
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
// Utilities (輔助函式)
// ==========================================
// 從 Entity 解析 Collection 名稱
function getCollectionName(entity) {
  // prettier-ignore
  return entity.collectionName
  || entity.schema?.get('collection')
  || entity.name?.replace(/Model$/, '')
}
// 針對指定的單一 DB 建立所有對應的 Collections
async function getModelsForDb(dbConfig, entities) {
  const { dbName, label } = dbConfig
  if (!dbName) return

  // db：是你透過 mongoose.connection.useDb('devDB') 切換出來的指定資料庫連線實體
  const db = mongoose.connection.useDb(dbName, { useCache: true }) // devDB

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
    }
    catch (err) {
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
  //   { uri: '...', dbName: '...', label: 'prodDB' },
  //   { uri: '...', dbName: '...', label: 'devDB' },
  //   { uri: '...', dbName: '...', label: 'testDB' }
  // ]
  // 遍歷所有配置，依序初始化 Collections
  for (const dbConfig of configAry) {
    try {
      // 傳入設定檔案 / 與Schema藍圖檔案，建立對應的 Collections
      await getModelsForDb(dbConfig, allEntities)
    }
    catch (err) {
      console.error(`❌ 資料庫 [${dbConfig.label} / ${dbConfig.dbName}] 初始化失敗:`, err)
    }
  }
}

export { initDatabases, envDbMap }
