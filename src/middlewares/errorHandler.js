import { getConfig } from '../config/env/index.js'
const nodeEnv = getConfig('server.nodeEnv')

/** 1. 自定義錯誤處理 
 * 
 *  * 使用方式：
 *  import { handleError } from '../middlewares/errorHandle.js'
 *  try {
 *    ....
 *  }
 *  catch (error: any) {
      handleError({ 
        res, 
        statusCode: 400, 
        message: '無法取得資料', 
        err: error 
      });
    }
 * 
 */
const handleError = ({ res, statusCode = 400, message = '無法取得資料', err }) => {
  const response = {
    status: 'error',
    statusCode,
    message,
  }

  // 如果有傳入 err，則附加原始錯誤訊息
  if (err) {
    response.error = err.message || err
  }

  return res.status(statusCode).json(response)
}

/** 2. 404 路由處理
 *
 *  * 使用方式：
 *  import { handleNotFound } from '../server/middlewares/errorHandler.js'
 *  app.use(handleNotFound)
 *
 */
const handleNotFound = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `API Not Found 奇怪？ 找不到路徑: ${req.originalUrl}`,
  })
}

/** 3. 捕捉 異步函數 路由處理
 *
 * * 使用方式：
 * import { handleAsyncError } from '../middlewares/errorHandle.js'
 *
 * ~寫法 A：在路由定義時包
 * router.get('/', Asyncwrap(m1), Asyncwrap(m2), Asyncwrap(controller))
 *
 * ~寫法 B：在定義函式時就包好 (更推薦，乾淨很多)
 * const checkJWT = Asyncwrap(async (req, res, next) => { ... })
 * const handlePostUser = Asyncwrap(async (req, res) => { ... })
 *
 * ~router.get('/', checkJWT, handlePostUser)
 *
 * * handleAsyncError 的作用：
 * 主要功能：它用來捕捉異步函數（例如 async 和 await 函數）中的錯誤。
 * Express 本身無法自動捕捉非同步錯誤，
 * 所以我們需要 catchError 來捕捉這些錯誤，如果不用 就是每個fun都要寫 try catch
 *
 */
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

/** 4. 捕捉 全域錯誤處理 中間件
 *
 * * 使用方式：
 * import { handleGlobalError } from '../middlewares/errorHandle.js'
 * app.use(handleGlobalError)
 *
 * * handleGlobalError 的作用：
 * 主要功能：作為 Express 應用的錯誤處理中間件，
 * 用來處理從路由或中間件傳遞過來的所有錯誤。
 * 它會依據錯誤的類型或狀態，回應不同的 HTTP 狀態碼和錯誤訊息
 * 讓用戶能夠知道發生了什麼錯誤。
 *
 */
const handleGlobalError = (err, req, res, next) => {
  // 是否為開發環境 production 或 dev
  const isDev = nodeEnv === 'dev'
  // 狀態碼
  const statusCode = err.statusCode || err.status || 500
  // clientMessage 給前端看的
  let clientMessage = err.clientMessage || err.message || '伺服器內部錯誤'

  // 正式環境隱藏 500 真實錯誤
  if (!isDev && statusCode >= 500) {
    clientMessage = '系統發生異常，請稍後再試'
  }

  // 簡化 stack
  const simplifiedStack = err.stack
    ? err.stack
        .split('\n')
        .slice(0, 3)
        .map((line) => line.trim())
        .join('\n')
    : 'No stack trace available'

  // 開發環境錯誤日誌
  // if (isDev) {
  //   console.error('================ ERROR ================')
  //   console.error(`[isDev]: ${isDev}`)
  //   console.error(`[名稱]: ${err.name}`)
  //   console.error(`[狀態code]: ${statusCode}`)
  //   console.error(`[自訂]: ${err.clientMessage || '無自訂訊息'}`)
  //   console.error(`---- detail ----`)
  //   console.error(`[訊息]: ${err.message}`)
  //   console.error(`[堆疊]:\n${err.stack}`)
  //   console.error('=======================================')
  // }

  // response
  const response = {
    status: 'error',
    statusCode,
    message: clientMessage,
  }

  // 開發環境才附加 detail
  if (isDev) {
    response.detail = {
      name: err.name,
      message: err.message,
      stack: simplifiedStack,
    }
  }

  return res.status(statusCode).json(response)
}
class appError extends Error {
  // 將參數順序固定好：1.狀態碼, 2.給前端的中文, 3.原始錯誤訊息
  constructor(statusCode = 500, clientMessage = '系統發生異常', message = null) {
    // 傳給父類別 Error 的 message，優先用原始錯誤
    super(message || clientMessage)

    this.name = this.constructor.name
    this.statusCode = statusCode
    this.clientMessage = clientMessage

    Error.captureStackTrace(this, this.constructor)
  }
}

export { handleError, handleNotFound, handleAsyncError, handleGlobalError, appError }
