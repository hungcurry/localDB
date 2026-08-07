import mongoose from 'mongoose'
import { All_DATABASES, getModelsForDb } from '../config/databases.js'
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
const USER_SEEDS_MAP = {
  devDB: mockUsersDev,
  testDB: mockUsersTest,
  prodDB: mockUsersProd,
}

// 清空指定資料庫中非保留 (keepEntities) 的資料表
async function clearDatabaseTables(dbName, modelsMap) {
  const cleanEntities = allEntities.filter(({ name }) => !keepEntities?.has(name))

  if (cleanEntities.length === 0) {
    console.log(`[Seeder] [${dbName}] 沒有需要清空的資料表。`)
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
// 初始化與寫入 Seed 假資料
export async function seedMockData() {
  try {
    console.log('\n🌱 開始 Seeds 目標資料庫 (devDB, prodDB, testDB)...')

    for (const dbName of All_DATABASES) {
      console.log(`----------------------------------------`)
      console.log(`📦 正在處理資料庫: [${dbName}]`)

      // 1. 取得該 DB 的 Models 實體 Map
      const modelsMap = getModelsForDb(dbName)

      // 2. 清空該 DB 資料
      await clearDatabaseTables(dbName, modelsMap)

      const {
        UserModel,
        PeopleModel,
        ArticleModel,
      } = modelsMap // devDB

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

        await UserModel.bulkWrite(operations)
        console.log(`  └─ 成功寫入 / 更新 User 資料 [${dbName}]`)
      }

      // 4. 寫入 Peoples 共用假資料
      if (mockPeoples && mockPeoples.length > 0 && PeopleModel) {
        const createdPeoples = await PeopleModel.insertMany(mockPeoples)
        console.log(`  └─ 成功寫入 ${createdPeoples.length} 筆 People 資料 [${dbName}]`)
      }

      // 5. 寫入 Articles 共用假資料
      if (mockArticles && mockArticles.length > 0 && ArticleModel) {
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
