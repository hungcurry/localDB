import mongoose from 'mongoose';
import chalk from 'chalk';

// 確保事件處理器只註冊一次
let isEventRegistered = false;

const connectDB = async (dbURI, database) => {
  try {
    // 取得當前資料庫名稱
    const currentDB = mongoose.connection.db?.databaseName || '未知';

    // 檢查是否需要切換資料庫
    // const needsNewConnection = mongoose.connection.readyState === 0 || currentDB !== database;
    const needsNewConnection = mongoose.connection.readyState === 0 || currentDB !== database || mongoose.connection.host !== dbURI;

    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.cyan('------'));
      console.log(chalk.cyan('DB : connection.js'));
      console.log(chalk.cyan(`切換資料庫 => ${database}`));
      console.log(chalk.cyan(`目前資料庫 => ${currentDB}`));
    }

    if (needsNewConnection) {
      // 如果已有連接但資料庫不同，先斷開
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log(chalk.yellow(`已斷開資料庫: ${currentDB}`));
      }

      // 建立新連接（改用 dbName）
      await mongoose.connect(dbURI, { dbName: database });
      console.log(chalk.green(`已連接到資料庫: ${database}`));
    }

    // 註冊斷開連接事件(只註冊一次)
    if (!isEventRegistered) {
      mongoose.connection.on('disconnected', () => {
        console.log(chalk.yellow('資料庫連接已斷開'));
      });
      isEventRegistered = true;
    }
  } catch (err) {
    console.error(chalk.red('資料庫連接錯誤:'), err);
    throw err;
  }
};

export default connectDB;
