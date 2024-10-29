import express from 'express'
import { 
  checkText, 
  checkClientFrom, 
  checkAuthorization, 
  checkContentTypeBody,
  checkJWTAuthorization,
} from '../middlewares/auth.js'
import { 
  handleGetUsers, 
  handlePostUser, 
  handlePutUser, 
  handleDeleteUser 
} from '../controllers/userController.js'

const router = express.Router()
// ~在這裡應用中間件 就全部一起使用
// router.use(checkClientFrom, checkAuthorization);

// router.get('/', handleGetUsers);
// router.post('/', handlePostUser);
// router.put('/:id', handlePutUser);
// router.delete('/:id', handleDeleteUser);

// ~各別使用
// !同一路由不能同時定義兩個相同的 HTTP 方法（如 / 然後有2個POST）

/**
 * @swagger
 * /{env}/users:
 *   get:
 *     summary: 獲取所有用戶
 *     description: 獲取系統中所有用戶的列表。需要提供有效的client-from頭部。
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功獲取用戶列表
 */
router.get('/', checkText, checkClientFrom, handleGetUsers) // 需要有client-from

/**
 * @swagger
 * /{env}/users/get-users:
 *   post:
 *     summary: 通過POST方法獲取所有用戶
 *     description: 通過POST方法獲取所有用戶的列表。需要提供有效的client-from頭部。
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功獲取用戶列表
 */
router.post('/get-users', checkText, checkClientFrom, handleGetUsers) // 需要有client-from
router.get('/get-users', checkText, checkClientFrom, handleGetUsers) 
/**
 * @swagger
 * /{env}/users:
 *   post:
 *     summary: 創建新用戶
 *     description: 用於創建新用戶。需要提供有效的授權令牌和正確的內容類型。
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *     security:
 *       - customAuth: []  # 使用自定義的 customAuth 安全方案
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用戶名稱
 *               age:
 *                 type: integer
 *                 description: 用戶年齡
 *             required:
 *               - name
 *               - age
 *     responses:
 *       201:
 *         description: 成功創建新用戶
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 新創建用戶的ID
 *                 name:
 *                   type: string
 *                   description: 用戶名稱
 *                 age:
 *                   type: integer
 *                   description: 用戶年齡
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權，缺少有效的token
 *       409:
 *         description: 用戶名已存在
 */
router.post('/', checkText, checkJWTAuthorization, checkContentTypeBody, handlePostUser) // 需要token授權

/**
 * @swagger
 * /{env}/users/{id}:
 *   put:
 *     summary: 更新指定用戶
 *     description: 更新指定用戶的信息。需要提供有效的授權令牌和正確的內容類型。
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         description: 用戶ID
 *         schema:
 *           type: string
 *     security:
 *       - customAuth: []  # 使用自定義的 customAuth 安全方案
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用戶名稱
 *               age:
 *                 type: integer
 *                 description: 用戶年齡
 *     responses:
 *       200:
 *         description: 成功更新用戶信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 更新用戶的ID
 *                 name:
 *                   type: string
 *                   description: 更新後的用戶名稱
 *                 age:
 *                   type: integer
 *                   description: 更新後的用戶年齡
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權，缺少有效的token
 *       404:
 *         description: 找不到指定用戶
 */
router.put('/:id', checkText, checkJWTAuthorization, checkContentTypeBody, handlePutUser) // 需要token授權

/**
 * @swagger
 * /{env}/users/{id}:
 *   delete:
 *     summary: 刪除指定用戶
 *     description: 用於刪除指定的用戶。需要提供有效的授權令牌。
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: env
 *         required: true
 *         description: API環境 (api, api2, api3)
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         description: 用戶ID
 *         schema:
 *           type: string
 *     security:
 *       - customAuth: []  # 使用自定義的 customAuth 安全方案
 *     responses:
 *       200:
 *         description: 成功刪除用戶
 *       401:
 *         description: 未授權，缺少有效的token
 */
router.delete('/:id', checkText, checkJWTAuthorization, handleDeleteUser) // 需要token授權

export default router
