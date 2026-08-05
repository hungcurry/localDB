import express from 'express'
// import {
//   checkText ,
//   checkClientFrom,
//   checkAuthorization ,
//   checkContentTypeBody
// } from '../middlewares/auth.js';
import { handleGetArticles } from '../controllers/articleController.js'

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkAuthorization);

// GET /api/articles?page=1&limit=10&search=關鍵字
router.get('/', handleGetArticles)

export default router
