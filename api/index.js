// #region import
import express from 'express'
import chalk from 'chalk'
import dotenv from 'dotenv'
import path from 'path'
import cookieParser from 'cookie-parser'; 
import headers from '../server/utils/header.js'
import indexRouter from '../server/routes/index.js'
import userRouter from '../server/routes/user.js'
import roomRouter from '../server/routes/room.js'
import tokenRouter from '../server/routes/token.js'
import errorRouter from '../server/routes/error.js'
import connectDB from '../db/connection.js'
import { swaggerDocs, swaggerUi } from '../server/utils/swagger.js'
import { catchHttpErrors } from '../server/middlewares/errorHandler.js'
import { parse } from 'url';
import { createServer } from 'http';
import { wss1, wss2 } from '../server/routes/ws.js'
// #endregion

// 判斷當前環境並加載相應的.env 檔案
let envFile
const post = 3000
switch (process.env.NODE_ENV) {
  case 'production':
    envFile = '.env.prod'
    break
  case 'test':
    envFile = '.env.test'
    break
  default:
    envFile = '.env.dev'
    break
}
dotenv.config({ path: envFile })
if (process.env.NODE_ENV === 'dev') {
  console.log(`------`)
  console.log(`Server : index.js`)
  console.log('當前環境:', process.env.NODE_ENV)
  // console.log('API 路徑:', process.env.VITE_API);
  // console.log('Base URL:', process.env.VITE_BASE_URL);
  console.log('MONGO_ENV:', process.env.MONGO_ENV)
  console.log('MONGO_URI:', process.env.MONGO_URI)
  // http://localhost:3000/api/users
  // http://localhost:3000/api-docs  查看生成的 API 文檔
  console.log(`Server running on http://localhost:${post}`)
}
// ===================
// ... CORS配置 ...
// ===================
const app = express()
app.use((req, res, next) => {
  res.set(headers)
  next()
})
// 自動解析 JSON 格式的請求體
app.use(express.json())
// 處理 OPTIONS 請求以支持 CORS 預檢請求
app.options('*', (req, res) => {
  res.set(headers)
  res.sendStatus(204)
})

// ===================
// ... 伺服器 ...
// ===================
// ~創建 HTTP 伺服器
const server = createServer(app)
// ~創建 WebSocket 伺服器
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  switch (pathname) {
    case '/ws':
      wss1.handleUpgrade(request, socket, head, function done(ws) {
        wss1.emit('connection', ws, request);
      });
      break;
    case '/ws2':
      wss2.handleUpgrade(request, socket, head, function done(ws) {
        wss2.emit('connection', ws, request);
      });
      break;
    default:
      socket.destroy();
      break;
  }
})

// ===================
// ... view模板 ...
// ===================
// EJS 核心
// pnpm install -D ejs
// pnpm install -D ejs-locals
import ejsLocals from 'ejs-locals'
import { fileURLToPath } from 'url'
import { dirname, join , resolve } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// const viewsPath = join(__dirname, 'views')
const viewsPath = resolve(__dirname, '..', 'server', 'views')
// view engine setup
app.engine("ejs", ejsLocals)
// 讀取 EJS 檔案位置
app.set('views', viewsPath)
// 設置模板引擎
app.set('view engine', 'ejs')
// #region views
//console.log('-------------------' ,)
// ~console.log('import.meta.url =>', import.meta.url)
// file:///C:/Users/currylee/Desktop/localDB/api/index.js
// ~console.log('__filename =>', __filename)
// 解析後變成 C:\Users\currylee\Desktop\localDB\api/index.js

// 檢查 views 是否正確設置
// ~console.log('__dirname =>', __dirname)
// C:\Users\currylee\Desktop\localDB\api
// ~console.log('視圖目錄已設置為:', viewsPath)
// C:\Users\currylee\Desktop\localDB\server\views
// #endregion

// ===================
// ... 中間件 ...
// ===================
// 解析 URL 編碼的中間件
app.use(express.urlencoded({ extended: false }))
// cookie 解析中間件
app.use(cookieParser())
// 靜態文件中間件
// 靜態文件服務，將 public 資料夾中的文件公開 不透過 express 路由
// app.use(express.static(path.join(__dirname, 'public')))
const publicPath = resolve(__dirname, '..', 'server', 'public')
app.use(express.static(publicPath))

