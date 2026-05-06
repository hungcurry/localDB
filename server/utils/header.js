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

// 根據環境配置 CORS
const CORS_CONFIG = {
  HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Client-From',
    'X-Client-Language',
    'Content-Length',
    'X-Requested-With',
  ],
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ORIGINS: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : [
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'https://vue-env.vercel.app',
        'https://vue-test-three.vercel.app',
      ],
}

// 判斷 origin
const getAllowedOrigin = (origin) => {
  const env = process.env.NODE_ENV || 'development'

  // 沒有 origin（Postman / curl）
  if (!origin) return null

  // dev：動態允許（不能用 '*', 因為有 credentials）
  if (env === 'dev' || env === 'development') {
    return origin
  }

  // prod：白名單
  if (CORS_CONFIG.ORIGINS.includes(origin)) {
    return origin
  }

  // 拒絕
  return null
}

// 設定 headers
const headers = (req) => {
  const origin = req.headers.origin
  const allowedOrigin = getAllowedOrigin(origin)

  const baseHeaders = {
    'Access-Control-Allow-Headers': CORS_CONFIG.HEADERS.join(', '),
    'Access-Control-Allow-Methods': CORS_CONFIG.METHODS.join(', '),
    'Access-Control-Allow-Credentials': 'true',
  }

  // 只有合法 origin 才設
  if (allowedOrigin) {
    baseHeaders['Access-Control-Allow-Origin'] = allowedOrigin
  }

  return baseHeaders
}

export default headers
