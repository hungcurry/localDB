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


// 根據環境配置 CORS
const CORS_CONFIG = {
  HEADERS: [
    'Content-Type',
    'Authorization', 
    'X-Client-From',
    'X-Client-Language',
    'Content-Length',
    'X-Requested-With'
  ],
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // 允許的跨網來源配置
  ORIGINS: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://127.0.0.1:8080',
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://localhost:8080',
    'https://vue-env.vercel.app'
  ]
};
// 根據環境和請求來源返回允許的 CORS 設定
const getAllowedOrigin = (origin) => {
  const env = process.env.NODE_ENV || 'development';
  // 打印請求來源 
  // console.log('origin:', origin) // http://localhost:5173

  // 開發環境允許所有來源
  if (env === 'dev' || env === 'development') {
    return '*';
  }
  
  // 生產環境檢查請求來源是否在允許清單中
  if (!origin || CORS_CONFIG.ORIGINS.includes(origin)) {
    return origin || '*';
  }
  
  // 預設返回安全的來源
  return 'http://127.0.0.1:8080';
};
// 設定 CORS 標頭
const headers = (req) => ({
  'Access-Control-Allow-Headers': CORS_CONFIG.HEADERS.join(', '),
  'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.origin),
  'Access-Control-Allow-Methods': CORS_CONFIG.METHODS.join(', '),
  'Access-Control-Allow-Credentials': 'true',
});

export default headers; 

