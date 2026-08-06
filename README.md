## 專案快速啟動

#### localDB

> 指令

```jsx
// 🚀 啟動資料庫
// ---
// ~GUI
// MongoDB =>  MongoDB Compass
// Postgres => DBeaver

// 啟動資料庫（背景執行）
docker-compose up -d

// 停止資料庫（保留資料）
docker-compose down

// 重置資料庫（刪volume）
docker-compose down -v

// 查看目前運行狀態
docker-compose ps
```

> 資料庫差異

```jsx
// 本地開發
是使用同 `1個網址` 
// 'mongodb://127.0.0.1:27017/'
去對應不同 Database : prodDB / devDB / testDB

// MongoDB Atla
是使用開3個專案 獲得 `3個網址`
// api: 'mongodb+srv://ooopp42:<密碼>@<專案prod>.mongodb.net/',
// api2: 'mongodb+srv://ooopp42:<密碼>@<專案dev>.mongodb.net/',
// api3: 'mongodb+srv://ooopp42:<密碼>@<專案test>.mongodb.net/',

去對應Database : nuxt3-test
```

> 檔案順序

```jsx
// npm run dev
初始流程: index.js => conn.js  => databases.js

// 因為走API 會先從 Router(app.js) 觸發
API流程:  app.js => conn.js => auth.js
```

> 網址

```jsx
// *api
http://localhost:3000/api/users
http://localhost:3000/api/users/get-users

// *查看生成的 API 文檔
http://localhost:3000/api-docs

// *websocket
ws://localhost:3000/ws
ws://localhost:3000/ws2

// *public
http://localhost:3000/about.html
http://localhost:3000/stylesheets/style.css

// *ejs模板首頁
http://localhost:3000

```

#### 本機開發

> 檔案修改

```jsx
// ===================
// .env-dev
// ===================
MONGO_URI_PROD=mongodb://127.0.0.1:27017/prodDB
MONGO_URI_DEV=mongodb://127.0.0.1:27017/devDB
MONGO_URI_TEST=mongodb://127.0.0.1:27017/testDB


// ===================
// config/databases.js
// ===================
const envDbMap = {
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
// 單一資料庫：直接用 Model
// 因為只有一個資料庫，所以 Model 一建立就固定綁定那個 Connection
// 例如：const UserModel = mongoose.model('UserModel', userSchema)
// 之後整個專案都用
// UserModel.find()
export const allModels = [
  // === 無關連表 ===
  UserModel,
  PeopleModel,
  ArticleModel,
  // === 父表 (主表) ===
  // === 子表 (從表) ===
]

// *多資料庫：不能直接用 Model
// *藍圖概念
// *使用 共用同一份 Schema 去產生每個資料庫建立自己的 Model
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

> 原因

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
