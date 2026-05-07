import dotenv from 'dotenv';

// 判斷當前環境並加載相應的.env 檔案
const envFile = {
  production: '.env.prod',
  test: '.env.test',
  development: '.env.dev'
}[process.env.NODE_ENV] || '.env.dev';

dotenv.config({ path: envFile });

console.log(`[Config] 環境變數已載入: ${envFile}`);
