// ==============================
// 1. 統一導出所有的 Model (使用 export type)
// ==============================
// === 無關連表 ===
export { UserModel } from './user.model.js'
export { PeopleModel } from './people.model.js'
export { ArticleModel } from './article.model.js'
// === 父表 (主表) ===
// === 子表 (從表) ===

// ==============================
// 2. 引入 Model 配置物件
// ==============================
// === 無關連表 ===
import { UserModel } from './user.model.js'
import { PeopleModel } from './people.model.js'
import { ArticleModel } from './article.model.js'
// === 父表 (主表) ===
// === 子表 (從表) ===

// ==============================
// 2. 引入 Schema 配置物件
// ==============================
// === 無關連表 ===
import { userSchema } from './user.model.js'
import { peopleSchema } from './people.model.js'
import { articleSchema } from './article.model.js'
// === 父表 (主表) ===
// === 子表 (從表) ===

// ==============================
// 3. 單一資料庫 產生清空使用
// ==============================
// 單一資料庫：直接用 Model
// 因為只有一個資料庫，所以 Model 一建立就固定綁定那個 Connection
// 例如：const UserModel = mongoose.model('UserModel', userSchema)
// 之後整個專案都用
// UserModel.find()
// ----------------------------
// export const allModels = [
//   // === 無關連表 ===
//   UserModel,
//   PeopleModel,
//   ArticleModel,
//   // === 父表 (主表) ===
//   // === 子表 (從表) ===
// ]

// ==============================
// 4. 多資料庫 產生清空使用
// ==============================
// *多資料庫：不能直接用 Model
// *使用 共用同一份 Schema 去產生每個資料庫建立自己的 Model
export const allEntities = [
  // === 無關連表 ===
  {
    name: 'UserModel',
    collectionName: 'User',
    schema: userSchema,
  },
  {
    name: 'PeopleModel',
    collectionName: 'People',
    schema: peopleSchema,
  },
  {
    name: 'ArticleModel',
    collectionName: 'Article',
    schema: articleSchema,
  },
  // === 父表 (主表) ===
  // === 子表 (從表) ===
]
// 開發模式本地開發（isDev）Entity 白名單（保留手動測試資料）
export const keepEntities = new Set([
  'UserModel',
  // 'PeopleModel',
  // 'ArticleModel',
])
