import server from './server.js'
import db from './db.js'
import secret from './secret.js'

const config = {
  server,
  db,
  secret,
}

export const getConfig = (path) => {
  if (!path || typeof path !== 'string') {
    throw new Error('[ConfigManager] Path must be a non-empty string')
  }

  // 將 'secret.jwtSecret' 分解為 ['secret', 'jwtSecret']
  const keys = path.split('.')

  // 利用 reduce 深度查找物件屬性
  const finalValue = keys.reduce((prev, curr) => {
    // 檢查目前層級是否存在且包含該屬性
    if (prev && typeof prev === 'object' && curr in prev) {
      return prev[curr]
    }

    // 若查找中斷，拋出具體錯誤協助除錯
    throw new Error(`[ConfigManager] Path "${path}" not found (lost at "${curr}")`)
  }, config)

  return finalValue
}
