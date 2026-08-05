// #region 原生node方式
// ------------------------------
// import headers  from './header.js';
// import { getUsers, postUser, updateUser, deleteUser } from '../db/index.js';

// const handleGetUsers = async(req, res) => {
//   try {
//     const users = await getUsers();
//     successHandle(res, users);
//   }
//   catch (err) {
//     errorHandle(res, 500, 'Internal Server Error');
//   }
// }
// const handlePostUser = async(req, res) =>{
//   let body = '';
//   req.on('data', chunk => {
//     body += chunk.toString();
//   });
//   req.on('end', async () => {
//     try {
//       const userData = JSON.parse(body);
//       const newUser = await postUser(userData);
//       res.writeHead(201, headers);
//       res.end(JSON.stringify(newUser));
//     }
//     catch (err) {
//       errorHandle(res, 500, 'Internal Server Error');
//     }
//   });
// }
// const handlePutUser= async(req, res) =>{
//   const userId = req.url.split('/')[2];
//   let body = '';
//   req.on('data', chunk => {
//     body += chunk.toString();
//   });
//   req.on('end', async () => {
//     try {
//       const updateData = JSON.parse(body);
//       const result = await updateUser({ _id: userId }, updateData);
//       if (result.matchedCount === 0) {
//         errorHandle(res, 404, 'User not found');
//       } else {
//         successHandle(res, result);
//       }
//     } catch (err) {
//       errorHandle(res, 500, 'Internal Server Error');
//     }
//   });
// }
// const handleDeleteUser= async(req, res)=> {
//   const userId = req.url.split('/')[2];
//   try {
//     const result = await deleteUser({ _id: userId });
//     if (result.deletedCount === 0) {
//       errorHandle(res, 404, 'User not found');
//     } else {
//       successHandle(res, 'User deleted');
//     }
//   } catch (err) {
//     errorHandle(res, 500, 'Internal Server Error');
//   }
// }
// const successHandle = (res, data) => {
//   res.writeHead(200, headers);
//   res.write(JSON.stringify({
//     status: 'success',
//     data: data
//   }));
//   res.end();
// }
// const errorHandle = (res, statusCode, message) => {
//   res.writeHead(statusCode, headers);
//   res.write(JSON.stringify({
//     status: 'false',
//     message: message
//   }));
//   res.end();
// }

// export {
//   successHandle,
//   errorHandle,
//   handleGetUsers,
//   handlePostUser,
//   handlePutUser,
//   handleDeleteUser,
// };
// ------------------------------
// #endregion

// #region express方式
import { getDBUsers, postDBUser, updateDBUser, deleteDBUser } from '../services/index.js'
// 引入 logger
import { createLogger } from '../utils/logger.js'
import { handleError, appError } from '../middlewares/errorHandler.js'

// *logger參數順序：level, message, payload
const logger = createLogger('userController')

// 建立對照表：Key 是前端傳來的字串，Value 是對應的資料庫啟動函式
const collectionMap = {
  User: getDBUsers,
  // AdminUserData: getDBAdminUser,
  // XXXX: getDBXXXX,
}

// ===================
// ... Collection ...
// ===================
// ~如果是用 !Get user 第二種 取資料POST 方式的話
const handleGetByCollection = async (req, res, next) => {
  try {
    // ~如果是用 !Get user 第二種 取資料POST 方式的話
    // 就會在這裡拿到Collection,然後去 對應的Collection裡面取資料
    const { targetCollection } = req
    // ~console.log(`targetCollection:`, targetCollection)
    // collection: 'AdminUserData' 或 User

    // 檢查對照表是否存在該 Key
    const getModelFn = collectionMap[targetCollection]

    if (!getModelFn) {
      return res.status(400).json({
        success: false,
        message: `找不到對應的集合: ${targetCollection}`,
      })
    }

    // 執行函式取得 Model 並取資料
    const users = await getDBUsers()
    res.status(200).json({
      status: 'success',
      statecode: 200,
      data: users,
    })
  } 
  catch (err) {
    // 傳遞錯誤給錯誤處理中間件
    next(err)
  }
}
// ===================
// ... 正常方式 ...
// ===================
/** *!新寫法 
 * * Express 5 throw會接住錯誤
 * 不需要 try-catch 了，直接 throw 就好，
 * Express 5 會自動捕捉到錯誤並傳遞給全域錯誤處理器
 * ------------

  const handleGetUsers = async (req, res, next) => {
    // const users = await getDBUsers()

    let users = null
    if (!users) {
      // 直接 throw，Express 5 會接住
      throw new appError(400, '傳給前端看的訊息', '伺服端的message')
    }

    res.status(200).json({
      status: 'success',
      statecode: 200,
      data: users,
    })
  }

 */


