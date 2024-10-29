import { UserModel } from '../../models/user.model.js';
// 更新文檔
const updateDBUser = async (query, update) => {
  try {
    const result = await UserModel.updateOne(query, { $set: update });
    console.log('DB User updated');
    return result; // 返回更新的結果
  } catch (err) {
    console.error('Error updating user:', err);
    return null; // 在錯誤的情況下返回 null 或者可以拋出錯誤
  }
}
export { updateDBUser }
