import mongoose from 'mongoose'
import { allDatabases, getModelsForDb } from '../config/databases.js'
import {
  // 這個是陣列，裡面放所有的 Schema
  allEntities,
  keepEntities,
  // === 無關連表 ===
  UserModel,
  PeopleModel,
  ArticleModel,
  // === 父表 (主表) ===
  // === 子表 (從表) ===
} from '../models/index.js'
// mock 假資料
import { mockUsersDev } from './dev/users.seed.js'
import { mockPeoples } from './dev/peoples.seed.js'
import { mockArticles } from './dev/articles.seed.js'
// test
import { mockUsersTest } from './test/users.seed.js'
// prod
import { mockUsersProd } from './prod/users.seed.js'

// 各資料庫對應的 User 假資料映射表
const userSeedsMap = {
  devDB: mockUsersDev,
  testDB: mockUsersTest,
  prodDB: mockUsersProd,
}

// 清空指定資料庫中非保留 (keepEntities) 的資料表
async function clearDatabaseTables(dbName, modelsMap) {
  // * 跟TS版本node-zeabur-mongo１不同 (單資料庫)
  // * 這邊 allEntities 出來是 藍圖 所以 還要多轉一層變models
  // 要清空的 Entities : 傳入結構：每個元素是 { name, schema }
  const cleanEntities = allEntities.filter(({ name }) => !keepEntities.has(name))
  // cleanEntities的 name [ 'PeopleModel', 'ArticleModel' ]
  // 要清空的Tables資料表
  const cleanTables = cleanEntities.map((entity) => {
    return entity.collectionName
  })
  console.log(`cleanTables`, cleanTables)
  // cleanTables [ 'People', 'Article' ]

  if (cleanTables.length === 0) {
    console.log('[Seeder] 沒有需要清空的資料表。')
    return
  }

  for (const { name } of cleanEntities) {
    const model = modelsMap[name]
    if (model) {
      await model.deleteMany({})
    }
  }

  console.log(`  🧹 舊資料已清空 [${dbName}]`)
}
// 初始化所有目標資料庫 (devDB, prodDB, testDB)
export async function seedMockData() {
  try {
    console.log('')
    console.log('🌱 開始 Seeds 3 個目標資料庫 (devDB, prodDB, testDB)...')

    for (const dbName of allDatabases) {
      console.log(`----------------------------------------`)
      console.log(`📦 正在處理資料庫: [${dbName}]`) // devDB

      // 取得該 DB 的 Models 實體 Map
      const modelsMap = getModelsForDb(dbName) // devDB
      // #region modelsMap 迴圈結果
      // const modelsMap = getModelsForDb('動態資料庫')
      // console.log(`modelsMap` , modelsMap)
      // ----------------------------------------
      // 📦 正在處理資料庫: [devDB]
      //   🧹 舊資料已清空
      // modelsMap {
      //   UserModel: Model { devDB_UserModel },
      //   PeopleModel: Model { devDB_PeopleModel },
      //   ArticleModel: Model { devDB_ArticleModel }
      // }

      // ----------------------------------------
      // 📦 正在處理資料庫: [prodDB]
      //   🧹 舊資料已清空
      // modelsMap {
      //   UserModel: Model { devDB_UserModel },
      //   PeopleModel: Model { devDB_PeopleModel },
      //   ArticleModel: Model { devDB_ArticleModel }
      // }

      // ----------------------------------------
      // 📦 正在處理資料庫: [testDB]
      //   🧹 舊資料已清空
      // modelsMap {
      //   UserModel: Model { devDB_UserModel },
      //   PeopleModel: Model { devDB_PeopleModel },
      //   ArticleModel: Model { devDB_ArticleModel }
      // }
      // #endregion

      // 清空該 DB 資料
      await clearDatabaseTables(dbName, modelsMap)

      const { UserModel, PeopleModel, ArticleModel } = modelsMap // devDB
      // ==========================================
      // 🚀 動態 資料寫入
      // 動態不同資料庫 載入不同假資料
      // ==========================================
      // *動態取得當前資料庫對應的 [ XXX ] 假資料
      const currentMockUsers = userSeedsMap[dbName] || []
      // 寫入 Users 資料 ( 開發資料會保留 )
      if (currentMockUsers && currentMockUsers.length > 0) {
        const operations = currentMockUsers.map((user) => ({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: user },
            upsert: true, // 存在就更新，不存在就新增
          },
        }))

        await UserModel.bulkWrite(operations)
        console.log(`  └─ 成功寫入 / 更新 User 資料 [${dbName}]`)
      }

      // ==========================================
      // 🚀 資料寫入
      // 共用資料庫 假資料
      // ==========================================
      // 寫入 Users 資料
      // let createdUsers = []
      // if (currentMockUsers && currentMockUsers.length > 0) {
      //   createdUsers = await UserModel.insertMany(currentMockUsers)
      //   console.log(`  └─ 成功寫入 ${createdUsers.length} 筆 User 資料 [${dbName}]`)
      // }

      // 寫入 Peoples 資料
      if (mockPeoples && mockPeoples.length > 0) {
        const createdPeoples = await PeopleModel.insertMany(mockPeoples)
        console.log(`  └─ 成功寫入 ${createdPeoples.length} 筆 People 資料 [${dbName}]`)
      }
      // 寫入 Articles 資料
      if (mockArticles && mockArticles.length > 0) {
        const createdArticles = await ArticleModel.insertMany(mockArticles)
        console.log(`  └─ 成功寫入 ${createdArticles.length} 筆 Article 資料 [${dbName}]`)
      }
    }

    console.log('\n🎉 所有資料庫 (devDB, prodDB, testDB) Seed 資料初始化完成！')
  }
  catch (err) {
    console.error('❌ 寫入 Seed 資料失敗:', err)
    throw err
  }
}
