// #region import
// ~基本方式 只有一種環境變數
// import 'dotenv/config' // 確保第一行加載環境變數
// ~進階方式 根據不同環境NODE_ENV,加載不同的 .env 檔案
import '../server/config/env.js' // 確保第一行加載環境變數
import express from 'express'
import cors from 'cors'
import corsOptions from '../server/utils/cors.js'
import chalk from 'chalk'
import path from 'path'
import cookieParser from 'cookie-parser'
import connectDB from '../db/connection.js'
// Router
import indexRouter from '../server/routes/index.js'
import userRouter from '../server/routes/user.js'
import roomRouter from '../server/routes/room.js'
import tokenRouter from '../server/routes/token.js'
import articleRouter from '../server/routes/article.js'
import errorRouter from '../server/routes/error.js'
// { }
import { swaggerDocs, swaggerUi, SWAGGER_OPTIONS } from '../server/utils/swagger.js'
import { handleNotFound, handleGlobalError } from '../server/middlewares/errorHandler.js'
import { httpLogger } from '../server/utils/logger.js'
import { parse } from 'url'
import { createServer } from 'http'
import { wss1, wss2 } from '../server/routes/ws.js'
// #endregion

const post = 3000
if (process.env.NODE_ENV === 'dev') {
  console.log(`------`)
  console.log(`Server : api/index.js`)
  console.log('當前環境:', process.env.NODE_ENV)
  // console.log('API 路徑:', process.env.VITE_API);
  // console.log('Base URL:', process.env.VITE_BASE_URL);
  console.log('MONGO_ENV:', process.env.MONGO_ENV)
  console.log('MONGO_URI:', process.env.MONGO_URI_DEV)
  // http://localhost:3000/api/users
  // http://localhost:3000/api-docs  查看生成的 API 文檔
  console.log(`Server running on http://localhost:${post}`)
}

// ===================
// ... CORS配置 ...
// ===================
const app = express()
// 先處理跨域 (最優先)
app.use(cors(corsOptions))

