import express from 'express'
import { handleAsyncError, appError } from '../middlewares/errorHandler.js'
const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

// #region
// // 錯誤
// const errorController = async function (req, res, next) {
//   a // 未定義
//   res.send({
//     message: '錯誤狀態',
//   })
// }

// // 正常
// const someController = async function (req, res, next) {
//   res.send({
//     message: '正常狀態',
//   })
// }
// #endregion

// 錯誤
const errorController = async function (req, res, next) {
  let obj = null
  const mockGetUserData = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(obj)
      }, 1000)
    })
  }

  // 等待 1 秒取得資料
  const data = await mockGetUserData()
  const AppError = new appError(400, '傳給前端看的訊息', '伺服端的message')
  if (!data) {
    throw AppError
  }
}

// 正常
const someController = async function (req, res, next) {
  let obj = { name: 'curry' }
  const mockGetUserData = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(obj)
      }, 1000)
    })
  }

  // 等待 1 秒取得資料
  const data = await mockGetUserData()

  const AppError = new appError(400, '傳給前端看的訊息', '伺服端的message')
  if (!data) {
    throw AppError
  }

  res.send({
    message: '正常狀態',
    statusCode: 200,
    data,
  })
}

/** Express 4 / 5 async error 處理方式
 * ------------------------------------
 * Express 4：
 * async error ❌ 不保證會被接住
 *  要用手動使用 try...catch 去接..
 * ❗ 可能 crash / unhandled rejection
 * ----------------------
 * Express 5：
 * async error ✔ 內建 catch
 * ❗ 幾乎不會因 async error 掛掉
 * 結論: Express5 以後不用 handleAsyncError 去接
 *
 * *使用方式：
 * ~寫法 A：在路由定義時包
 * router.get('/', Asyncwrap(m1), Asyncwrap(m2), Asyncwrap(controller))
 *
 * ~寫法 B：在定義函式時就包好 (更推薦，乾淨很多)
 * const checkJWT = Asyncwrap(async (req, res, next) => { ... })
 * const handlePostUser = Asyncwrap(async (req, res) => { ... })
 *
 * router.get('/', checkJWT, handlePostUser)
 *
 */


/** handleAsyncError 原理
 * ------------------------------------
 * 
    原本
    ```jsx
    // router/normal.js
    import { someController } from '../controllers/someController.js'
    router.get('/normal', someController)


    // controllers/someController.js
    // 每個路由都要寫一次，非常冗長
    const someController = async function (req, res, next) {
      try {
        const data = await someDatabaseTask(); // 假設這裡出錯了
        res.send({ message: '成功', data });
      } 
      catch (err) {
        // 你必須手動傳給 next，不然 Express 不知道出錯了
        next(err); 
      }
    }
    export { someController }
    ```


    使用 handleAsyncError後
    ```jsx
    // router/normal.js
    import { handleAsyncError } from '../middlewares/errorHandler.js'
    import { someController } from '../controllers/someController.js'
    router.get('/normal', handleAsyncError(someController))


    // middlewares/errorHandler.js
    const handleAsyncError = (asyncFn) => {
      return async (req, res, next) => {
        try {
          await asyncFn(req, res, next)
        } 
        catch (err) {
          if (!err) {
            err = new Error('Unknown Error')
          }

          err.statusCode ??= 500
          err.customMessage ??= '伺服器發生錯誤'

          next(err)
        }
      }
    }
    export { handleAsyncError }

    // controllers/someController.js
    // Controller 變得超級乾淨，完全不用寫 try...catch
    const someController = async (req, res, next) => {
      const data = await someDatabaseTask(); 
      res.send({ message: '成功', data });
    }
    export { someController }
    ```
 * 
*/


// 獨立 controller
// 錯誤捕捉 => 回傳 400
// http://localhost:3000/error
router.get('/', handleAsyncError(errorController))

// 不捕捉錯誤 伺服器會掛掉
// http://localhost:3000/error/no-catch
router.get('/no-catch', errorController)

// 能正確運作
// http://localhost:3000/error/normal
router.get('/normal', handleAsyncError(someController))

export default router
