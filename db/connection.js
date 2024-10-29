import mongoose from 'mongoose';
import chalk from 'chalk';
// npm install chalk
// 在 Node.js 中，可以使用 chalk 套件來為 console.log 的輸出添加顏色
// 紅色：chalk.red('This is a red message')
// 藍色：chalk.blue('This is a blue message')
// 加粗：chalk.bold('This is a bold message')
// 下劃線：chalk.underline('This is an underlined message')

// const connectDB = async (dbURI) => {
//   try {
//     // 連接到本地 MongoDB 資料庫
//     // mongoose.connect('mongodb://127.0.0.1:27017/testdb');
//     await mongoose.connect(dbURI);

//     // 連接成功後的處理
//     console.log(chalk.yellow('Connected to MongoDB'));
//   } 
//   catch (err) {
//     // 連接錯誤的處理
//     console.error(chalk.yellow('Error connecting to MongoDB:'), err);
//     throw err; // 抛出錯誤
//   }

//   // 連接斷開的處理
//   mongoose.connection.on('disconnected', () => {
//     console.log(chalk.yellow('Disconnected from MongoDB'));
//   });
// };
// export default connectDB;


let isEventRegistered = false;  // 確保事件處理器只註冊一次
const connectDB = async (dbURI, database) => {
  const fullDBURI = `${dbURI}${database}`;
  if (process.env.NODE_ENV === 'dev') {
    console.log(`------`);
    console.log(`DB : connection.js`);
    console.log(`重設database ===>` , database);
    console.log(`fullDBURI ===>` , fullDBURI);
    console.log(`上個資料庫 ===>` , mongoose.connection.name);
  }

  try {
    // 如果連接不同資料庫，斷開當前連接
    if (mongoose.connection.readyState !== 0 && mongoose.connection.name !== database) {
      await mongoose.disconnect();
      console.log(chalk.yellow('Disconnected from MongoDB'));
    }

    // 如果尚未連接或連接到錯誤的資料庫，重新建立新連接
    if (mongoose.connection.readyState === 0 || mongoose.connection.name !== database) {
      await mongoose.connect(fullDBURI);
      console.log(chalk.yellow(`Connected to MongoDB: ${database}`));
    }
  } 
  catch (err) {
    // 處理連接錯誤
    console.error(chalk.red('Error connecting to MongoDB:'), err);
    throw err;
  }

  // 確保斷開連接事件只註冊一次
  if (!isEventRegistered) {
    mongoose.connection.on('disconnected', () => {
      console.log(chalk.yellow('Disconnected from MongoDB'));
    });
    isEventRegistered = true;
  }
};
export default connectDB;
