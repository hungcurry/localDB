import mongoose from 'mongoose'
// 有顏色 console.log
import chalk from 'chalk'
import { getConfig } from './env/index.js'
import { envDbMap } from './databases.js'

const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isDev = nodeEnv === 'dev'
const mainConfig = envDbMap[nodeEnv] ?? envDbMap.dev
// 要連的資料庫
const DATABASE_NAME = mainConfig.dbName // 預設 devDB
const DATABASE_URL = mainConfig.uri // 預設 dev連結
// 是否註冊過
let isEventRegistered = false

/**
 * 建立 / 切換 MongoDB 連線
 * @param {string} dbURI - 目標連線字串（預設使用當前環境配置）
 * @param {string} database - 目標資料庫名稱（預設使用當前環境配置）
 *
 * 0：已斷線（Disconnected）
 * 1：已連線（Connected）
 * 2：連線中（Connecting）
 * 3：斷線中（Disconnecting）
 */
const connectDB = async (dbURI = DATABASE_URL, database = DATABASE_NAME) => {
  try {
    // 取得當前連線資料庫名稱（若尚未連線或未完成初始化則為 '未知'）
    const currentDB = mongoose.connection.db?.databaseName || '未知'

    /**
     * 1. readyState === 0：連線已完全斷開時，必須重新連線。
     * 2. currentDB !== database：目前連線的資料庫與目標資料庫不同時，必須切換。
     * 3. mongoose.connection.host !== dbURI：
     *    - mongoose.connection.host 為純主機域名（如 cluster0.xxx.mongodb.net）
     *    - dbURI 為完整協定字串（如 mongodb+srv://...）
     *    - 兩者比對確保不同目標叢集切換時必定觸發重連；在 Vercel 溫啟動環境下
     *      亦確保能強制跳脫狀態殘留，順利完成資料庫切換。
     */
    const needsNewConnection =
      mongoose.connection.readyState === 0 ||
      currentDB !== database ||
      mongoose.connection.host !== dbURI

    if (isDev) {
      console.log(chalk.cyan('------'))
      console.log(chalk.cyan('DB : connection.js'))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
      console.log(chalk.cyan(`當前連線資料庫 => ${currentDB}`))
    }

    if (needsNewConnection) {
      // 若連線中或已連線（狀態非 0），先切斷舊連線再切換
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
        if (isDev) {
          console.log(chalk.yellow(`已斷開舊資料庫: ${currentDB}`))
        }
      }

      // 建立並等待新連線完成
      await mongoose.connect(dbURI, { dbName: database })
      console.log(chalk.green(`✅ 已連接到資料庫: ${database}`))
    }

    // 監聽斷線事件（僅註冊一次）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('--- 資料庫連接已斷開 ---'))
      })
      mongoose.connection.on('error', (err) => {
        console.error(chalk.red('❌ 資料庫發生異常錯誤:'), err)
      })
      isEventRegistered = true
    }

    return mongoose
  }
  catch (err) {
    console.error(chalk.red('❌ 資料庫連接錯誤:'), err)
    throw err
  }
}

export { connectDB }
