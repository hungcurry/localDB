import express from 'express'
import dotenv from 'dotenv'

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
// dotenv.config({ path: envFile })

// ~變數取得位置1:
// ~但是,進入點api/index.js要先使用 import '../server/config/env.js'
// 這邊位置才能抓到，因為這時候才會執行到這裡
// const { VARIABLES } = process.env

import { getConfig } from '../config/env/index.js'
const VARIABLES = getConfig('secret.variables')
const JWT_EXPIRES_DAY = getConfig('secret.jwtExpiresDay')

// console.log('VARIABLES :', VARIABLES)
// console.log('JWT_EXPIRES_DAY :', JWT_EXPIRES_DAY)

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

/* GET home page. */
// http://localhost:3000/
router.get('/', function (req, res, next) {
  // ~變數取得位置2:
  // ~寫在裡面，保證拿得到，因為此時啟動流程已結束
  // 直接從 process.env 拿就好，因為 www.js 已經幫你準備好了
  // const { VARIABLES } = process.env
  // console.log('VARIABLES :', VARIABLES)

  res.render('index', { title: 'Express', VARIABLES })
})

export default router