/** *舊寫法 
 *  * Express 4 需要 try-catch 包裹，
 *  並且在 catch 裡面呼叫 next(err) 傳遞錯誤給全域處理器
 */
const handleGetUsers = async (req, res, next) => {
  try {
    const users = await getDBUsers()

    // 🔥 人工製造錯誤,錯誤只會傳到server端,開發時候看到
    // throw new Error('Database connection timeout')

    // 訊息測試
    logger.setLog('info', 'User list successfully', { userCount: users.length })
    // logger.setLog('debug', 'Debug info', { rawData: 'some-internal-info' })
    // logger.setLog('warn', 'get list of tasks to done', { userCount: users.length })

    // 不寫.status(200),會預設帶入 200 "OK"。
    res.status(200).json({
      status: 'success',
      statecode: 200,
      data: users,
    })
  } 
  catch (err) {
    // ✅ 方式 2：錯誤捕捉 (error) -> 終端顯示紅色
    // 記錄 Log (給伺服器管理員看)
    logger.setLog('error', 'failed to get user list', { err: err.message })

    // * 自訂義錯誤處理
    // handleError({
    //   res,
    //   statusCode: 400,
    //   message: '無法取得資料',
    //   err: err
    // })


    // * 將錯誤丟給全域處理器
    // ~傳遞錯誤給錯誤處理中間件
    // ~自訂錯誤訊息，讓客戶端知道發生了什麼錯誤
    // err.statusCode = 400
    // err.clientMessage = '無法取得待辦清單'
    // next(err)

    // 或 
    // ~使用 appError 來創建一個新的錯誤物件，並傳遞給全域處理器
    // ~順序：statusCode, clientMessage, message( 原始錯誤訊息, 給開發者看的 )
    const AppError = new appError(400, '無法取得待辦清單', err.message)
    next(AppError)
  }
}
const handlePostUser = async (req, res, next) => {
  try {
    const userData = req.body
    console.log(`server 新增Data`, userData)

    const newUser = await postDBUser(userData)
    res.status(201).json({
      status: 'success',
      statecode: 201,
      data: newUser,
    })
  } 
  catch (err) {
    next(err)
  }
}
const handlePutUser = async (req, res, next) => {
  const userId = req.params.id // 獲取 URL 中的 user ID
  try {
    const updateData = req.body
    console.log(`server 更新Data `, updateData)

    const result = await updateDBUser({ _id: userId }, updateData)
    if (result.matchedCount === 0) {
      res.status(404).json({
        status: 'false',
        statecode: 404,
        message: 'User not found',
      })
    } else {
      res.status(200).json({
        status: 'success',
        statecode: 200,
        message: 'Updated successfully',
      })
    }
  } 
  catch (err) {
    next(err)
  }
}
const handleDeleteUser = async (req, res, next) => {
  const userId = req.params.id // 獲取 URL 中的 user ID
  try {
    const result = await deleteDBUser({ _id: userId })
    if (result.deletedCount === 0) {
      res.status(404).json({
        status: 'false',
        statecode: 404,
        message: 'User not found',
      })
    } else {
      res.status(200).json({
        status: 'success',
        statecode: 200,
        message: 'User deleted successfully',
      })
    }
  } 
  catch (err) {
    next(err)
  }
}

export { handleGetUsers, handlePostUser, handlePutUser, handleDeleteUser , handleGetByCollection }
// ------------------------------
// #endregion
