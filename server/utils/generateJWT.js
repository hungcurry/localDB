// 安裝指令：npm install jsonwebtoken
import jwt from 'jsonwebtoken'
import { getConfig } from '../config/index.js'

// 取得環境設定
const JWT_SECRET = getConfig('secret.jwtSecret')
const JWT_EXPIRES_IN = getConfig('secret.jwtExpiresDay')

export const signToken = (payload) => {
  // 1. 防呆機制：確保密鑰存在，避免簽發出無效或不安全的 Token
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in config')
  }

  // 2. 設定簽發選項
  const options = {
    expiresIn: JWT_EXPIRES_IN || '1d', // 若設定檔不存在，預設一天過期
    algorithm: 'HS256', // 使用 HS256 對稱加密演算法
  }

  // 3. 產生 JWT (不含 Bearer 前綴)
  return jwt.sign(payload, JWT_SECRET, options)
}
export const verifyToken = (token) => {
  try {
    // 驗證並回傳解碼後的資料
    return jwt.verify(token, JWT_SECRET)
  } 
  catch (error) {
    // 統一錯誤處理邏輯
    throw new Error(error.message || 'Invalid or expired token')
  }
}
