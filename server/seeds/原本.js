import mongoose from 'mongoose'
// Schema
import { ArticleModel } from '../../db/models/article.model.js'
import { PeopleModel } from '../../db/models/people.model.js'
import { UserModel } from '../../db/models/user.model.js'
// mock 假資料
import { mockUsersDev } from './dev/users.seed.js'
import { mockPeoples } from './dev/peoples.seed.js'
import { mockArticles } from './dev/articles.seed.js'
// test
import { mockUsersTest } from './test/users.seed.js'
// prod
import { mockUsersProd } from './prod/users.seed.js'

// 需要初始化的目標資料庫清單
const TARGET_DATABASES = ['devDB', 'prodDB', 'testDB']

// 各資料庫對應的 User 假資料映射表
const USER_SEEDS_MAP = {
  devDB: mockUsersDev,
  testDB: mockUsersTest,
  prodDB: mockUsersProd,
}
// 取得指定資料庫名稱下的 Models
// 透過 useDb 避免重新連線，同時確保寫入正確的資料庫
function getModelsForDb(dbName) {
  const db = mongoose.connection.useDb(dbName, { useCache: true })
  return {
    User: db.model('User', UserModel.schema),
    People: db.model('People', PeopleModel.schema),
    Article: db.model('Article', ArticleModel.schema),
  }
}
// 清空單一資料庫的舊資料
export async function clearDatabaseTables(dbName) {
  try {
    const { User, People, Article } = getModelsForDb(dbName)

    // 併行清空該資料庫的三個資料表
    await Promise.all([User.deleteMany({}), People.deleteMany({}), Article.deleteMany({})])
  } 
  catch (err) {
    console.error(`❌ 清空資料庫 [${dbName}] 失敗:`, err)
    throw err
  }
}
// 初始化所有目標資料庫 (devDB, prodDB, testDB)
export async function seedMockData() {
  try {
    console.log('🌱 開始初始化 3 個目標資料庫 (devDB, prodDB, testDB)...')

    for (const dbName of TARGET_DATABASES) {
      console.log(`\n----------------------------------------`)
      console.log(`📦 正在處理資料庫: [${dbName}]`)

      // 1. 清空該 DB 資料
      await clearDatabaseTables(dbName)
      console.log(`  🧹 舊資料已清空`)

      // 取得綁定目前 dbName 的 Models
      const { User, People, Article } = getModelsForDb(dbName)

      // 動態取得當前資料庫對應的 User 假資料
      const currentMockUsers = USER_SEEDS_MAP[dbName] || []

      //---------------------------------------------------------
      // 2. 寫入 Users 資料
      let createdUsers = []
      if (currentMockUsers && currentMockUsers.length > 0) {
        createdUsers = await User.insertMany(currentMockUsers)
        console.log(`  └─ 成功寫入 ${createdUsers.length} 筆 User 資料 [${dbName}]`)
      }
      // 3. 寫入 Peoples 資料
      if (mockPeoples && mockPeoples.length > 0) {
        const createdPeoples = await People.insertMany(mockPeoples)
        console.log(`  └─ 成功寫入 ${createdPeoples.length} 筆 People 資料 [${dbName}]`)
      }
      // 4. 寫入 Articles 資料
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
