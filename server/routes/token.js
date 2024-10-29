import express from 'express'
import {
  checkText,
  utilGenerateToken,
  checkAuthorization,
  checkJWTSignup,
  checkJWTLogin,
  checkJWTAuthorization,
} from '../middlewares/auth.js'
import { 
  handleGetPeople, 
  handlePostPerson 
} from '../controllers/peopleController.js'

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkClientFrom, checkAuthorization);

// ~各別使用
// !同一路由不能同時定義兩個相同的 HTTP 方法（如 / 然後有2個POST）

/**
 * @swagger
 * /token:
 *   get:
 *     summary: 生成令牌
 *     description: 生成一個新的訪問令牌
 *     tags: [Token]
 *     responses:
 *       200:
 *         description: 成功生成令牌
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: 生成的訪問令牌
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: 令牌過期時間
 *       500:
 *         description: 服務器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
// 生成令牌
router.get('/', utilGenerateToken)

/**
 * @swagger
 * /token/validate:
 *   get:
 *     summary: 驗證令牌
 *     description: 驗證提供的訪問令牌是否有效
 *     tags: [Token]
 *     security:
 *       - customAuth: []  # 使用自定義的 customAuth 安全方案
 *     responses:
 *       200:
 *         description: 令牌有效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 令牌有效
 *       401:
 *         description: 令牌無效或已過期
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 無效的令牌
 *       500:
 *         description: 服務器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * components:
 *   securitySchemes:
 *     customAuth:
 *       type: apiKey  # 改用 apiKey 而非 bearer
 *       name: Authorization
 *       in: header
 *       description: 輸入自定義 token，無需添加 'Bearer ' 前綴
 */
// 驗證令牌
router.get('/validate', checkAuthorization)

// ===================
// ... JWT Token ...
// ===================
/**
 * @swagger
 * /{env}/token/signup:
 *   post:
 *     summary: 註冊用戶-JWT
 *     description: 用於註冊新用戶，並生成訪問Jwt令牌。
 *     tags: [Token]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 用戶的電子郵件
 *               username:
 *                 type: string
 *                 description: 用戶的用戶名
 *               password:
 *                 type: string
 *                 description: 用戶的密碼
 *     responses:
 *       201:
 *         description: 註冊成功，返回訪問令牌
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 服務器錯誤
 */
// 註冊
router.post('/signup', checkText, handleGetPeople, handlePostPerson, checkJWTSignup)
router.get('/signup', checkText, handleGetPeople, handlePostPerson, checkJWTSignup)
/**
 * @swagger
 * /{env}/token/login:
 *   post:
 *     summary: 登入用戶-JWT
 *     description: 用於用戶登入，並生成訪問Jwt令牌。
 *     tags: [Token]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 用戶的電子郵件
 *               password:
 *                 type: string
 *                 description: 用戶的密碼
 *     responses:
 *       200:
 *         description: 登入成功，返回訪問令牌
 *       401:
 *         description: 登入失敗，無效的憑證
 *       500:
 *         description: 服務器錯誤
 */
// 登入
router.post('/login', handleGetPeople , checkJWTLogin)

/**
 * @swagger
 * /{env}/token/profile:
 *   get:
 *     summary: 驗證令牌-JWT
 *     description: 驗證JWT並返回用戶的個人資料。
 *     tags: [Token]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     security:
 *       - customAuth: []  # 使用自定義的 customAuth 安全方案
 *     responses:
 *       200:
 *         description: 成功獲取用戶資料
 *       401:
 *         description: 未授權，缺少有效的token
 *       500:
 *         description: 服務器錯誤
 */
// 驗證令牌
router.get('/profile', checkJWTAuthorization)

export default router
