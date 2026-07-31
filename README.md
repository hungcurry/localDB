
#### 本機開發

```jsx
// ===================
// .env-dev
// ===================
MONGO_URI_PROD=mongodb://127.0.0.1:27017/prodDB
MONGO_URI_DEV=mongodb://127.0.0.1:27017/devDB
MONGO_URI_TEST=mongodb://127.0.0.1:27017/testDB


// ===================
// api/api.js
// ===================
const defaultDatabases = {
  // 根據不同的 path 選擇對應的 Databases
  // *開發環境dev
  api: 'prodDB',
  api2: 'devDB',
  api3: 'testDB',

  // *正式環境prod
  // api: 'nuxt3-test',
  // api2: 'nuxt3-test',
  // api3: 'nuxt3-test',
}


// ===================
// client/js/index.js
// ===================
// * 註冊帳號 ( 開發環境 )
// ooopp42@gmail.com
// curry
// 1234

// * 正式環境
// let URL = 'https://local-db.vercel.app/api2'

// * 開發環境
let URL = 'http://localhost:3000/api2'
```

#### 多資料庫 注意事項

> 資料庫

```jsx
// 這寫法：Model 通常直接綁死在預設的資料庫連線(單一資料庫)
// 單一資料庫 這輸出 出去 就是實體 直接操作方法xx.find()..
export const allModels = [
  // === 無關連表 ===
  UserModel,
  PeopleModel,
  ArticleModel,
  // === 父表 (主表) ===
  // === 子表 (從表) ===
]

// *多資料庫
// 1. 導出的只是一組藍圖設定（純資料）
export const allEntities = [
  { name: 'User', schema: userSchema },
  { name: 'Article', schema: articleSchema },
]

// 2. 根據不同租戶（Tenant）動態綁定連線
const connA = mongoose.createConnection('mongodb://.../tenantA_db')
const connB = mongoose.createConnection('mongodb://.../tenantB_db')

// 3. 用「同一張藍圖」在「不同資料庫」建立各自獨立的 Model
const TenantA_UserModel = connA.model(allEntities[0].name, allEntities[0].schema)
const TenantB_UserModel = connB.model(allEntities[0].name, allEntities[0].schema)

// 4. 操作時完全隔離！
await TenantA_UserModel.create({ name: 'Alice' }) // 寫入 tenantA_db
await TenantB_UserModel.create({ name: 'Bob' })   // 寫入 tenantB_db
```

#### handleAsyncError 原理

> 原本
```jsx
// router/normal.js
import { someController } from '../controllers/someController.js'
router.get('/normal', someController)


// controllers/someController.js
// 每個路由都要寫一次，非常冗長
const someController = async function (req, res, next) {
  try {
    const data = await someDatabaseTask(); // 假設這裡出錯了
    res.send({ message: '成功', data });
  } 
  catch (err) {
    // 你必須手動傳給 next，不然 Express 不知道出錯了
    next(err); 
  }
}
export { someController }
```

> 使用 handleAsyncError後
```jsx
// router/normal.js
import { handleAsyncError } from '../middlewares/errorHandler.js'
import { someController } from '../controllers/someController.js'
router.get('/normal', handleAsyncError(someController))


// middlewares/errorHandler.js
const handleAsyncError = (asyncFn) => {
  return async (req, res, next) => {
    try {
      await asyncFn(req, res, next)
    } 
    catch (err) {
      if (!err) {
        err = new Error('Unknown Error')
      }

      err.statusCode ??= 500
      err.customMessage ??= '伺服器發生錯誤'

      next(err)
    }
  }
}
export { handleAsyncError }

// controllers/someController.js
// Controller 變得超級乾淨，完全不用寫 try...catch
const someController = async (req, res, next) => {
  const data = await someDatabaseTask(); 
  res.send({ message: '成功', data });
}
export { someController }
```

#### 公司localhost 無法連線 MongoDB原因

```jsx
// MongoDB 對接口 : TCP 27017
// pwsh
// 指令: 
Test-NetConnection cluster0.ncgfx.mongodb.net -Port 27017 
// 結果
// WARNING: Name resolution of cluster0.ncgfx.mongodb.net failed

// ComputerName   : cluster0.ncgfx.mongodb.net
// RemoteAddress  : 
// InterfaceAlias : 
// SourceAddress  : 
// PingSucceeded  : False

* // 原因
👉 公司網路（DNS / 防火牆）把 MongoDB 擋掉了


在公司本機啟動的 
http://localhost:3000/api2/users

沒法連線 遠端資料庫MongoDB 因為公司DNS解析失敗,
白話: 公司檔 去連資料庫


解法
1️⃣ 本機後端 + 本機資料庫（✔開發用）
localhost API (Node / Nest / Express)
        ↓
localhost MongoDB / PostgreSQL

2️⃣ 雲端後端 + 雲端資料庫（✔正式環境
Cloud Backend (Vercel / AWS / GCP)
        ↓
MongoDB Atlas / Cloud DB）
```
