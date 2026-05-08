// #region 客戶端
// 客戶端
// fetch('http://localhost:3000/api/users', {
//   method: 'PUT',
//   headers: {
//     'Authorization': tokenValue, // 發送授權令牌
//     'X-Client-From': 'common',   // 自定義標頭，指定客戶端來源
//     'X-Client-Language': 'zh-TW',   // 自定義標頭，指定客戶端語言
//     'Content-Type': 'application/json', // 指定請求體類型
//   },
//   body: JSON.stringify({ name: 'Alice', age: 30 })
// });

// ✅ dev 改為回傳 origin
// ✅ 無 origin → 不設 header
// ✅ 僅白名單才設 Allow-Origin
// ✅ .split(',') 加 trim() 防空白 bug
// #endregion
import cors from 'cors'

// 允許跨域存取的白名單網址
const whitelist = [
  // 本機開發環境
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  // Vercel 部署環境
  'https://vue-env.vercel.app',
  'https://vue-test-three.vercel.app',
  'https://local-db.vercel.app',
]

// 建立 cors middleware
const corsMiddleware = cors({
  /**
   * origin 驗證
   *
   * @param {string | undefined} origin
   * 瀏覽器來源網址
   *
   * @param {Function} callback
   * callback(error, allow)
   */

  origin(origin, callback) {
    // 沒有 origin 代表:
    // - curl
    // - postman
    // - server-to-server
    // 這些請求允許通過
    if (!origin) {
      return callback(null, true)
    }

    // 檢查是否在白名單內
    if (whitelist.includes(origin)) {
      return callback(null, true)
    }

    // 不在白名單 → 拒絕
    return callback(new Error('Not allowed by CORS'))
  },

  // 是否允許攜帶 cookie / session
  credentials: true,

  // 允許的 HTTP 方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // 允許的 request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-From',
    'X-Client-Language',
    'Content-Length',
    'X-Requested-With',
  ],
})

// 匯出 middleware
export default corsMiddleware
