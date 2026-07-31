import mongoose from 'mongoose'
import {
  allModels,
  // 這個是陣列，裡面放所有的 Schema
  allEntities,
  keepEntities,
  // === 無關連表 ===
  UserModel,
  PeopleModel,
  ArticleModel,
  // === 父表 (主表) ===
  // === 子表 (從表) ===
} from '../../db/models/index.js'
// mock 假資料
import { mockUsersDev } from './dev/users.seed.js'
import { mockPeoples } from './dev/peoples.seed.js'
import { mockArticles } from './dev/articles.seed.js'
// test
import { mockUsersTest } from './test/users.seed.js'
// prod
import { mockUsersProd } from './prod/users.seed.js'

// 需要初始化的目標資料庫清單
const All_DATABASES = ['devDB', 'prodDB', 'testDB']
// 各資料庫對應的 User 假資料映射表
const USER_SEEDS_MAP = {
  devDB: mockUsersDev,
  testDB: mockUsersTest,
  prodDB: mockUsersProd,
}

// 動態多資料庫 / 切換到指定的資料庫（例如 devDB），
function getModelsForDb(dbName) {
  // #region
  // * getModelsForDb
  // ------------------
  // ┌──────────────────────────────────────────────────────────────┐
  // │ getModelsForDb(dbName)                                    │
  // │ ➜ 在 Node.js 中建立或取得 Mongoose Model                      │
  // │ ➜ Model 會綁定 Schema、Validation、Middleware、Methods 等      │
  // │ ➜ 回傳 { User, Article }                                      │
  // │ ➜ 之後才能呼叫 User.find()、Article.create()                  │
  // └──────────────────────────────────────────────────────────────┘
  // #endregion
  // ----------------------------------------------------------
  // .useDb(dbName) : 切換目標資料庫 useDb('devDB')
  // { useCache: true } : 開啟連線快取機制
  // db：是你透過 mongoose.connection.useDb('devDB') 切換出來的 指定資料庫連線實體
  // db.models：是這個指定資料庫它裡面放的就是目前已經掛載所有 Mode
  const db = mongoose.connection.useDb(dbName, { useCache: true })

  const models = {}
  for (const model of allModels) {
    // 取得原本 Model 的名稱 (例如 'UserModel') 與其 Schema
    const rawName = model.modelName
    const schema = model.schema
    // 建立獨立的快取 Key 名稱 (例如 'devDB_UserModel')
    const scopedModelName = `${dbName}_${rawName}`
    // 解構簡化名稱 (如：去掉 'Model' 後綴，轉成 'User', 'People', 'Article')
    const key = rawName.replace(/Model$/, '')

    // 因為有多個 資料庫
    // 如果大家都只用 'UserModel' 當名字註冊，
    // Mongoose 就搞不清楚這個 User 到底是屬於 devDB 還是 prodDB 的。
    // db.models：是這個指定資料庫它裡面放的就是目前已經掛載所有 Mode
    // ---------------------------------
    // db.models['devDB_UserModel'] :意思：去查 devDB 這個資料庫的註冊表裡面
    // 你有沒有掛載過名為 'devDB_UserModel' 的 Model？
    const isModelExists = Boolean(db.models[scopedModelName])
    if (isModelExists) {
      // db.model(scopedModelName) （傳 1 個參數）
      // 動作：「讀取 / 取出（Getter）」
      // -------------------
      // 若已註冊過，直接從 Mongoose 取出既有的 Model
      // db.model('devDB_UserModel') 直接取出
      models[key] = db.model(scopedModelName)
    } else {
      // *第一次 都走這邊 建立models 出來
      // db.model(scopedModelName, schema) （傳 2 個參數）
      // 動作：「建立 / 註冊（Setter / Compiler）」
      // -------------------
      // 若尚未註冊，傳入 Schema 註冊並建立新 Model
      // db.model('devDB_UserModel', schema) 帶入 Schema 新建
      models[key] = db.model(scopedModelName, schema)
    }
  }

  // console.log(`models` , models)
  // models {
  //   User: Model { devDB_UserModel },
  //   People: Model { devDB_PeopleModel },
  //   Article: Model { devDB_ArticleModel }
  // }
  return models
}
// 清空[ 動態 ]資料庫的所有 Collection (完全動態清空)
async function clearDatabaseTables(dbName) {
  // 指定 Database
  const db = mongoose.connection.useDb(dbName, { useCache: true })

  // 過濾掉需要保留的 Entity
  const cleanEntities = allEntities.filter(({ name }) => !keepEntities.has(name))

  console.log(
    'cleanEntities',
    cleanEntities.map(({ name }) => name),
  )
  // cleanEntities [ 'PeopleModel', 'ArticleModel' ]

  // 動態建立需要清空的 Models
  const models = cleanEntities.map(({ name, schema }) => {
    return db.model(name, schema)
  })

  if (models.length === 0) {
    console.log('🧹 沒有需要清空的資料表')
    return
  }

  for (const model of models) {
    await model.deleteMany({})
  }

  console.log('🧹 清空完成')
}
// 初始化所有目標資料庫 (devDB, prodDB, testDB)
export async function seedMockData() {
  try {
    console.log('🌱 開始初始化 3 個目標資料庫 (devDB, prodDB, testDB)...')

    for (const dbName of All_DATABASES) {
      console.log(`\n----------------------------------------`)
      console.log(`📦 正在處理資料庫: [${dbName}]`) // devDB

      // 1. 清空該 DB 資料
      await clearDatabaseTables(dbName)
      console.log(`  🧹 舊資料已清空`)

      // 2. 取得綁定目前 dbName 的 Models
      // 給我專屬 devDB 的 User Model
      // const devModels = getModelsForDb('devDB')
      // await devModels.User.find() // 👉 跑去 devDB 查 User 資料
      const { User, People, Article } = getModelsForDb(dbName) // devDB

      // #region Models 迴圈結果
      // const Models = getModelsForDb('動態資料庫')
      // console.log(`Models` , Models)
      // ----------------------------------------
      // 📦 正在處理資料庫: [devDB]
      //   🧹 舊資料已清空
      // Models {
      //   User: Model { devDB_UserModel },
      //   People: Model { devDB_PeopleModel },
      //   Article: Model { devDB_ArticleModel }
      // }

      // ----------------------------------------
      // 📦 正在處理資料庫: [prodDB]
      //   🧹 舊資料已清空
      // Models {
      //   User: Model { devDB_UserModel },
      //   People: Model { devDB_PeopleModel },
      //   Article: Model { devDB_ArticleModel }
      // }

      // ----------------------------------------
      // 📦 正在處理資料庫: [testDB]
      //   🧹 舊資料已清空
      // Models {
      //   User: Model { devDB_UserModel },
      //   People: Model { devDB_PeopleModel },
      //   Article: Model { devDB_ArticleModel }
      // }
      // #endregion

      // ==========================================
      // 🚀 動態 資料寫入
      // 動態不同資料庫 載入不同假資料
      // ==========================================
      // *動態取得當前資料庫對應的 [ XXX ] 假資料
      const currentMockUsers = USER_SEEDS_MAP[dbName] || []
      // 寫入 Users 資料 ( 開發資料會保留 )
      if (currentMockUsers && currentMockUsers.length > 0) {
        const operations = currentMockUsers.map((user) => ({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: user },
            upsert: true, // 存在就更新，不存在就新增
          },
        }))

        await User.bulkWrite(operations)
        console.log(`  └─ 成功寫入 / 更新 User 資料 [${dbName}]`)
      }

      // ==========================================
      // 🚀 資料寫入
      // 共用資料庫 假資料
      // ==========================================
      // 寫入 Users 資料
      // let createdUsers = []
      // if (currentMockUsers && currentMockUsers.length > 0) {
      //   createdUsers = await User.insertMany(currentMockUsers)
      //   console.log(`  └─ 成功寫入 ${createdUsers.length} 筆 User 資料 [${dbName}]`)
      // }

      // 寫入 Peoples 資料
      if (mockPeoples && mockPeoples.length > 0) {
        const createdPeoples = await People.insertMany(mockPeoples)
        console.log(`  └─ 成功寫入 ${createdPeoples.length} 筆 People 資料 [${dbName}]`)
      }
      // 寫入 Articles 資料
      if (mockArticles && mockArticles.length > 0) {
        const createdArticles = await Article.insertMany(mockArticles)
        console.log(`  └─ 成功寫入 ${createdArticles.length} 筆 Article 資料 [${dbName}]`)
      }
    }

    console.log('\n🎉 所有資料庫 (devDB, prodDB, testDB) 初始化完成！')
  } 
  catch (err) {
    console.error('❌ 寫入 Seed 資料失敗:', err)
    throw err
  }
}
