// #region import logger
// ---------------
// ~logger方式01: Morgan
// npm i D morgan
// npm i D @types/morgan
// import logger from 'morgan';
// app.use(logger('dev'));

// ~logger方式02: pino-http
// npm install pino pino-http pino-roll
// npm install -D pino-pretty

/**
 * 使用方式
 * ------------------------------------
    // *引入 logger
    import { createLogger } from '@/utils/logger.js'

    // *logger參數順序：level, message, payload
    const logger = createLogger('todoController')

    export const getTodos = async (req: Request, res: Response) => {
      try {
        const todos = await db.todos.findMany();

        // ✅ 方式 1：成功路徑 (預設 info) -> 終端顯示綠色
        logger.setLog('info', 'User list successfully', { userCount: users.length })

        // ✅ 方式 2： 🔥 人工製造錯誤 -> 終端顯示紅色
        // 錯誤只會傳到server端,開發時候看到
        throw new Error('Database connection timeout');

        // ✅ 方式 3：警告資訊 (warn) -> 終端顯示黃色
        logger.setLog('warn', 'get list of tasks to done', { userCount: users.length })
        
        // ✅ 方式 4：開發除錯 (debug) -> 終端顯示紫色
        logger.setLog('debug', 'Debug info', { rawData: 'some-internal-info' })

        res.json(todos);
      } 
      catch (err: any) {
        // ✅ 方式 2：錯誤捕捉 (error) -> 終端顯示紅色
        // 記錄 Log (給伺服器管理員看)
        logger.setLog('error', 'failed to get user list', { err: err.message })

        res.status(500).json({ error: 'Server Error' });
      }
    }
 * ------------------------------------
 */
// #endregion

import pino from 'pino'
import path from 'node:path'
import pretty from 'pino-pretty'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { pinoHttp } from 'pino-http'
import { AsyncLocalStorage } from 'async_hooks'

/** 這份檔案 只適合用在 Serverless 環境（例如 Vercel）使用
 * 
 *  * 注意事項
 *  Zeabur（傳統伺服器/容器架構） 
 *  Vercel（Serverless 無伺服器架構）
 *  ---
 *  Vercel 的 Serverless Function 環境不允許持久化儲存 Log 檔案。
 *  這與 Zeabur 或一般傳統 Server（如 VPS、虛擬主機）有本質上的不同。
 * 
 */

// 建立一個存放 Response 物件的保險箱
const responseStorage = new AsyncLocalStorage()

// =======================================================
// 1️⃣ 環境判斷與預設 Log 等級
// =======================================================
const isDevelopment = process.env.NODE_ENV === 'dev'
const isProd = process.env.NODE_ENV === 'production'
const currentLevel = isDevelopment ? 'debug' : 'info'

// =======================================================
// 2️⃣ 確保 logs 目錄存在 (僅限非生產環境)
// =======================================================
const logDir = path.join(process.cwd(), 'logs')

if (!isProd) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  } catch (err) {
    console.error('Failed to create log directory:', err)
  }
}

// =======================================================
// 3️⃣ 敏感資料過濾
// 避免 password / token 等資訊被寫入 log
// =======================================================
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization']

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body

  try {
    const clone = JSON.parse(JSON.stringify(body))

    for (const key of SENSITIVE_KEYS) {
      if (key in clone) {
        clone[key] = '***'
      }
    }

    return clone
  } catch {
    return '[Unparseable Body]'
  }
}

// =======================================================
// 4️⃣ Logger Stream 設定
// =======================================================

// 定義 ANSI 顏色代碼
const colors = {
  reset: '\x1b[0m',
  pink: '\x1b[95m', // 用於 Key
  yellow: '\x1b[33m', // 用於 Value
  gray: '\x1b[90m', // 用於冒號
}

const consoleStream = pretty({
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname,req,res,responseTime,err',

  messageFormat: (log, messageKey) => {
    const msg = log[messageKey]
    let payloadStr = ''

    const omitKeys = [
      messageKey,
      'level',
      'time',
      'pid',
      'hostname',
      'req',
      'res',
      'responseTime',
      'msg',
      'bizMsg',
      'displayMsg',
    ]

    // 遍歷其餘 payload 並上色
    Object.keys(log).forEach((key) => {
      if (!omitKeys.includes(key)) {
        const val = typeof log[key] === 'object' ? JSON.stringify(log[key]) : log[key]

        // ✨ 在這裡加上顏色：Key 是青色，Value 是黃色
        payloadStr += `\n    ${colors.pink}${key}${colors.gray}: ${colors.yellow}${val}${colors.reset}`
      }
    })

    // 訊息行判斷
    const messageLine = log.displayMsg && log.displayMsg.trim() !== '' ? `\n    log-message: "${log.displayMsg}"` : ''

    return `${msg}${messageLine}${payloadStr}`
  },

  include: 'level,time',
  sync: true,
})

