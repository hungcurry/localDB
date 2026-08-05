import mongoose from 'mongoose'
import { getConfig } from './env/index.js'
import { allEntities } from '../models/index.js'

const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

// 這是 Collection 已存在的錯誤碼
const COLLECTION_EXISTS_ERROR = 48
// 資料庫 URI 配置
const mongoURIs = {
  // 如果是用專案開環境 不同環境的對應 不同 MongoDB URI 前綴
  // api: 'mongodb://127.0.0.1:27017/',
  // api2: 'mongodb://127.0.0.1:27017/',
  // api3: 'mongodb://127.0.0.1:27017/',

  // api: 'mongodb+srv://ooopp42:<密碼>@<專案prod>.mongodb.net/',
  // api2: 'mongodb+srv://ooopp42:<密碼>@<專案dev>.mongodb.net/',
  // api3: 'mongodb+srv://ooopp42:<密碼>@<專案test>.mongodb.net/',
  api: process.env.MONGO_URI_PROD,
  api2: process.env.MONGO_URI_DEV,
  api3: process.env.MONGO_URI_TEST,
}
// 預設 Database 名稱 Mapping
const defaultDbMap = {
  // *開發環境dev
  // api: 'prodDB',
  // api2: 'devDB',
  // api3: 'testDB',

  // 開發環境使用 devDB，其餘環境 (prod / test) 使用 nuxt3-test
  api: isDev ? 'prodDB' : 'nuxt3-test',
  api2: isDev ? 'devDB' : 'nuxt3-test',
  api3: isDev ? 'testDB' : 'nuxt3-test',
}
// 各環境資料庫配置 Mapping
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

// 從 Entity 解析 Collection 名稱
function getCollectionName(entity) {
  // prettier-ignore
  return entity.collectionName 
  || entity.schema?.get('collection') 
  || entity.name?.replace(/Model$/, '')
}
// 針對指定的單一 DB 建立所有對應的 Collections
async function initCollectionsForDb(dbConfig, entities) {
  const { dbName, label } = dbConfig
  if (!dbName) return

  // 透過 useDb 切換至指定資料庫實體（共用底層主連線）
  const db = mongoose.connection.useDb(dbName, { useCache: true })

  for (const entity of entities) {
    const collectionName = getCollectionName(entity)
    const schema = entity.schema || entity

    try {
      const Model = db.models[entity.name] || db.model(entity.name, schema, collectionName)
      await Model.createCollection()
    } catch (err) {
      if (err?.code !== COLLECTION_EXISTS_ERROR) {
        throw err
      }
    }
  }

  console.log(`✅ 資料庫 [${label} / ${dbName}] Collections 初始化完成`)
}
// 初始化所有環境所需的 DB Collections
const initDatabases = async () => {
  const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'

  console.log('------')
  console.log(`🚀 開始初始化各環境 Collections... (當前主環境: ${nodeEnv})`)

  // 前置檢查：確保已先調用 connectDB()
  if (mongoose.connection.readyState !== 1) {
    throw new Error('[DB Error] 必須先執行 connectDB() 建立主連線後才能初始化資料庫')
  }

  // 遍歷所有配置，依序初始化 Collections
  for (const dbConfig of Object.values(envDbMap)) {
    try {
      await initCollectionsForDb(dbConfig, allEntities)
    } catch (err) {
      console.error(`❌ 資料庫 [${dbConfig.label} / ${dbConfig.dbName}] 初始化失敗:`, err)
    }
  }
}

export { initDatabases, mongoURIs, defaultDbMap, envDbMap }
