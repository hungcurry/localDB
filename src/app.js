// #region import
import express from 'express'
import cors from 'cors'
import corsOptions from '../src/utils/cors.js'
import path from 'path'
// 有顏色 console.log
import chalk from 'chalk'
import cookieParser from 'cookie-parser'
// { }
import { createServer } from 'http'
import { connectDB } from './config/connection.js'
import { getConfig } from './config/env/index.js'
import { httpLogger } from './utils/logger.js'
import { envDbMap } from './config/databases.js'
import { swaggerDocs, swaggerUi, SWAGGER_OPTIONS } from './utils/swagger.js'
import { handleNotFound, handleGlobalError } from './middlewares/errorHandler.js'
// Router
import indexRouter from './routes/index.js'
import userRouter from './routes/user.js'
import roomRouter from './routes/room.js'
import tokenRouter from './routes/token.js'
import articleRouter from './routes/article.js'
import errorRouter from './routes/error.js'
// #endregion

const PORT = getConfig('server.port') || 3000
const nodeEnv = getConfig('server.nodeEnv') || process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'
const isDev = nodeEnv === 'dev'
const isTest = nodeEnv === 'test'

// ===================
// ... CORS配置 ...
// ===================
const app = express()
// 先處理跨域 (最優先)
// 限定只有特定條件的前端才能存取 API
app.use(cors(corsOptions))

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
// 用現在檔案當起點，往上跳一層，再進 server/views
// const viewsPath = resolve(__dirname, '..', 'server', 'views')
const viewsPath = resolve(__dirname, 'views')
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
// 解析 JSON (如 Axios，設定大小限制，防止攻擊導致記憶體溢位)
app.use(express.json({ limit: '1mb' }))
// 解析 Form (如藍新通知)
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
// 解析cookie (如 JWT token 存在 cookie 中，
// 自動只要發請求，瀏覽器自動夾帶 cookie，後端就能解析)
// Header 方式 Authorization: Bearer <token> 就不用掛這個
app.use(cookieParser())
// 解析Logger 配置
app.use(httpLogger)
// 靜態文件中間件
// join: 用現在檔案當路徑，路徑直接合併'public'
// app.use(express.static(path.join(__dirname, 'public')))
// ---
// resolve: 用現在檔案當起點，往上跳一層，再進 server/public
// const publicPath = resolve(__dirname, '..', 'server', 'public')
const publicPath = resolve(__dirname, 'public')
app.use(express.static(publicPath))

// ===================
// ... 動態 MongoDB 連接 ...
// ===================
// 根據請求的 URL 動態連接到對應的資料庫
// !排除的路徑陣列
// 這些路徑不需要連接資料庫，直接放行
// 這邊新增後,下面Router的路徑也要記得加上去
// prettier-ignore
const excludedPaths = [
  'index', 'api-docs', 'error',
  'favicon.ico', '.well-known', 'robots.txt'
]

// 連線快取池（避免每次請求重複連線或全域踩踏）
const dbConnections = {}

app.use(async (req, res, next) => {
  try {
    // 1. 使用 req.path 排除 Query 參數干擾
    // 例如: "/api2/users?page=1" -> path 為 "api2"
    const path = req.path.split('/')[1] || 'index'

    // 2. 排除不需連線的路徑
    if (excludedPaths.includes(path)) {
      if (['favicon.ico', '.well-known', 'robots.txt'].includes(path)) {
        return res.status(404).end()
      }
      return next()
    }

    // 3. 安全取得 body
    const { database, collection } = req.method === 'GET' ? {} : (req.body || {})
    req.targetCollection = collection

    // 4. DB mapping
    const pathToEnvMap = {
      api: 'production',
      api2: 'dev',
      api3: 'test',
    }

    const envKey = pathToEnvMap[path] ?? 'dev'
    const targetEnv = envDbMap?.[envKey] || {}

    const dbURI = targetEnv.uri
    const defaultDatabase = targetEnv.dbName

    if (!dbURI) {
      return next()
    }

    const finalDatabase = database || defaultDatabase

    // 5. 使用快取連線，避免請求間互相覆蓋全域連線
    const cacheKey = `${dbURI}/${finalDatabase}`
    if (!dbConnections[cacheKey]) {
      // 假設 connectDB 回傳該連線實例 (如 mongoose.createConnection)
      dbConnections[cacheKey] = await connectDB(dbURI, finalDatabase)
    }

    // 將當前連線掛載在 req，供後續 Controller 使用
    req.db = dbConnections[cacheKey]

    next()
  }
  catch (err) {
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
  // ....
  // app.use('/api2/users', userRouter);
  // app.use('/api2/rooms', roomRouter);
})

// app.get：直接定義單一路由
// app.use：引入外部路由模組（Router
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
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

export default app
