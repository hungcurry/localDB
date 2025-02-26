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


// CORS 配置常數
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
  ORIGINS: {
    dev: '*',  // 支援 NODE_ENV=dev
    development: '*',  // 支援 NODE_ENV=development
    production: [
      'http://127.0.0.1:8080',
      'http://localhost:3000', 
      'http://localhost:5173',
      'http://localhost:8080',
      'https://local-db.vercel.app',
      'https://localdb-1w4g.onrender.com'
    ]
  }
};

// 根據請求來源返回允許的 CORS 設定
const getAllowedOrigin = (origin) => {
  const env = process.env.NODE_ENV || 'development';

  // 開發環境 (`dev` 或 `development`) 允許所有請求
  if (env === 'dev' || env === 'development') {
    return '*';
  }

  // 正式環境檢查請求的 origin
  return CORS_CONFIG.ORIGINS.production.includes(origin) ? origin : 'http://127.0.0.1:8080';
};

// 設定 CORS 標頭
const headers = (req) => ({
  'Access-Control-Allow-Headers': CORS_CONFIG.HEADERS.join(', '),
  'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.origin),
  'Access-Control-Allow-Methods': CORS_CONFIG.METHODS.join(', '),
  'Access-Control-Allow-Credentials': 'true',
});

export default headers;



