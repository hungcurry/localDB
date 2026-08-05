// Express API 整合測試 (API Integration Testing)
import request from 'supertest'
import express from 'express'
import {
  handleGetUsers,
  handlePostUser,
  handlePutUser,
  handleDeleteUser,
} from '../../controllers/userController.js'
import { getDBUsers, postDBUser, updateDBUser, deleteDBUser } from '../../services/index.js'

// 模擬資料庫模組，防止實際連接到資料庫
jest.mock('../../services/index.js')

const app = express()
app.use(express.json())

// 為各路由綁定對應的控制器處理函式
app.get('/api2/users', handleGetUsers)
app.post('/api2/users', handlePostUser)
app.put('/api2/users/:id', handlePutUser)
app.delete('/api2/users/:id', handleDeleteUser)

// 全域錯誤處理中間件（處理 next(error)）
app.use((err, req, res, next) => {
  res.status(500).json({ status: 'error', message: err.message })
})

describe('測試元件📅-User控制器', () => {
  beforeEach(() => {
    // 每次測試前重置模擬函式的呼叫紀錄與狀態
    jest.clearAllMocks()
  })

  // ==========================================
  // 🎯 測試項目 A：成功註冊情境
  // ==========================================
  describe('成功註冊情境', () => {
    it('成功獲取所有用戶', async () => {
      // 準備模擬用戶資料
      const mockUsers = [
        { _id: '1', name: '用戶1', age: 25 },
        { _id: '2', name: '用戶2', age: 30 },
      ]

      /**
       * 【真實情況】
          前端 ──> Router ──> handleGetUsers ──> getDBUsers ──> (真的去敲 MongoDB 門)
      -------------------------------
      * 【測試 Mock 情況】
          Supertest ──> Router ──> handleGetUsers ──> getDBUsers ──X (被 Mock 攔截！秒回傳假資料)
      * 
      */
      // 當 Controller 執行到 getDBUsers() 時，特務 (Jest) 會攔截並秒回傳此資料
      getDBUsers.mockResolvedValue(mockUsers)

      // 3️⃣ 🎯 核心：模擬前端發送真實的 HTTP 請求
      // 【用意】request(app) 會在記憶體中啟動這個 Express 服務
      // .get('/api/users') 就像是 Postman 點擊 Send 一樣，真正走過路由與中間件
      const response = await request(app).get('/api2/users')

      // 4️⃣ 驗證最終結果（打開 Express 回傳的漢堡包檢查）
      // 驗證狀態碼是不是 Express 回傳的 200
      expect(response.status).toBe(200)
      // 驗證 Content-Type 是不是 JSON 格式
      expect(response.headers['content-type']).toMatch(/json/)
      // 驗證經過 Controller 包裝後的 JSON 內容是否完全符合預期
      expect(response.body).toEqual({
        status: 'success',
        data: mockUsers,
        statecode: 200,
      })

      // 驗證 service 是否真的被 controller 呼叫
      expect(getDBUsers).toHaveBeenCalledTimes(1)
    })

    it('成功創建新用戶', async () => {
      const newUser = { name: '新用戶', age: 35 }
      const createdUser = { _id: '3', ...newUser }
      // 模擬 postDBUser 回傳新增成功的用戶資料
      postDBUser.mockResolvedValue(createdUser)

      // 發送 POST 請求
      const response = await request(app).post('/api2/users').send(newUser)
      // .send(newUser) 就是把 newUser 這個物件放在 HTTP 請求的 body 裡面，模擬前端發送資料的行為

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

    it('成功更新用戶', async () => {
      const userId = '1'
      const updateData = { name: '更新用戶', age: 40 }
      // 模擬更新成功，回傳 matchedCount: 1
      updateDBUser.mockResolvedValue({ matchedCount: 1 })

      // 發送 PUT 請求
      const response = await request(app).put(`/api2/users/${userId}`).send(updateData)
      // .send(updateData) 就是把 updateData 這個物件放在 HTTP 請求的 body 裡面，模擬前端發送資料的行為

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

    it('成功刪除用戶', async () => {
      const userId = '1'
      // 模擬刪除成功，回傳 deletedCount: 1
      deleteDBUser.mockResolvedValue({ deletedCount: 1 })

      const response = await request(app).delete(`/api2/users/${userId}`)

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
  })

  // ==========================================
  // 🎯 測試項目 ：失敗與校驗情境
  // ==========================================
  describe('失敗與校驗情境', () => {
    it('嘗試更新不存在的用戶', async () => {
      const userId = 'nonexistent'
      const updateData = { name: '不存在用戶', age: 50 }
      // 模擬未找到用戶，回傳 matchedCount: 0
      updateDBUser.mockResolvedValue({ matchedCount: 0 })

      const response = await request(app).put(`/api2/users/${userId}`).send(updateData)

      // 驗證回應狀態碼與內容
      expect(response.status).toBe(404)
      expect(response.body.message).toContain('User not found')
    })

    it('嘗試刪除不存在的用戶', async () => {
      const userId = 'nonexistent'
      // 模擬未找到用戶，回傳 deletedCount: 0
      deleteDBUser.mockResolvedValue({ deletedCount: 0 })

      const response = await request(app).delete(`/api2/users/${userId}`)

      // 驗證回應狀態碼與內容
      expect(response.status).toBe(404)
      expect(response.body.message).toContain('User not found')
    })
  })
})