// ===================
// ... 伺服器 ...
// ===================
// ~創建 HTTP 伺服器
const server = createServer(app)
// ~創建 WebSocket 伺服器
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url)

  switch (pathname) {
    case '/ws':
      wss1.handleUpgrade(request, socket, head, function done(ws) {
        wss1.emit('connection', ws, request)
      })
      break
    case '/ws2':
      wss2.handleUpgrade(request, socket, head, function done(ws) {
        wss2.emit('connection', ws, request)
      })
      break
    default:
      socket.destroy()
      break
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
import { dirname, join, resolve } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// const viewsPath = join(__dirname, 'views')
const viewsPath = resolve(__dirname, '..', 'server', 'views')
// view engine setup
app.engine('ejs', ejsLocals)
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
// 解析 JSON (如 Axios，設定大小限制，防止惡意攻擊導致記憶體溢位)
app.use(express.json({ limit: '10mb' }))
// 解析 Form (如藍新通知)
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// 解析cookie (如 JWT token 存在 cookie 中，或是前端需要設置 cookie)
app.use(cookieParser())
// 解析Logger 配置
app.use(httpLogger)
// 靜態文件中間件
// 靜態文件服務，將 public 資料夾中的文件公開 不透過 express 路由
// app.use(express.static(path.join(__dirname, 'public')))
const publicPath = resolve(__dirname, '..', 'server', 'public')
app.use(express.static(publicPath))

// ======== MongoDB 連接 ===========
// 根據請求的 URL 動態連接到對應的資料庫
const mongoURIs = {
  // 如果是用專案開環境 不同環境的對應 不同 MongoDB URI 前綴
  // api: 'mongodb://127.0.0.1:27017/',
  // api2: 'mongodb://127.0.0.1:27017/',
  // api3: 'mongodb://127.0.0.1:27017/',

  // api: 'mongodb+srv://ooopp42:<密碼>@<專案dev>.mongodb.net/',
  // api2: 'mongodb+srv://ooopp42:<密碼>@<專案prod>.mongodb.net/',
  // api3: 'mongodb+srv://ooopp42:<密碼>@<專案test>.mongodb.net/',
  api: process.env.MONGO_URI_PROD,
  api2: process.env.MONGO_URI_DEV,
  api3: process.env.MONGO_URI_TEST,
}
const defaultDbMap = {
  // 根據不同的 path 選擇對應的 Databases
  // *開發環境dev
  api: 'prodDB',
  api2: 'devDB',
  api3: 'testDB',

  // *正式環境prod
  // api: 'nuxt3-test',
  // api2: 'nuxt3-test',
  // api3: 'nuxt3-test',
}
// !排除的路徑陣列
// 這些路徑不需要連接資料庫，直接放行
// 這邊新增後,下面Router的路徑也要記得加上去
const excludedPaths = ['/', 'index', 'api-docs', 'error', 'favicon.ico', '.well-known', 'robots.txt']
app.use(async (req, res, next) => {
  try {
    /**
     * 如果是 /	    'index'
     * /products   'products'
     * /order/list  'order'
     * /api2/users  'api2'
     */
    const path = req.originalUrl === '/' ? 'index' : req.originalUrl.split('/')[1]

    // 如果請求路徑在排除陣列中，跳過資料庫連接邏輯
    if (excludedPaths.includes(path)) {
      // 如果是 favicon 或 well-known，直接回傳 404 並結束請求
      // 這樣就不會往下走到你的 "API Not Found" 錯誤處理器
      if (path === 'favicon.ico' || path === '.well-known' || path === 'robots.txt') {
        return res.status(404).end()
      }

      return next()
    }

    /**
     * 如果是 GET：返回一個空物件 {}。因為 GET 請求通常不帶 body，資料應該在 query 中。
     * 如果不是 GET (例如 POST, PUT, DELETE)：返回 req.body。
     * 如果 req.body 是 undefined 或 null，則給予一個保底的空物件 {} (透過 || {})。
     */
    const { database, collection } = req.method === 'GET' ? {} : req.body || {}
    // 掛載到 req 上，讓後續的 middleware 或 controller 可以使用
    req.targetCollection = collection

    // dev log
    if (process.env.NODE_ENV === 'dev') {
      const referer = req.headers.referer
      const isServerRequest = !referer || referer.includes(`localhost:${process.env.PORT || 3000}`)

      if (path !== 'favicon.ico') {
        console.log(isServerRequest ? '--- 伺服器請求 ---' : '--- 客戶端請求 ---')
        console.log(path) // api2
        console.log('database =>', database)
        console.log('collection =>', collection)
      }
    }

    // DB mapping
    const dbMap = {
      api: mongoURIs.api,
      api2: mongoURIs.api2,
      api3: mongoURIs.api3,
    }
    const dbURI = dbMap[path]
    // 得到 mongoURIs.api2 (連線到 dev 伺服器)
    const defaultDatabase = defaultDbMap[path]
    // 透過 defaultDbMap["api2"] 得到 "devDB"。

    // *如果後續沒有定義 例: /products 路由，
    // 它會自然掉進你底部的 404 處理器
    if (!dbURI) {
      return next()
    }

    // GET 不強制 database（用 default）
    const finalDatabase = database || defaultDatabase

    await connectDB(dbURI, finalDatabase)

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
  { path: '/article', router: articleRouter },
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
app.use(['/', '/index'], indexRouter)
app.use('/error', errorRouter)

// Swagger UI 提供靜態 API 文檔頁面
// ~原本方式
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
// !解決部屬Vercel Swagger(無法顯示問題) => 使用CDN
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, SWAGGER_OPTIONS))

// ===================
// ... Error ...
// ===================
// 捕捉 404 錯誤並傳遞到錯誤處理中間件
app.use(handleNotFound)
// 使用錯誤處理中間件
app.use(handleGlobalError)

export { app, mongoURIs, defaultDbMap }
