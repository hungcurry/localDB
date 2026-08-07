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
// 各資料庫連線實體
// prettier-ignore
const allDatabases  = isDev
  ? ['devDB', 'prodDB', 'testDB']
  : ['nuxt3-test']
// 連線物件快取 Map
// #region ....
// 先查紀錄簿 (dbConnections.get(dbName))：看看這個 DB 之前有沒有連過
// {
//   'devDB' => ConnectionObject_A,
//   'prodDB' => ConnectionObject_B
// }
// #endregion
const dbConnections = new Map()

// 取得或建立特定 DB 的 Models
function getModelsForDb(dbName) {
  // 取得目前資料庫連線
  const db = initCheckLink(dbName)

  const models = {}
  for (const { name, collectionName, schema } of allEntities) {
    // 建立獨立的快取 Key 名稱 (例如 'devDB_UserModel')
    const scopedModelName = `${dbName}_${name}`

    // 因為有多個資料庫
    // 如果大家都只用 'UserModel' 當名字註冊，
    // Mongoose 就無法區分這個 Model 是屬於哪個資料庫。
    // db.models：存放目前這個資料庫連線已註冊的所有 Model
    // ---------------------------------
    // db.models['devDB_UserModel']
    // 意思：去查 devDB 這個資料庫的註冊表裡面, 掛載過名為 'devDB_UserModel' 的 Model
    const isModelExists = Boolean(db.models[scopedModelName])
    if (isModelExists) {
      // db.model(scopedModelName) （傳 1 個參數）
      // 動作：「讀取 / 取出（Getter）」
      // -------------------
      // 若已註冊過，直接從 Mongoose 取出既有的 Model
      // db.model('devDB_UserModel') 直接取出
      models[name] = db.model(scopedModelName)
    }
    else {
      // *第一次 都走這邊 建立models 出來
      // db.model(scopedModelName, schema) （傳 2 個參數）
      // 動作：「建立 / 註冊（Setter / Compiler）」
      // -------------------
      // 若尚未註冊，傳入 Schema 註冊並建立新 Model
      // db.model('devDB_UserModel', schema) 帶入 Schema 新建
      // 💡 使用定義好的 collectionName (例如 'User')
      // prettier-ignore
      const targetCollection = collectionName || schema.get('collection')
      models[name] = db.model(scopedModelName, schema, targetCollection)
    }
  }

  // console.log(`models`, models)
  // models {
  //   UserModel: Model { devDB_UserModel },
  //   PeopleModel: Model { devDB_PeopleModel },
  //   ArticleModel: Model { devDB_ArticleModel }
  // }

  return models
}
// 取得或建立指定資料庫連線
function initCheckLink(dbName) {
  // 先查紀錄簿：看看這個 dbName 之前有沒有建立過連線
  let db = dbConnections.get(dbName) // devDB
  if (!db) {
    // .useDb(dbName) : 切換目標資料庫 useDb('devDB')
    // { useCache: true } : 開啟連線快取機制
    // db：是你透過 mongoose.connection.useDb('devDB') 切換出來的指定資料庫連線實體
    // db.models：是這個指定資料庫連線已經掛載的所有 Model
    db = mongoose.connection.useDb(dbName, { useCache: true })

    // 把建立好的連線實體存入紀錄簿，方便下次直接用
    dbConnections.set(dbName, db)
  }
  return db
}
async function initCollections(dbName) {
  // 動態遍歷 allEntities 確保實體 Collection 在 MongoDB 中建立
  for (const { collectionName: targetCollection } of allEntities) {
    try {
      // 'User' / 'People' / 'Article'
      await dbName.createCollection(targetCollection)
    }
    catch (err) {
      // 如果 Collection 已存在 (Code 48: NamespaceExists)，忽略該錯誤
      if (err.code !== 48) {
        throw err
      }
    }
  }
}
// 初始化多資料庫及其對應的 Collections 與 Models
async function initDatabases(dbNames = allDatabases) {
  console.log('')
  console.log('🚀 開始初始化 多資料庫 / Collections...')
  console.log('----------------------------------------')

  for (const dbName of dbNames) {
    // 獲得連線實體
    const targetdb = initCheckLink(dbName) // devDB
    // 負責建立 Collections
    await initCollections(targetdb)

    console.log(`✅ 資料庫 [ ${dbName} ] 的 Collections 初始化完成`)
  }
}

export { initDatabases, getModelsForDb, envDbMap, allDatabases }
