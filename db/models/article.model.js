import mongoose from 'mongoose'
// const { Schema } = mongoose

// #region 原始資料
// [
//   {
//     "title": "探索 Vue 3 的 Composition API 核心優勢",
//     "content": "這篇文章深入探討了 Vue 3 的 Setup 語法糖與 Composable 的實務應用...",
//     "status": "published"
//   },
//   {
//     "title": "TypeScript 嚴格模式下的高階型別實戰",
//     "content": "如何在實務專案中完全捨棄 any，改用泛型與 Utility Types 建立強型別架構...",
//     "status": "published"
//   },
//   {
//     "title": "Vite 專案打包優化與快取策略指南",
//     "content": "探討如何優化 Vite 的模組分塊 (Code Splitting)，提升前端首頁載入速度...",
//     "status": "published"
//   },
//   {
//     "title": "Node.js 與 Mongoose 效能優化的大坑",
//     "content": "為什麼你的 countDocuments 那麼慢？你需要知道的索引與 lean() 的加速秘密...",
//     "status": "published"
//   },
//   {
//     "title": "使用 Express 5 建立現代化商務 API 後端",
//     "content": "這是一篇關於如何整合 Express 5 新特性，優化全域錯誤處理機制的開發筆記...",
//     "status": "draft"
//   },
//   {
//     "title": "Pinia 狀態管理在大型前端專案的切分藝術",
//     "content": "如何避免把 Pinia 當成全域變數亂塞？良好的模組化劃分與訂閱監聽實務...",
//     "status": "published"
//   }
// ]
// #endregion

// 定義一個 schema
const articleSchema = new mongoose.Schema(
  {
    // ~正常設定
    // 在 Mongoose 中，預設會自動產生 _id: Schema.Types.ObjectId，不需手動在欄位中宣告。
    // 不寫 讓他跑 預設 MongoDB 的標準 ObjectId 規範
    // ------------------
    // _id: {
    //   type: Number,
    //   required: true, // 不可為空值
    // },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    // 限制這個欄位只能存入陣列裡設定的這幾種字串，並且預設值為 'draft'。
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  // 第二個參數：放設定選項（如 timestamps）
  {
    collection: 'Article',
    // timestamps: true 會自動在資料庫中添加 createdAt 和 updatedAt 欄位，
    // 並在每次創建或更新文檔時自動管理這些欄位的值。
    timestamps: true,
    // __v: 0，這個是 Mongoose 預設的版本鍵，用來追蹤文件的版本。
    // 設定 versionKey: false 可以禁用這個功能，不會在資料庫中產生 __v 欄位。
    versionKey: false,
  },
)

// *在 Schema 建立假排序小抄（後台加速用）
// *Controller 層 (.sort) 下達真正要吐給前端畫面的排序（畫面呈現用）
// 建立索引優化排序與搜尋效能
// 時間排序 : -1 代表由大到小（新到舊）排列。
articleSchema.index({ createdAt: -1 })
// 文字排序 : 1 代表由小到大（舊到新）排列。
articleSchema.index({ title: 1 })

// 創建模型
//                                     模型名稱        資料結構
const ArticleModel = mongoose.model('ArticleModel', articleSchema)
export { ArticleModel }
