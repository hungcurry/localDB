import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from '../../utils/generateJWT.js' // 假設你的檔案路徑在此
import { getConfig } from '../../config/env/index.js'

// 1️⃣ Mock 掉你的 config 模組，這樣我們才能在測試中自由控制環境變數
jest.mock('../../config/env/index.js')

describe('測試元件📅-Token簽發與驗證', () => {
  const mockPayload = { userId: 'user123', role: 'admin' }
  const mockSecret = 'test-secret-key-1234567890'

  // 在每個測試案例執行前，先給予一個標準的假設定值
  beforeEach(() => {
    jest.clearAllMocks()

    // 預設 getConfig 呼叫時會回傳標準測試設定
    getConfig.mockImplementation((key) => {
      if (key === 'secret.jwtSecret') return mockSecret
      if (key === 'secret.jwtExpiresDay') return '1h'
      return null
    })
  })

  // ==========================================
  // 🎯 測試項目 A：成功情境
  // ==========================================
  describe('成功情境', () => {
    it('應該要能成功簽發 Token，且解碼內容必須與 Payload 一致', () => {
      // 執行簽發
      const token = signToken(mockPayload)

      // 斷言：簽出來的 token 必須是字串型態
      expect(typeof token).toBe('string')

      // 執行驗證解碼
      const decoded = verifyToken(token)

      // 斷言：解碼出來的資料，必須包含我們當初塞進去的 userId 和 role
      // 使用 toMatchObject 是因為解碼後會多出 jwt 自帶的 iat (簽發時間) 和 exp (過期時間)
      expect(decoded).toMatchObject(mockPayload)
    })

    it('當設定檔沒有過期時間時，應該使用預設值 1d 成功簽發', () => {
      // 模擬環境：過期時間不存在
      getConfig.mockImplementation((key) => {
        if (key === 'secret.jwtSecret') return mockSecret
        return null // jwtExpiresDay 回傳 null
      })

      const token = signToken(mockPayload)
      expect(typeof token).toBe('string')

      const decoded = jwt.decode(token)
      // 驗證預設過期時間是否為一天（一天 = 86400 秒）
      const duration = decoded.exp - decoded.iat
      expect(duration).toBe(86400)
    })
  })

  // ==========================================
  // 🎯 測試項目 B：失敗與防呆情境
  // ==========================================
  describe('失敗與防呆情境', () => {
    it('當系統遺失 JWT_SECRET 時，簽發應該要直接拋出錯誤', () => {
      // 模擬極端環境：密鑰不小心變成 undefined 或空值
      getConfig.mockReturnValue(undefined)

      // 斷言：預期它會拋出專有的錯誤訊息
      // 注意：測試拋出錯誤時，expect 內必須傳入一個「函式包裹」，不能直接執行它
      expect(() => {
        signToken(mockPayload)
      }).toThrow('JWT_SECRET is not defined in config')
    })

    it('當傳入被竄改或無效的 Token 時，驗證應該要拋出錯誤', () => {
      const invalidToken = 'this.is.an.invalid.token'

      expect(() => {
        verifyToken(invalidToken)
      }).toThrow()
    })

    it('當 Token 已過期時，驗證應該要拋出 jwt expired 錯誤', async () => {
      // 模擬環境：簽發一個過期時間為 0 秒的 Token (立刻過期)
      getConfig.mockImplementation((key) => {
        if (key === 'secret.jwtSecret') return mockSecret
        if (key === 'secret.jwtExpiresDay') return '0s' // 0秒
        return null
      })

      const expiredToken = signToken(mockPayload)

      expect(() => {
        verifyToken(expiredToken)
      }).toThrow('jwt expired')
    })
  })
})
