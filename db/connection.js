import mongoose from 'mongoose'
import chalk from 'chalk'

let isEventRegistered = false

const connectDB = async (dbURI, database) => {
  try {
    // 1. 取得當前已連線的資料庫名稱與主機
    const currentDB = mongoose.connection.db?.databaseName
    const isConnected = mongoose.connection.readyState === 1

    // 2. 判斷是否需要重新建立/切換連線
    // 条件：未連線 OR 資料庫名稱不同 OR 連線 Host 不同
    const needsNewConnection = !isConnected || currentDB !== database || mongoose.connection.host !== dbURI

    // 3. 如果已經連線且資料庫完全一致，直接回傳，不重複連線
    if (isConnected && !needsNewConnection) {
      return mongoose
    }

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.cyan('------'))
      console.log(chalk.cyan('DB : connection.js'))
      console.log(chalk.cyan(`目前資料庫 => ${currentDB || '未連線'}`))
      console.log(chalk.cyan(`目標切換資料庫 => ${database}`))
    }

    // 4. 如果已經連在舊的 DB，先切斷連線
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      if (process.env.NODE_ENV === 'dev') {
        console.log(chalk.yellow(`已斷開舊資料庫連線: ${currentDB}`))
      }
    }

    // 5. 重新連線至目標資料庫
    await mongoose.connect(dbURI, {
      dbName: database,
    })

    console.log(chalk.green(`✅ 已成功連接到資料庫: ${database}`))

    // 註冊斷開連接事件（僅註冊一次）
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('⚠️ 資料庫連接已斷開'))
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

export default connectDB
