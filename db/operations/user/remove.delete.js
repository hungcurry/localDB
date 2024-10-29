import { UserModel } from '../../models/user.model.js';
// 刪除文檔
const deleteDBUser = async(query) => {
  try {
    const result = await UserModel.deleteOne(query);
    console.log('DB User deleted');
    return result; // 返回刪除的結果
  } catch (err) {
    console.error('Error deleting user:', err);
    return null; // 在錯誤的情況下返回 null 或者可以拋出錯誤
  }
}
export { deleteDBUser }
