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
// 3. 打包成全域陣列，供 Seed 使用
// ==============================
// 這寫法：Model 通常直接綁死在預設的資料庫連線(單一資料庫)
export const allModels = [
  // === 無關連表 ===
  UserModel,
  PeopleModel,
  ArticleModel,
  // === 父表 (主表) ===
  // === 子表 (從表) ===
]

// ==============================
// 4. 多資料庫 產生清空使用
// ==============================
// *多個資料庫 用這種 藍圖 寫法
export const allEntities = [
  {
    name: 'User',
    schema: userSchema,
  },
  {
    name: 'People',
    schema: peopleSchema,
  },
  {
    name: 'Article',
    schema: articleSchema,
  },
]
// 開發模式本地開發（isDev）Entity 白名單（保留手動測試資料）
export const keepEntities = new Set([
  'User',
  // 'People',
  // 'Article',
])
