import mongoose from 'mongoose'
// 有顏色 console.log
import chalk from 'chalk'
import { getConfig } from './env/index.js'
import { initDatabases, envDbMap } from './databases.js'

const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isDev = nodeEnv === 'dev'
const mainConfig = envDbMap[nodeEnv] ?? envDbMap.dev
// 專注建立資料庫主連線
const DATABASE_NAME = mainConfig.dbName // 預設 devDB
const DATABASE_URL = mainConfig.uri // 預設 dev連結
// 是否註冊過
let isEventRegistered = false

/**
 * 建立/切換全域 MongoDB 主連線
 * @param {string} dbURI - MongoDB 連線字串 (例如 mongodb://localhost:27017)
 * @param {string} database - 目標資料庫名稱
 *
 * 0：已斷線（Disconnected）
 * 1：已連線（Connected）
 * 2：連線中（Connecting）
 * 3：斷線中（Disconnecting）
 */
const connectDB = async (dbURI = DATABASE_URL, database = DATABASE_NAME) => {
  try {
    // 意思是： 「確定正在連線狀態」
    const isConnected = mongoose.connection.readyState === 1
    const currentDB = mongoose.connection.db?.databaseName
    // 1. 檢查：如果已經連上線，而且連的就是「當前資料庫」，就不用重複連線，直接結束
    if (isConnected && currentDB === database) {
      return mongoose
    }

    if (isDev) {
      console.log(chalk.cyan('------'))
      console.log('檔案 : connection.js')
      console.log(chalk.cyan(`當前資料庫 => ${currentDB || '未連線'}`))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
      // 當前資料庫 => devDB
      // 目標切換資料庫 => prodDB
      // 因為不一樣,這樣就重新段開連線,切換到 prodDB
    }

    // 2. 門鈴警報器：只在第一次設定，
    // 負責監聽「斷線」與「出錯」訊息（避免重複註冊）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log('--- 資料庫連接已斷開 ---')
      })
      mongoose.connection.on('error', (err) => {
        console.error(chalk.red('❌ 資料庫發生異常錯誤:'), err)
      })
      isEventRegistered = true
    }

    // 3. 若已經連線但資料庫不同，先切斷舊連線再連新的
    if (mongoose.connection.readyState !== 0) {
      // 意思是： 「只要『不是完全斷線』狀態，通通算進來」
      // 包含狀態： 1（已連線）、2（連線中）、3（斷線中）。
      await mongoose.disconnect()
      if (isDev) {
        console.log(chalk.yellow(`已斷開舊資料庫連線: ${currentDB}`))
      }
    }

    // 4. 建立/切換至目標資料庫連線
    const instance =await mongoose.connect(dbURI, {
      dbName: database,
    })

    console.log(chalk.green(`✅ 已成功連接到資料庫: ${database}`))
    return instance
  }
  catch (err) {
    console.error(chalk.red('❌ 資料庫連接錯誤:'), err)
    throw err
  }
}

export { connectDB }
