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

// 根據環境配置 CORS
const whitelist = [
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://vue-env.vercel.app',
  'https://vue-test-three.vercel.app',
  'https://local-db.vercel.app',
]

const corsOptions = {
  origin(origin, callback) {
    // 允許 curl / postman / server-to-server
    if (!origin) {
      return callback(null, true)
    }

    if (whitelist.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-From',
    'X-Client-Language',
    'Content-Length',
    'X-Requested-With',
  ],
}

export default corsOptions
