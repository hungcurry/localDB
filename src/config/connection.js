import mongoose from 'mongoose'
import chalk from 'chalk'
import { getConfig } from './env/index.js'
import { envDbMap } from './databases.js'

const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isDev = nodeEnv === 'dev'
const mainConfig = envDbMap[nodeEnv] ?? envDbMap.dev

// 預設資料庫配置
const DATABASE_NAME = mainConfig.dbName
const DATABASE_URL = mainConfig.uri

// 確保全域事件只註冊一次
let isEventRegistered = false

/**
 * 建立 / 切換 MongoDB 連線
 * @param {string} dbURI - 目標連線字串（預設使用當前環境配置）
 * @param {string} database - 目標資料庫名稱（預設使用當前環境配置）
 */
const connectDB = async (dbURI = DATABASE_URL, database = DATABASE_NAME) => {
  try {
    // 取得當前連線資料庫名稱
    const currentDB = mongoose.connection.db?.databaseName || '未知'

    // 依第二份邏輯：檢查是否需要切換連線（完全斷線、DB名稱不同、或連線目標主機不同）
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
      // 若連線中或已連線，先切斷舊連線再切換
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
