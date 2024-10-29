import mongoose from 'mongoose';
// const { Schema } = mongoose;

// 定義一個 schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true }
});

// 創建模型
//                                模型名稱     資料結構   Collection資料表
const UserModel = mongoose.model('UserModel', userSchema , 'User');
export { UserModel };
