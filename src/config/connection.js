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
 * 建立 / 切換 MongoDB 全域連線
 * @param {string} dbURI - 目標連線字串（預設使用當前環境配置）
 * @param {string} database - 目標資料庫名稱（預設使用當前環境配置）
 */
const connectDB = async (dbURI = DATABASE_URL, database = DATABASE_NAME) => {
  try {
    // 取得目前連線中的資料庫名稱（未連線時設為 '未知'）
    const currentDB = mongoose.connection.db?.databaseName || '未知'

    /**
     * 【切換判定核心】
     * 1. readyState === 0：尚未連線，必須建立連線。
     * 2. currentDB !== database：目前連線的 DB 與目標 DB 不同，必須重新切換連線。
     * 3. currentDB === '未知'：連線物件尚未水合完成，確保不會誤跳過連線。
     */
    const needsNewConnection =
      mongoose.connection.readyState === 0 ||
      currentDB !== database ||
      currentDB === '未知'

    if (isDev) {
      console.log(chalk.cyan('------'))
      console.log(chalk.cyan('DB : connection.js'))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
      console.log(chalk.cyan(`當前連線資料庫 => ${currentDB}`))
    }

    // 當需要建立或切換連線時
    if (needsNewConnection) {
      // 若目前並非處於完全斷線狀態（1: 連線, 2: 連線中, 3: 斷線中），先徹底切斷舊連線
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
        if (isDev) {
          console.log(chalk.yellow(`已斷開舊資料庫: ${currentDB}`))
        }
      }

      // 重新建立全域連線至目標資料庫
      await mongoose.connect(dbURI, { dbName: database })
      console.log(chalk.green(`✅ 已連接到資料庫: ${database}`))
    }

    // 斷線與錯誤監聽（全域僅掛載一次）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('--- 資料庫連接已斷開 ---'))
      })
      mongoose.connection.on('error', (err) => {
        console.error(chalk.red('❌ 資料庫發生異常錯誤:'), err)
      })
      isEventRegistered = true
    }

    // 回傳全域 mongoose 實例，確保相容後續 mongoose.model 與 initCollections 操作
    return mongoose
  }
  catch (err) {
    console.error(chalk.red('❌ 資料庫連接錯誤:'), err)
    throw err
  }
}

export { connectDB }
