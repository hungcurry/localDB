#### 單元測試

```jsx
// 單元測試
const mockData = {
  userId: 1,
  id: 1,
  title: 'delectus aut autem',
  completed: false,
}
// 假函式
const getUserData = vi.fn()
// 設定回傳值
getUserData.mockResolvedValue({ data: mockData })
// 非同步路由 (假裝打 API)
const result = await getUserData('/api/user')
console.log(result.data) // mockData
```

#### Express API 整合測試

```jsx
// Express API 整合測試 (API Integration Testing)
import request from 'supertest'
import express from 'express'
import { handleGetUsers } from '../controllers/userController.js'
import { getDBUsers } from '../db/index.js'

// 1️⃣ 攔截底層的資料庫零件（不讓它真的連線）
jest.mock('../db/index.js')
const app = express()
app.use(express.json())

// 為各路由綁定對應的控制器處理函式
app.get('/api2/users', handleGetUsers)
app.post('/api2/users', handlePostUser)
app.put('/api2/users/:id', handlePutUser)
app.delete('/api2/users/:id', handleDeleteUser)

describe('測試元件📅-User控制器', () => {
  beforeEach(() => {
    // 每次測試前重置模擬函式的呼叫紀錄與狀態
    jest.clearAllMocks()
  })

  it('成功獲取所有用戶', async () => {
    // 2️⃣ 準備資料庫被攔截時要回傳的「假資料」
    const mockUsers = [
      { id: 77, name: 'Bob', role: 'Frontend' },
      { id: 99, name: 'Toby', role: 'Backend' },
    ]
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
})
```

#### .jest.fn 相等語法整理

```jsx
describe('測試元件📅-vi.fn() 的基本用法', () => {
  it('vi.fn()', async () => {
    // ~1.mock 函式
    // 使用 vi.fn() 用於創建一個模擬函式
    // const mockFn = vi.fn()
    // console.log(mockFn)

    // ~2.預設 默認回傳值: undefined
    // console.log(mockFn()) // undefined

    // ~3.模擬函式的回傳值(永遠回傳 'apple'（固定值）)
    // mockFn.mockReturnValue('apple')
    // console.log(mockFn()) // apple
    // expect(mockFn()).toBe('apple')

    // ~4.模擬函式的檢查
    // mockFn('arg1', 'arg2')
    // // 檢查是否被調用過
    // expect(mockFn).toHaveBeenCalled()
    // // 檢查調用時的參數
    // expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')

    // ~5.先設定=> 自定義 回傳值 / 行為 (動態值)
    // const mockFn2 = vi.fn(() => ({ name: '🍋' }))
    // console.log(mockFn2()) // { name:'🍋' }

    // ~6.後設定=> 自定義 回傳值 / 行為 (動態值)
    // ~mockImplementation(...)
    // ~包一個函式，每次可以回傳不同值（根據邏輯或參數）
    // const mockFn3 = vi.fn()
    // mockFn3.mockImplementation(() => ({ name: '🍊' }))
    // console.log(mockFn3()) // { name:'🍊' }

    // -------------------------------------

    // ~7.模擬 async 函式（Promise）回傳值或錯誤！
    // ~.mockResolvedValue(...) / .mockRejectedValue(...)
    const mockData = {
      name: 'Mike',
    }
    const mockApi = vi.fn().mockResolvedValue(mockData)
    // 相當於：async () => ({ name: 'Mike' })
    console.log(mockApi()) // 假資料 Promise { { name: 'Mike' } }

    // ~8.同步用法
    const mockFn = vi.fn(() => ({ name: '🍋' }))
    console.log('1=>', mockFn()) // { name:'🍋' }
    // 等同於 (後設定)
    const mockFn2 = vi.fn()
    mockFn2.mockImplementation(() => ({ name: '🍋' }))
    console.log('2=>', mockFn2()) // { name:'🍋' }
    // ------------------
    // ~9.非同步用法
    const mockFn3 = vi.fn(() => Promise.resolve({ name: '🍊' }))
    console.log('3=>', mockFn3()) // Promise { { name: '🍊' } }

    // 等同於
    const mockFn4 = vi.fn()
    mockFn4.mockImplementation(() => Promise.resolve({ name: '🍊' }))
    console.log('4=>', mockFn4()) // Promise { { name: '🍊' } }

    // 等同於
    const mockFn5 = vi.fn()
    mockFn5.mockResolvedValue({ name: '🍊' })
    console.log('5=>', mockFn5()) // Promise { { name: '🍊' } }
  })
})
```
