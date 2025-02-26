import bcrypt from 'bcryptjs' // 密碼加密
import { getDBPeople, postDBPeople } from '../../db/index.js';
import { utilSendErrorResponse } from '../middlewares/auth.js'

const handleGetPeople = async (req, res, next) => {
  try {
    const people = await getDBPeople()
    const users = people.reduce((acc, person) => {
      acc[person.email] = {
        password: person.password,
        username: person.username,
      };
      return acc;
    }, {});

    // people = [
    //   {
    //     _id: new ObjectId('67061e42995e4b47ce48ad7a'),
    //     email: 'aaa@gmail.com',
    //     password: '',
    //     username: '123'
    //   }
    // ]
    // 轉成
    // users = {
    //   'aaa@gmail.com': {
    //     password: '',
    //     username: '123'
    //   }
    // }
    // console.log(users);

    req.users = users;  // 將用戶資料附加到請求物件上，供後續中間件使用
    next();  // 繼續執行下一個中間件
  } 
  catch (error) {
    next(error);
  }
};
const handlePostPerson = async (req, res, next) => {
  const users = req.users
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return utilSendErrorResponse(res, 400, '錯誤請求：缺少或空的必要欄位')
  }

  if (users[email]) {
    return utilSendErrorResponse(res, 400, '用戶已存在')
  }

  try {
    // 1-1 加密密碼
    const hashPassword = await bcrypt.hash(password, 10)

    // 1-2 資料儲存
    // users[email] = {
    //   password: hashPassword,
    //   username,
    // }
    // {
    //   'aaa@gmail.com': {
    //     password: '',
    //     username: "123"
    //   },
    //   'ooopp42@gmail.com': {
    //     password: '$2b$10$W.UJ.CWCq1TVHzdCzVyusOKf0G3a0NIfJXKaaUlQaDB5MTVn.tkqK',
    //     username: 'curry'
    //   }
    // }
    // 儲存新用戶資料到資料庫
    const newUser = await postDBPeople({ email, password: hashPassword, username });
    if (!newUser) {
      return utilSendErrorResponse(res, 500, '伺服器錯誤: 無法儲存用戶資料')
    }

    req.newUser = newUser;  // 將新用戶資料傳遞到後續中間件
    next();  // 繼續執行下一個中間件
  } catch (error) {
    next(error);  
  }
};

export {
  handleGetPeople,
  handlePostPerson,
};
