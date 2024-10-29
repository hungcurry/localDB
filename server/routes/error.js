import express from 'express'
import { catchAsyncErrors } from '../middlewares/errorHandler.js'
const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

const errorController = async function (req, res, next) { // 錯誤
  a; // 未定義
  res.send({
    message: '錯誤狀態',
  });
};

const someController = async function (req, res, next) { // 正常
  res.send({
    message: '正常狀態',
  });
};

// 獨立 controller
// 錯誤捕捉 => 回傳 500
// http://localhost:3000/error
router.get('/', catchAsyncErrors(errorController));

// 不捕捉錯誤 伺服器會掛掉
// http://localhost:3000/error/no-catch
router.get('/no-catch', errorController);

// 能正確運作
// http://localhost:3000/error/normal
router.get('/normal', catchAsyncErrors(someController));

export default router
