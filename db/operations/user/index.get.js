import { UserModel } from '../../models/user.model.js';

// 查詢用戶數據
const aggregateUsers = async () => {
  return await UserModel.aggregate([
    {
      $project: { __v: 0 }
    }
  ]);
};

// 查詢文檔
const getDBUsers = async () => {
  try {
    // 模擬錯誤1 註解打開
    // const err = new Error('Validation failed');
    // err.name = 'ValidationError';
    // throw err;

    // 模擬錯誤2 註解打開
    // const users = await UserModel.find({ _id: 'invalid_id' });

    const users = await aggregateUsers();
    if (process.env.NODE_ENV === 'dev') {
      console.log('MongoDB');
    }
    if (users.length > 0) {
      console.log('DB Users found:', users);
    }else {
      throw new Error('DB No users found'); 
    }
    return users;
  } catch (err) {
    console.error('Error finding users:', err);
    throw err;
  }
};

export { getDBUsers };
