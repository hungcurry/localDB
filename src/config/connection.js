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
 * 建立 / 切換全域 MongoDB 主連線
 * @param {string} dbURI - 目標連線字串（預設讀取環境變數）
 * @param {string} database - 目標資料庫名稱（預設讀取環境變數）
 *
 * 0：已斷線（Disconnected）
 * 1：已連線（Connected）
 * 2：連線中（Connecting）
 * 3：斷線中（Disconnecting）
 */
const connectDB = async (dbURI = DATABASE_URL, database = DATABASE_NAME) => {
  try {
    // 取得當前已連線的資料庫名稱（未連線或未水合時回傳 null）
    const currentDB = mongoose.connection.db?.databaseName ?? null
    const isConnected = mongoose.connection.readyState === 1

    // 1. 若已經連線，且當前資料庫與目標一致，直接沿用全域連線（跳過重複連線）
    if (isConnected && currentDB === database) {
      return mongoose
    }

    if (isDev) {
      console.log(chalk.cyan('------'))
      console.log(chalk.cyan('DB : connection.js'))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
      console.log(chalk.cyan(`當前連線資料庫 => ${currentDB || '未連線'}`))
    }

    // 2. 斷線與錯誤事件監聽（僅註冊一次）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('--- 資料庫連接已斷開 ---'))
      })
      mongoose.connection.on('error', (err) => {
        console.error(chalk.red('❌ 資料庫發生異常錯誤:'), err)
      })
      isEventRegistered = true
    }

    // 3. 若非完全斷線狀態（連線中、已連線、斷線中），且目標資料庫不同，先切斷舊連線
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      if (isDev) {
        console.log(chalk.yellow(`已斷開舊資料庫連線: ${currentDB || '未知'}`))
      }
    }

    // 4. 建立新的全域連線（回傳全域 mongoose，確保後續 mongoose.model 與 initCollections 運作正常）
    const instance = await mongoose.connect(dbURI, {
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
