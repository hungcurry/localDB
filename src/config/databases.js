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

// 各資料庫連線實體
export const All_DATABASES = ['devDB', 'prodDB', 'testDB']
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
// 連線物件連線快取 Map
// #region ....
// 先查紀錄簿 (dbConnections.get(dbName))：看看這個 DB 之前有沒有連過
// {
//   'devDB' => ConnectionObject_A,
//   'prodDB' => ConnectionObject_B
// }
// #endregion
const dbConnections = new Map()

// 取得或建立特定 DB 的 Models
function getModelsForDb(dbName, entities = allEntities) {
  let db = dbConnections.get(dbName)
  if (!db) {
    db = mongoose.connection.useDb(dbName, { useCache: true })
    dbConnections.set(dbName, db)
  }

  const models = {}

  for (const { name, collectionName, schema } of entities) {
    const scopedModelName = `${dbName}_${name}`
    const isModelExists = Boolean(db.models[scopedModelName])

    if (isModelExists) {
      models[name] = db.model(scopedModelName)
    } else {
      const targetCollection =
        collectionName || schema.get('collection') || name.replace(/Model$/, '')
      models[name] = db.model(scopedModelName, schema, targetCollection)
    }
  }

  return models
}
// 初始化多資料庫及其對應的 Collections 與 Models
async function initDatabases(dbNames = All_DATABASES, entities = allEntities) {
  console.log('')
  console.log(`🚀 開始初始化 多資料庫 / Collections......`)
  console.log(`----------------------------------------`)

  for (const dbName of dbNames) {
    // 1. 初始化 Model 並建立連線快取
    getModelsForDb(dbName, entities)
    const dbConnection = dbConnections.get(dbName)

    if (!dbConnection || !dbConnection.db) {
      throw new Error(`[Database Error] 無法取得資料庫連線實體: ${dbName}`)
    }

    // 2. 動態遍歷 entities 確保實體 Collection 在 MongoDB 中建立
    for (const { name, collectionName, schema } of entities) {
      const targetCollection =
        collectionName || schema.get('collection') || name.replace(/Model$/, '')

      try {
        await dbConnection.db.createCollection(targetCollection)
      }
      catch (err) {
        // 如果 Collection 已存在 (Code 48: NamespaceExists)，忽略該錯誤
        if (err.code !== 48) {
          throw err
        }
      }
    }

    console.log(`✅ 資料庫 [ ${dbName} ] 的 Collections 初始化完成`)
  }

  return dbConnections
}

export { initDatabases, getModelsForDb , envDbMap }
