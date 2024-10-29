import mongoose from 'mongoose';
// const { Schema } = mongoose;

// 定義一個 schema
const peopleSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },  // 電子郵件作為唯一字段
  password: { type: String, required: true },             // 密碼
  username: { type: String, required: true },             // 用戶名
});

// 創建模型
//                                    模型名稱      資料結構   Collection資料表
const PeopleModel = mongoose.model('PeopleModel', peopleSchema , 'People');
export { PeopleModel };