// 🚀 修改重點：動態建立 streams 陣列
const streams = [
  {
    level: currentLevel,
    stream: consoleStream,
  },
]

// 只有在非生產環境（例如 Local）才加上檔案記錄功能
if (!isProd) {
  streams.push({
    level: currentLevel,
    stream: pino.transport({
      target: 'pino-roll',
      options: {
        file: path.join(logDir, 'app'),
        frequency: 'daily',
        extension: '.log',
        dateFormat: 'yyyy-MM-dd',
        mkdir: true,
        limit: { count: 7 },
      },
    }),
  })
}

const multiStream = pino.multistream(streams)
multiStream.level = currentLevel

// =======================================================
// 5️⃣ 建立核心 Logger
// =======================================================
export const logger = pino(
  {
    level: currentLevel,
    messageKey: 'log-message',
    timestamp: pino.stdTimeFunctions.isoTime,

    formatters: {
      level(label) {
        return { level: label }
      },
    },
  },

  multiStream,
)

// =======================================================
// 6️⃣ setLog 輔助函式
// 修改點：將 msg 對應到你要求的檔案名稱位置 (bizMsg)
// =======================================================
export const setLog = (res, fileTag, level = 'info', logMsg = '', payload = {}) => {
  if (!res) return

  const locals = res.locals

  locals.bizMsg = fileTag
  locals.payload = {
    ...payload,
    displayMsg: logMsg,
  }

  locals.logLevel = level
}

// =======================================================
// 7️⃣ 決定檔案標籤的工廠函式 (你要的新寫法)
// =======================================================
export const createLogger = (fileTag) => {
  return {
    setLog: (
      level = 'info',
      logMsg = '',

      // 改成 object | undefined，這樣呼叫端傳什麼物件進來都行
      payload,
    ) => {
      const res = responseStorage.getStore()

      if (!res) return

      setLog(res, fileTag, level, logMsg, payload)
    },

    // 捷徑方法也一併修改
    info: (msg, payload) => setLog(responseStorage.getStore(), fileTag, 'info', msg, payload),

    warn: (msg, payload) => setLog(responseStorage.getStore(), fileTag, 'warn', msg, payload),

    error: (msg, payload) => setLog(responseStorage.getStore(), fileTag, 'error', msg, payload),
  }
}

// =======================================================
// 8️⃣ HTTP Logger Middleware
// =======================================================
export const baseHttpLogger = pinoHttp({
  logger,

  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),

  customLogLevel: (_req, res, error) => {
    const locals = res.locals

    // 1️⃣ 優先權最高：如果程式有拋出 Error，或是你在 setLog 手動指定了等級
    // 這樣即使是 400，只要有 Error 物件或是手動指定，都會是 error
    if (error || locals?.logLevel === 'error' || res.statusCode >= 500) return 'error'

    // 2️⃣ 優先權次之：讀取自定義的其他等級 (如 'info', 'warn' 等)
    if (locals?.logLevel) return locals.logLevel

    // 3️⃣ 預設自動判斷：將 400 區段從 warn 改為 error
    if (res.statusCode >= 400) return 'error'

    return 'info'
  },

  customErrorObject: () => ({}),

  serializers: {
    // 💡 優化 req 序列化
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      body: sanitizeBody(req.raw?.body),

      // 增加以下欄位
      query: req.query, // 取得 URL 參數
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,

      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
      },
    }),

    res: (res) => {
      const headers = typeof res.getHeaders === 'function' ? res.getHeaders() : (res.headers ?? {})

      return {
        statusCode: res.statusCode,

        headers: {
          'x-powered-by': headers['x-powered-by'],
          'access-control-allow-origin': headers['access-control-allow-origin'],
          etag: headers['etag'],
        },
      }
    },

    // 確保標準 Error 物件能正確轉寫
    err: pino.stdSerializers.err,
  },

  // 成功 log 訊息格式：GET /todos 200 - 4ms | todoController
  customSuccessMessage: (req, res, responseTime) => {
    const locals = res.locals
    const url = req.originalUrl || req.url
    const bizMsg = locals?.bizMsg ? ` | ${locals.bizMsg}` : ''

    return `${req.method} ${url} ${res.statusCode} - ${responseTime}ms${bizMsg}`
  },

  // 將 payload 展開到 Log 的一級節點，以便 pino-pretty 抓取
  customProps: (_req, res) => res.locals?.payload || {},

  autoLogging: {
    ignore: (req) => ['/favicon.ico', '/health'].includes(req.url || ''),
  },
})

// 封裝 Middleware，將 res 存入 AsyncLocalStorage
export const httpLogger = (req, res, next) => {
  responseStorage.run(res, () => {
    baseHttpLogger(req, res, next)
  })
}

export const getChildLogger = (prefix) => logger.child({ module: prefix })
