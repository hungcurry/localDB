import express from 'express'
import dotenv from 'dotenv'

let envFile
switch (process.env.NODE_ENV) {
  case 'production':
    envFile = '.env.prod'
    break
  case 'test':
    envFile = '.env.test'
    break
  default:
    envFile = '.env.dev'
    break
}
dotenv.config({ path: envFile })
const { VARIABLES } = process.env
// console.log(VARIABLES)

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', VARIABLES });
});


export default router
