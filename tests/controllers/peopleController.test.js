// Express API 整合測試 (API Integration Testing)
import request from 'supertest'
import express from 'express'
import bcrypt from 'bcryptjs'
import { handleGetPeople, handlePostPerson } from '../../server/controllers/peopleController.js'
import { getDBPeople, postDBPeople } from '../../db/index.js'

// 攔截資料庫零件，不連實體 MongoDB
jest.mock('../../db/index.js')
// 讓它永遠回傳一個固定的假 UUID 字串
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1111-2222-3333',
}))

const app = express()
app.use(express.json())

// 為各路由綁定對應的控制器處理函式
const sendSuccess = (dataKey, statusCode = 200) => {
  return (req, res) => {
    res.status(statusCode).json({
      status: 'success',
      data: req[dataKey], // 💡 動態讀取 req.newUser 或 req.users
    })
  }
}
app.post('/api2/signup', handleGetPeople, handlePostPerson, sendSuccess('newUser', 201))
app.get('/api2/login', handleGetPeople, sendSuccess('users', 200))

// 全域錯誤處理中間件（處理 next(error)）
app.use((err, req, res, next) => {
  res.status(500).json({ status: 'error', message: err.message })
})

describe('測試元件📅-People控制器', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // 🎯 測試項目 A：成功註冊情境
  // ==========================================
  describe('成功註冊情境', () => {
    it('應成功將陣列轉為物件、加密密碼、並完成註冊', async () => {
      // 1. 模擬現有的資料庫用戶（陣列格式）
      const mockExistingPeople = [{ email: 'existing@gmail.com', password: 'hashed_password', username: 'old_user' }]
      getDBPeople.mockResolvedValue(mockExistingPeople)

      // 2. 模擬寫入資料庫成功後回傳的新用戶物件
      const mockSavedUser = { id: 'mock-uuid-123', email: 'curry@gmail.com', username: 'curry' }
      postDBPeople.mockResolvedValue(mockSavedUser)

      // 3. 準備發送的新註冊資料
      const registerPayload = {
        email: 'curry@gmail.com',
        username: 'curry',
        password: 'plainpassword123',
      }

      // 4. 發動真實 HTTP 請求
      const response = await request(app).post('/api2/signup').send(registerPayload)

      // 5. 斷言驗證
      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        status: 'success',
        data: mockSavedUser,
      })

      // 驗證進階邏輯：postDBPeople 被呼叫時，密碼欄位絕對不能是明文 'plainpassword123'
      // 它必須是被 bcrypt 加密過的 hash 碼（通常以 $2b$ 開頭）
      const calledArgs = postDBPeople.mock.calls[0][0]
      expect(calledArgs.password).not.toBe('plainpassword123')

      const isPasswordEncrypted = await bcrypt.compare('plainpassword123', calledArgs.password)
      expect(isPasswordEncrypted).toBe(true) // 確保真的能用原密碼比對成功
    })
  })

  // ==========================================
  // 🎯 測試項目 B：登入與獲取用戶情境
  // ==========================================
  describe('登入與獲取用戶情境', () => {
    it('應成功將陣列轉為物件並完成撈取', async () => {
      // 1. 模擬資料庫回應的陣列格式用戶列表
      const mockExistingPeople = [
        { email: 'curry@gmail.com', password: 'hashed_password_1', username: 'curry' },
        { email: 'aaa@gmail.com', password: 'hashed_password_2', username: '123' },
      ]
      getDBPeople.mockResolvedValue(mockExistingPeople)

      // 2. 發動真實 GET 請求訪問登入端點
      const response = await request(app).get('/api2/login')

      // 3. 斷言驗證：應回傳 200 成功狀態
      expect(response.status).toBe(200)

      // 4. 驗證回傳的格式是否成功將陣列轉為以 Email 為鍵的物件（配合真實邏輯，剔除內層的 email 欄位）
      expect(response.body).toEqual({
        status: 'success',
        data: {
          'curry@gmail.com': { password: 'hashed_password_1', username: 'curry' },
          'aaa@gmail.com': { password: 'hashed_password_2', username: '123' },
        },
      })
    })

    it('當資料庫讀取失敗時，應由全域錯誤處理攔截並回傳 500', async () => {
      // 模擬資料庫突然斷線或拋出嚴重錯誤
      getDBPeople.mockRejectedValue(new Error('資料庫連線失敗'))

      const response = await request(app).get('/api2/login')

      // 斷言：應回傳 500 伺服器錯誤
      expect(response.status).toBe(500)
      expect(response.body.message).toContain('資料庫連線失敗')
    })
  })

  // ==========================================
  // 🎯 測試項目 C：失敗與校驗情境
  // ==========================================
  describe('失敗與校驗情境', () => {
    it('當缺少必要欄位（例如少傳密碼）時，應攔截並回傳 400 錯誤', async () => {
      // 雖然欄位會錯，但第一關 handleGetPeople 還是會跑，所以要給它預設回傳值
      getDBPeople.mockResolvedValue([])

      const incompletePayload = {
        email: 'curry@gmail.com',
        username: 'curry',
        // 漏掉了 password
      }

      const response = await request(app).post('/api2/signup').send(incompletePayload)

      // 斷言：應該被 utilSendErrorResponse 攔截
      expect(response.status).toBe(400)
      // 這裡你可以根據你 utilSendErrorResponse 吐出來的真實格式去對，以下為假設
      expect(response.body.message).toContain('缺少或空的必要欄位')
    })

    it('當 Email 已經被註冊過時，應攔截並回傳 400 用戶已存在', async () => {
      // 模擬資料庫：aaa@gmail.com 已經存在了
      const mockExistingPeople = [{ email: 'aaa@gmail.com', password: 'hashed_password', username: '123' }]
      getDBPeople.mockResolvedValue(mockExistingPeople)

      // 前端白目，明知故犯，再次用 aaa@gmail.com 註冊
      const duplicatePayload = {
        email: 'aaa@gmail.com',
        username: 'curry',
        password: 'password123',
      }

      const response = await request(app).post('/api2/signup').send(duplicatePayload)

      // 斷言：應被阻擋
      expect(response.status).toBe(400)
      expect(response.body.message).toContain('用戶已存在')

      // 防呆確保：因為用戶已存在，底層的 postDBPeople 絕對一秒都不准被觸發！
      expect(postDBPeople).not.toHaveBeenCalled()
    })

    it('當資料庫寫入失敗時，應回傳 500 伺服器錯誤', async () => {
      getDBPeople.mockResolvedValue([])
      // 模擬極端狀況：資料庫突然寫入失敗，回傳 null 或 undefined
      postDBPeople.mockResolvedValue(null)

      const payload = { email: 'test@gmail.com', username: 'test', password: 'password' }

      const response = await request(app).post('/api2/signup').send(payload)

      expect(response.status).toBe(500)
      expect(response.body.message).toContain('無法儲存用戶資料')
    })
  })
})