// ======== MongoDB 連接 ===========
// 根據請求的 URL 動態連接到對應的資料庫
const mongoURIs = {
  // 如果是用專案開環境 不同環境的對應 不同 MongoDB URI 前綴
  // api: 'mongodb+srv://ooopp42:<密碼>@<專案dev>.mongodb.net/',
  // api2: 'mongodb+srv://ooopp42:<密碼>@<專案prod>.mongodb.net/',
  // api3: 'mongodb+srv://ooopp42:<密碼>@<專案test>.mongodb.net/',
  api: 'mongodb://127.0.0.1:27017/',
  api2: 'mongodb://127.0.0.1:27017/',
  api3: 'mongodb://127.0.0.1:27017/',
}
const defaultDatabases = {
  // 根據不同的 path 選擇對應的 Databases
  // case 'api': dbName = 'prodDB';
  // case 'api2':dbName = 'devDB';
  // case 'api3':dbName = 'testDB';
  api: 'prodDB',
  api2: 'devDB',
  api3: 'testDB',
}
// 排除的路徑陣列
const excludedPaths = ['/', 'index', 'api-docs', 'error']
app.use(async (req, res, next) => {
  try {
    // /api/users 解析出req api, api2, api3
    const path = req.originalUrl === '/' ? 'index' : req.originalUrl.split('/')[1]

    // 如果請求路徑在排除陣列中，跳過資料庫連接邏輯
    if (excludedPaths.includes(path)) {
      return next()
    }

    const { database, collection } = req.body
    if (process.env.NODE_ENV === 'dev') {
      const referer = req.headers.referer
      // 判斷是 server 請求還是 client 請求
      const isServerRequest = !referer || referer.includes(`localhost:${post}`)
      if (isServerRequest && path !== 'favicon.ico') {
        console.log(chalk.yellow(`--- 伺服器請求 ---`))
        console.log(path)
        console.log('database =>', database)
      } else if (typeof referer === 'string' && path !== 'favicon.ico') {
        console.log(chalk.yellow(`--- 客戶端請求 ---`))
        console.log(path)
        console.log('database =>', database)
      }
    }
    let dbURI = ''
    let defaultDatabase = ''
    // 根據不同的 path 選擇對應的 MongoDB URI 和預設資料庫
    if (path === 'api') {
      dbURI = mongoURIs.api
      defaultDatabase = defaultDatabases.api
    } else if (path === 'api2') {
      dbURI = mongoURIs.api2
      defaultDatabase = defaultDatabases.api2
    } else if (path === 'api3') {
      dbURI = mongoURIs.api3
      defaultDatabase = defaultDatabases.api3
    } else {
      return res.status(400).send({
        status: 'error',
        statecode: 400,
        message: 'Invalid API path',
      })
    }
    // mongodb://127.0.0.1:27017/prodDB (Database)
    // 防止 database 為 undefined 或空字串，使用預設資料庫名稱
    await connectDB(dbURI, database || defaultDatabase)
    next()
  } catch (err) {
    console.error('Failed to connect to database:', err)
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to the database',
    })
  }
})

// ===================
// ... Router ...
// ===================
// 自動生成環境和路由
const environments = ['api', 'api2', 'api3']
const routes = [
  { path: '/users', router: userRouter },
  { path: '/rooms', router: roomRouter },
  { path: '/token', router: tokenRouter },
]
environments.forEach((env) => {
  routes.forEach((route) => {
    app.use(`/${env}${route.path}`, route.router)
  })
  // 輸出結果
  // app.use('/api/users', userRouter);
  // app.use('/api/rooms', roomRouter);
  // app.use('/api2/users', userRouter);
  // app.use('/api2/rooms', roomRouter);
})
app.use('/', indexRouter)
app.use('/error', errorRouter)
// Swagger UI 提供靜態 API 文檔頁面
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// ===================
// ... Error ...
// ===================
// 捕捉 404 錯誤並傳遞到錯誤處理中間件
app.use((req, res, next) => {
  const err = new Error('API Not Found 奇怪？！我找不到資源 (´ﾟдﾟ`)，請重新確認一下你的 API 網址是否正確。')
  err.status = 404
  next(err)
})
// 使用錯誤處理中間件
app.use(catchHttpErrors)
// 啟動伺服器
const startServer = () => {
  server.listen(post, () => {
    // *api
    // http://localhost:3000/api/users
    // http://localhost:3000/api/users/get-users

    // *查看生成的 API 文檔
    // http://localhost:3000/api-docs

    // *websocket
    // ws://localhost:3000/ws
    // ws://localhost:3000/ws2

    // *public
    // http://localhost:3000/about.html
    // http://localhost:3000/stylesheets/style.css

    // *ejs模板首頁
    // http://localhost:3000
    // console.log(`Server running on http://localhost:${post}`)
  })
}
startServer()

