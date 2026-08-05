import { UserModel } from '../../models/user.model.js'

// #region 資料
// DB Users found: [
//   {
//     _id: new ObjectId('69faaa4ba76cf95d3100f865'),
//     name: '本機-開發環境',
//     age: '10'
//   },
//   {
//     _id: new ObjectId('69fae6348045ffd8363bbdc0'),
//     name: 'curry66',
//     age: 66
//   }
// ]
// #endregion

// 查詢用戶數據
const handleAggregate = async () => {
  return await UserModel.aggregate([
    {
      $project: { __v: 0 },
    },
  ])
}
// 查詢文檔
const getDBUsers = async () => {
  try {
    // 模擬錯誤1 註解打開
    // const err = new Error('Validation failed');
    // err.name = 'ValidationError';
    // throw err;

    // 模擬錯誤2 註解打開
    // const users = await UserModel.find({ _id: 'invalid_id' });

    const users = await handleAggregate()

    if (process.env.NODE_ENV === 'dev') {
      console.log('MongoDB')
    }

    if (users.length === 0) {
      console.log('DB 沒有 users 資料')
      return [] // ✅ 正常回傳
    }

    console.log('DB Users found:', users)
    return users
  } 
  catch (err) {
    console.error('Error finding users:', err)
    throw err // 只有真正錯誤才丟
  }
}

export { getDBUsers }
