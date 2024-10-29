import { UserModel } from '../../models/user.model.js';
// 插入一條新文檔
const postDBUser = async(userData) => {
  try {
    const newUser = new UserModel(userData);
    await newUser.save();
    console.log('DB User saved:', newUser);
    return newUser; // 返回新保存的用戶
  } catch (err) {
    console.error('Error saving user:', err);
    return null; // 在錯誤的情況下返回 null 或者可以拋出錯誤
  }
}
export { postDBUser }
