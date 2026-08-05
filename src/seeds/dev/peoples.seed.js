import { Types } from 'mongoose'

/**
 * 正式環境所需的基礎系統資料
 * UUID 採用固定值，確保跨環境與多次執行時的一致性
 */
export const mockPeoples = [
  {
    _id: new Types.ObjectId('6a6ade3226fb27719dc18d88'),
    email: 'ooopp42@gmail.com',
    password: '$2b$10$uP1VZo9TmxqZuupRwMMnZ.lUAw7GNrNlaAftr2iwSmbylePhJGpia',
    username: 'curry',
    createdAt: new Date('2026-07-30T05:16:34.593Z'),
    updatedAt: new Date('2026-07-30T05:16:34.593Z'),
  },
]
