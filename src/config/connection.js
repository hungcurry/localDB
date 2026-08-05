import mongoose from 'mongoose'
// 有顏色 console.log
import chalk from 'chalk'

let isEventRegistered = false

/**
 * 建立/切換全域 MongoDB 主連線
 * @param {string} dbURI - MongoDB 連線字串 (例如 mongodb://localhost:27017)
 * @param {string} database - 目標資料庫名稱
 */
const connectDB = async (dbURI, database) => {
  try {
    const isConnected = mongoose.connection.readyState === 1
    const currentDB = mongoose.connection.db?.databaseName
    const currentHost = mongoose.connection.host

    // 1. 如果已連線，且 URI 與資料庫名稱完全一致，直接返回，不重複處理
    if (isConnected && currentDB === database && currentHost === dbURI) {
      return mongoose
    }

    if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
      console.log(chalk.cyan('------'))
      console.log(chalk.cyan('DB : connection.js'))
      console.log(chalk.cyan(`目前資料庫 => ${currentDB || '未連線'}`))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
    }

    // 2. 註冊全局斷開/錯誤監聽（僅一次）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('⚠️ 資料庫連接已斷開'))
      })
      mongoose.connection.on('error', (err) => {
        console.error(chalk.red('❌ 資料庫發生異常錯誤:'), err)
      })
      isEventRegistered = true
    }

    // 3. 若已經連線但資料庫不同，先切斷舊連線再連新的
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
        console.log(chalk.yellow(`已斷開舊資料庫連線: ${currentDB}`))
      }
    }

    // 4. 建立/切換至目標資料庫連線
    await mongoose.connect(dbURI, {
      dbName: database,
    })

    console.log(chalk.green(`✅ 已成功連接到資料庫: ${database}`))
    return mongoose
  }
  catch (err) {
    console.error(chalk.red('❌ 資料庫連接錯誤:'), err)
    throw err
  }
}

export { connectDB }
