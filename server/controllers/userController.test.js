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
import { handleGetUsers, handlePostUser, handlePutUser, handleDeleteUser } from './userController.js'
import { getDBUsers, postDBUser, updateDBUser, deleteDBUser } from '../../db/index.js'

jest.mock('../../db/index.js')

const app = express()
app.use(express.json())
app.get('/api/users', handleGetUsers)
app.post('/api/users', handlePostUser)
app.put('/api/users/:id', handlePutUser)
app.delete('/api/users/:id', handleDeleteUser)

describe('User控制器測試', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('成功獲取所有用戶', async () => {
    const mockUsers = [
      { _id: '1', name: '用戶1', age: 25 },
      { _id: '2', name: '用戶2', age: 30 },
    ]
    getDBUsers.mockResolvedValue(mockUsers)

    const response = await request(app).get('/api/users')
    console.log(response.body)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      data: mockUsers,
      statecode: 200,
    })
    expect(getDBUsers).toHaveBeenCalledTimes(1)
  })

  test('成功創建新用戶', async () => {
    const newUser = { name: '新用戶', age: 35 }
    const createdUser = { _id: '3', ...newUser }
    postDBUser.mockResolvedValue(createdUser)

    const response = await request(app).post('/api/users').send(newUser)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      status: 'success',
      data: createdUser,
      statecode: 201,
    })
    expect(postDBUser).toHaveBeenCalledWith(newUser)
  })

  test('成功更新用戶', async () => {
    const userId = '1'
    const updateData = { name: '更新用戶', age: 40 }
    updateDBUser.mockResolvedValue({ matchedCount: 1 })

    const response = await request(app).put(`/api/users/${userId}`).send(updateData)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      statecode: 200,
      message: 'Updated successfully',
    })
    expect(updateDBUser).toHaveBeenCalledWith({ _id: userId }, updateData)
  })

  test('成功刪除用戶', async () => {
    const userId = '1'
    deleteDBUser.mockResolvedValue({ deletedCount: 1 })

    const response = await request(app).delete(`/api/users/${userId}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'success',
      statecode: 200,
      message: 'User deleted successfully',
    })
    expect(deleteDBUser).toHaveBeenCalledWith({ _id: userId })
  })

  test('嘗試更新不存在的用戶', async () => {
    const userId = 'nonexistent'
    const updateData = { name: '不存在用戶', age: 50 }
    updateDBUser.mockResolvedValue({ matchedCount: 0 })

    const response = await request(app).put(`/api/users/${userId}`).send(updateData)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      status: 'false',
      statecode: 404,
      message: 'User not found',
    })
  })

  test('嘗試刪除不存在的用戶', async () => {
    const userId = 'nonexistent'
    deleteDBUser.mockResolvedValue({ deletedCount: 0 })

    const response = await request(app).delete(`/api/users/${userId}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      status: 'false',
      statecode: 404,
      message: 'User not found',
    })
  })
})
