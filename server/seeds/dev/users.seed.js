import { Types } from 'mongoose'

/**
 * 正式環境所需的基礎系統資料
 * UUID 採用固定值，確保跨環境與多次執行時的一致性
 */
export const mockUsersDev = [
  {
    _id: new Types.ObjectId('6a5498a6d52c1cb386450001'), // 💡 轉成真正的 ObjectId 物件
    age: 38,
    name: '本機-開發環境',
  },
  {
    _id: new Types.ObjectId('6a5498a6d52c1cb386450002'), // 💡 轉成真正的 ObjectId 物件
    age: 38,
    name: '開發-currylee',
  },
]
