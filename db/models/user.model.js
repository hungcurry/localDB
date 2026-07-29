import mongoose from 'mongoose'
// const { Schema } = mongoose;

// 定義一個 schema
const userSchema = new mongoose.Schema(
  {
    // ~正常設定
    // 在 Mongoose 中，預設會自動產生 _id: Schema.Types.ObjectId，不需手動在欄位中宣告。
    // 不寫 讓他跑 預設 MongoDB 的標準 ObjectId 規範
    // ------------------
    // _id: {
    //   type: Number,
    //   required: true, // 不可為空值
    // },
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
  },
  // 第二個參數：放設定選項（如 timestamps）
  {
    // timestamps: true 會自動在資料庫中添加 createdAt 和 updatedAt 欄位，
    // 並在每次創建或更新文檔時自動管理這些欄位的值。
    timestamps: true,
    // __v: 0，這個是 Mongoose 預設的版本鍵，用來追蹤文件的版本。
    // 設定 versionKey: false 可以禁用這個功能，不會在資料庫中產生 __v 欄位。
    versionKey: false,
  },
)

// 創建模型
//                                模型名稱     資料結構   Collection資料表
const UserModel = mongoose.model('UserModel', userSchema, 'User')
export { UserModel }
