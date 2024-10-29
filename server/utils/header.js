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


// 將所有 CORS 配置（例如允許的來源、方法和標頭）集中在一個文件中
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Client-From, X-Client-Language, Content-Length, X-Requested-With';
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
// 允許的來源，可以根據環境變數設定
// console.log(`process.env.NODE_ENV`, process.env.NODE_ENV);
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:8080' : '*';


// 設定 CORS 標頭
const headers = {
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': ALLOWED_METHODS,
};

export default headers;
