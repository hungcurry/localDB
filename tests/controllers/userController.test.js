// #region jest ES6安裝方式
// ------------------------------
// 1.npm i -D jest supertest
// 2.vscode jest
// 3.npm install --save-dev babel-jest @babel/preset-env
// 4. add .babelrc 文件
// ---
// {
//   "presets": ["@babel/preset-env"]
// }
// ---

// 5. addpackage.json
// ---
// "type": "module",
// "scripts": {
//   "test:watch": "jest --watchAll"
// },
// ---

// 6. 測試
// npm run test:watch

// ------------------------------
// #endregion
import request from 'supertest'
import express from 'express'
import {
  handleGetUsers, 
  handlePostUser, 
  handlePutUser, 
  handleDeleteUser 
} from '../../server/controllers/userController.js'
import { 
  getDBUsers, 
  postDBUser, 
  updateDBUser, 
  deleteDBUser 
} from '../../db/index.js'

// 模擬資料庫模組，防止實際連接到資料庫
jest.mock('../../db/index.js')

const app = express()
app.use(express.json())

// 為各路由綁定對應的控制器處理函式
app.get('/api/users', handleGetUsers)
app.post('/api/users', handlePostUser)
app.put('/api/users/:id', handlePutUser)
app.delete('/api/users/:id', handleDeleteUser)

describe('User控制器測試', () => {
  beforeEach(() => {
    // 每次測試前重置模擬函式的呼叫紀錄與狀態
    jest.clearAllMocks()
  })

  test('成功獲取所有用戶', async () => {
    // 準備模擬用戶資料
    const mockUsers = [
      { _id: '1', name: '用戶1', age: 25 },
      { _id: '2', name: '用戶2', age: 30 },
    ]
    // 模擬 getDBUsers 回傳模擬資料
    getDBUsers.mockResolvedValue(mockUsers)

    // 發送 GET 請求
    const response = await request(app).get('/api/users')

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      data: mockUsers,
      statecode: 200,
    })
    // 確認模擬函式被呼叫一次
    expect(getDBUsers).toHaveBeenCalledTimes(1)
  })

  test('成功創建新用戶', async () => {
    const newUser = { name: '新用戶', age: 35 }
    const createdUser = { _id: '3', ...newUser }
    // 模擬 postDBUser 回傳新增成功的用戶資料
    postDBUser.mockResolvedValue(createdUser)

    // 發送 POST 請求
    const response = await request(app).post('/api/users').send(newUser)

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      status: 'success',
      data: createdUser,
      statecode: 201,
    })
    // 確認模擬函式接收正確參數
    expect(postDBUser).toHaveBeenCalledWith(newUser)
  })

  test('成功更新用戶', async () => {
    const userId = '1'
    const updateData = { name: '更新用戶', age: 40 }
    // 模擬更新成功，回傳 matchedCount: 1
    updateDBUser.mockResolvedValue({ matchedCount: 1 })

    // 發送 PUT 請求
    const response = await request(app).put(`/api/users/${userId}`).send(updateData)

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      statecode: 200,
      message: 'Updated successfully',
    })
    // 確認模擬函式接收正確參數
    expect(updateDBUser).toHaveBeenCalledWith({ _id: userId }, updateData)
  })

  test('成功刪除用戶', async () => {
    const userId = '1'
    // 模擬刪除成功，回傳 deletedCount: 1
    deleteDBUser.mockResolvedValue({ deletedCount: 1 })

    const response = await request(app).delete(`/api/users/${userId}`)

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      statecode: 200,
      message: 'User deleted successfully',
    })
    // 確認模擬函式接收正確參數
    expect(deleteDBUser).toHaveBeenCalledWith({ _id: userId })
  })

  test('嘗試更新不存在的用戶', async () => {
    const userId = 'nonexistent'
    const updateData = { name: '不存在用戶', age: 50 }
    // 模擬未找到用戶，回傳 matchedCount: 0
    updateDBUser.mockResolvedValue({ matchedCount: 0 })

    const response = await request(app).put(`/api/users/${userId}`).send(updateData)

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      status: 'false',
      statecode: 404,
      message: 'User not found',
    })
  })

  test('嘗試刪除不存在的用戶', async () => {
    const userId = 'nonexistent'
    // 模擬未找到用戶，回傳 deletedCount: 0
    deleteDBUser.mockResolvedValue({ deletedCount: 0 })

    const response = await request(app).delete(`/api/users/${userId}`)

    // 驗證回應狀態碼與內容
    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      status: 'false',
      statecode: 404,
      message: 'User not found',
    })
  })
})
