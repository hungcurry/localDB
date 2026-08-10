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
  '/', 'index', 'api-docs', 'error',
  'favicon.ico', '.well-known', 'robots.txt'
]
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
    if (isDev) {
      const referer = req.headers.referer
      const isServerRequest = !referer || referer.includes(`localhost:${process.env.PORT || 3000}`)

      if (path !== 'favicon.ico') {
        console.log(chalk.cyan(isServerRequest ? '--- 伺服器請求 ---' : '--- 客戶端請求 ---'))
        console.log('檔案 : app.js')
        console.log(`API路徑 : ${path}`) // api2
        console.log('database =>', database)
        console.log('collection =>', collection)
      }
    }

    // DB mapping
    const pathToEnvMap = {
      api: 'production', // prodDB
      api2: 'dev', // devDB
      api3: 'test', // testDB
    }
    // 防護機制：根據 path 取得對應環境，若找不到則退回預設環境 'dev'
    const envKey = pathToEnvMap[path] ?? 'dev' // api2 => dev
    const targetEnv = envDbMap[envKey] // 得到dev物件

    const dbURI = targetEnv.uri // mongoUriDev (連線到 dev 伺服器)
    const defaultDatabase = targetEnv.dbName // 得到 "devDB"。

    // *如果後續沒有定義 例: /products 路由，
    // 它會自然掉進你底部的 404 處理器
    if (!dbURI) {
      return next()
    }

    // GET 不強制 database（用 default）
    const finalDatabase = database || defaultDatabase

    await connectDB(dbURI, finalDatabase)

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
