import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs' // 密碼加密
import { v4 as uuidv4 } from 'uuid'
import { getConfig } from '../config/env/index.js'
import { signToken, verifyToken } from '../utils/generateJWT.js'

// 用於存儲 token 及其有效期
const tokens = {}
// 設置 token 的有效期（例如 1 小時）
const tokenExpiryTime = 60 * 60 * 1000
// ===================
// ... Utilities ...
// ===================
const utilLogRequest = (req) => {
  const clientFrom = req.headers['x-client-from']
  const authHeader = req.headers['authorization']
  console.log(`------`)
  console.log(`檔案: mid/auth.js`)
  // 如：http://127.0.0.1:8080/
  // console.log(req.headers);
  // 範例請求req網址: http://localhost:3000/api/users/get-users?room=555
  // console.log('請求協議:', req.protocol); // http
  console.log('請求方法:', req.method) // 请求方法（GET, POST 等）
  console.log('完整網址:', req.originalUrl) // 如：/api/users/get-users?room=555
  console.log('請求的路徑-基準路徑(根):', req.baseUrl) // 如：/api/users
  console.log('請求的路徑-子路径:', req.path) // 如：/get-users
  // console.log('查詢參數:', req.query); // 如：/?room=555 => { room: '555'}
  // console.log('路徑參數:', req.params); // 如：/:userId
  // console.log('來源頁面/本機網址:', req.headers.referer); // 如：http://127.0.0.1:8080/
  // console.log('遠端主機名稱:', req.hostname); // 如：localhost
  // console.log('IP 地址:', req.ip);  // 如：::1
  // console.log(`Client from: ${clientFrom}`);
  // console.log(`Client Token: ${authHeader}`);
  console.log(`------`)
}
const utilFormatDate = (timestamp) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  // 月份是從0開始的，所以需要+1
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
const utilSendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    statecode: statusCode,
    message,
  })
}
const utilGenerateToken = (req, res) => {
  // 生成 UUID token
  const token = uuidv4()
  // 設置 token 的過期時間
  const expiryTime = Date.now() + tokenExpiryTime
  // 儲存 token 及其有效期
  tokens[token] = expiryTime
  // 範例: tokens = { '3b51a19f-3b00-40d6-8148-9d9ac4b9160d': 1726134509341 }

  // 令牌過期時間
  // new Date(expiryTime).toISOString() 轉成 2024-09-13T04:05:51.269Z
  // time = 2024-09-13 12:08:39
  const time = utilFormatDate(new Date(expiryTime).toISOString())
  // const tokenData = { token, expiresAt: time};

  const tokenData = { token, expiresAt: time }

  res.json({
    status: 'success',
    message: '令牌生成成功',
    data: tokenData,
  })
}
// ===================
// ... common ...
// ===================
const checkText = (req, res, next) => {
  if (process.env.NODE_ENV === 'dev') {
    utilLogRequest(req)
  }
  next()
}
const checkAuthorization = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return utilSendErrorResponse(res, 401, 'Authorization 欄位未提供或格式錯誤')
  }
  const token = authHeader.split(' ')
  const expiryTime = tokens[token]

  if (!expiryTime) {
    return utilSendErrorResponse(res, 401, '無效的 Token')
  }

  if (Date.now() > expiryTime) {
    return utilSendErrorResponse(res, 401, 'Token 已過期')
  }

  if (req.path === '/validate') {
    return res.json({
      status: 'success',
      message: '令牌有效',
    })
  }

  next()
}
// ===================
// ... GET ...
// ===================
// checkClientFrom
const checkClientFrom = (req, res, next) => {
  // 適用於需要根據客戶端來源進行條件檢查的情況，
  // 但允許server沒有該標頭的請求繼續進行
  // 只在 API 被 Fetch 或其他工具調用時進行檢查
  const clientFrom = req.headers['x-client-from']
  // 如果 `X-Client-From` 頭存在，進行檢查
  if (clientFrom && clientFrom !== 'localDB') {
    return utilSendErrorResponse(res, 403, '禁止：無效的客戶端來源')
  }
  next()
}
// ===================
// ... POST/PUT/DELETE ...
// ===================
// checkContentTypeBody
const checkContentTypeBody = (req, res, next) => {
  const contentType = req.headers['content-type']
  if (contentType !== 'application/json') {
    return utilSendErrorResponse(res, 400, 'Bad Request: Content-Type 必須為 application/json')
  }

  // 檢查 req.body 是否為空或包含空字串
  const userData = req.body
  if (
    !userData ||
    Object.keys(userData).length === 0 ||
    Object.values(userData).some((value) => typeof value === 'string' && value.trim() === '')
  ) {
    return utilSendErrorResponse(res, 400, 'Bad Request: 缺少或空的請求主體或欄位')
  }

  next() // 繼續到下一個處理器
}
// ===================
// ... JWT Token ( Bearer ) ...
// ===================
// 取得密鑰
// const secretKey = getConfig('secret.jwtSecret')
// console.log(`auth` , secretKey)
// ------------------
// 註冊
// 帳號: ccc@gmail.com
// 密碼: 123
const checkJWTSignup = async (req, res) => {
  res.status(201).json({
    status: 'success',
    message: '註冊成功',
  })
}
// 登入
const checkJWTLogin = async (req, res) => {
  const { email, password } = req.body
  const users = req.users

  // 2-1 驗證用戶是否存在
  const user = users[email]
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: '用戶不存在',
    })
  }

  // 2-2 密碼驗證 密碼, 加密後的密碼
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: '登入錯誤,帳號或密碼錯誤',
    })
  }

  // 2-3 JWT 簽章
  // JWT 標準規範中，iat 和 exp 的值必須是以秒為單位的 UNIX 時間戳
  const payload = { email, username: user.username }
  // 生成 JWT token，設定過期時間為 1 小時
  // const token = jwt.sign(payload, secretKey, { expiresIn: '1h' })
  const token = signToken(payload)

  //console.log(token)
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  // 2-4 回應
  res.json({
    status: 'success',
    message: '登入成功',
    data: token,
  })
}
// 驗證 JWT
const checkJWTAuthorization = (req, res, next) => {
  const authHeader = req.headers['authorization']

  // 從 "Bearer <token>" 中分割提取 token
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
  console.log(`Received token: ${token}`)

  // 1. 驗證用戶有送token
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: '未登入，缺少認證令牌',
    })
  }

  try {
    // 2. 使用封裝好的 utils 進行驗證
    // jwt.verify 內部已包含過期(exp)檢查，不需手動比對 timestamp
    const decoded = verifyToken(token)

    // 3. 將解碼後的用戶資訊掛載到 req，讓後續的路由可以使用
    req.user = decoded
    // console.log('解碼後的用戶:', decoded)
    // console.log(users[decoded.email])

    // 4. 特殊路徑處理 (validate / profile)
    // 註：實務上建議這些路由在 Controller 回傳，但若要保留在 middleware 則如下：
    if (['/validate', '/profile'].includes(req.path)) {
      return res.json({
        status: 'success',
        message: '令牌有效',
        user: decoded,
      })
    }

    // 5. 驗證成功，繼續下一個 middleware
    next()
  }
  catch (error) {
    // 6. 錯誤處理：區分過期或其他錯誤
    const isExpired = error.message.includes('expired')

    return res.status(403).json({
      status: 'error',
      message: isExpired ? '令牌已過期' : '驗證錯誤',
      debug: process.env.NODE_ENV === 'dev' ? error.message : undefined,
    })
  }
}

export {
  utilGenerateToken,
  utilSendErrorResponse,
  checkText,
  checkClientFrom,
  checkAuthorization,
  checkContentTypeBody,
  // JWT Token
  checkJWTSignup,
  checkJWTLogin,
  checkJWTAuthorization,
}
