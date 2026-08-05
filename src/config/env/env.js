import dotenv from 'dotenv'
import chalk from 'chalk'

// ~判斷當前環境並加載相應的.env 檔案
// let envFile
// switch (process.env.NODE_ENV) {
//   case 'production':
//     envFile = '.env.prod'
//     break
//   case 'test':
//     envFile = '.env.test'
//     break
//   default:
//     envFile = '.env.dev'
//     break
// }

// ~判斷當前環境並加載相應的.env 檔案
const envFile =
  {
    production: '.env.prod',
    prod: '.env.prod',
    test: '.env.test',
    development: '.env.dev',
    dev: '.env.dev',
  }[process.env.NODE_ENV] || '.env.dev'

/**
 * 步驟說明：
 * 01-
 * const envFile = {
    production: '.env.prod',
    prod: '.env.prod',
    test: '.env.test',
    development: '.env.dev',
    dev: '.env.dev'
  }
  02-
  envFile [process.env.NODE_ENV]

  03-
  envFile ["dev"] => '.env.dev'
 *
 */

// 加上 env/ 目錄前綴
dotenv.config({ path: `env/${envFile}` })

console.log(chalk.red(`[Config] 環境變數已載入: ${envFile}`))
