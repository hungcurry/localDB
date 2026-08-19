## 專案快速啟動

### localDB

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
口訣: indexjs 從上到下 先看import的檔案順序
// npm run dev
// console 寫在 (Top-level)
初始流程:  檔案載入順序 
databases.js => conn.js => (mid/router/controller) => app.js  => index.js

// 走router觸發
// console 寫在 (Function 內部) 
// 因為走API 會先從 Router(app.js 的 req 那邊) 觸發
API流程:  邏輯執行順序
app.req/函式內 => conn/函式內 => mid/函式內 => controller/函式內
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


### 本機開發

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


### 時間格式

> 時間格式

```jsx
2026 年 8 月 18 日 上午 9:20
// ==============================
// Timestamp  ( UTC+0 )
// ==============================
Date.now()
// 型別
number
// 範例
1787016000000（13 位數）毫秒

// 說明
// 自 1970-01-01T00:00:00.000Z (Unix Epoch)
// 起算經過的毫秒數

// ==============================
// Date Object
// ==============================
new Date()
// 型別
Date (object)
// 範例
Tue Aug 18 2026 09:20:00 GMT+0800 (台北標準時間)

// 說明
// JavaScript 原生日期物件
// 可進行日期計算、格式轉換等操作

// ==============================
// ISO 8601 ( UTC+0 )
// ==============================
new Date().toISOString()
// 型別
string
// 範例
"2026-08-18T01:20:00.000Z"

// 說明
// 國際標準日期時間格式
// Z = UTC 時區
// 常用於 API、JSON、資料庫儲存與傳輸
```

> 標準流程

```jsx
核心規範清單
1. DB Schema（資料庫設計）
* PostgreSQL：全專案時間欄位一律定義為 timestamptz（強制 UTC+0 儲存）。
* MongoDB：欄位型態一律使用原生 Date，Schema 開啟 { timestamps: true }。

2. Backend（後端寫入/邏輯）
* 建立與更新時間：一律傳入 JavaScript 原生 new Date() 物件。
* ⚠️ 禁止事項：寫入 ORM 時禁止手動傳入 new Date().toISOString() 字串，
  防止無時區欄位發生二次時區偏移。

3. API 傳輸層
* 統一格式：回傳給前端的時間欄位，一律序列化為標準 ISO 8601 UTC 字串
 （帶結尾 Z，例如 2026-08-14T08:12:47.000Z）。 => // UTC+0

4. Frontend（前端畫面渲染）
* 責任歸屬：前端拿到 UTC 字串後，僅在「渲染到 UI」時使用日期工具庫
 （如 Day.js）轉為使用者當前時區（如 UTC+8）顯示。
* 範例：dayjs(item.paidAt).format('YYYY-MM-DD HH:mm:ss')。

結論
---
API:網址
http://localhost:8080/api/coaches/skill

* 資料庫底層存儲（UTC+0）：2026-08-17 06:22:06.915
// 這邊 只是為了方便觀看UI 轉UTC+8 ( 資料庫還是 +0 )
* DBeaver（本地 UTC+8）：2026-08-17 14:22:06.915
* API 回傳（標準 ISO 8601 UTC+0）："2026-08-17T06:22:06.915Z"
```

> 資料庫差異

```jsx
假設台灣時間 9:20
09:20:36.503 +08:00


1. PostgreSQL (TypeORM / Prisma)
推薦全專案欄位統一改為 `timestamptz`

自動產生的 : createdAt: ( UTC+0 )

手動傳入的 : paid_at: new Date() ( Date 物件，代表 09:20:00 台灣這個時間點 )
            // Fri Aug 14 2026 09:20:49 GMT+0800 (台北標準時間) {}
            // ⚠️ Date 本身不保存台灣時區
            paid_at: new Date().toISOString() ( UTC+0 ISO 8601 )
            // 2026-08-14T01:20:00.000Z  => 有時區 UTC+0
          
// !地雷地方 : timestamp
// ❌ 09:20:00 (被誤補 +8 小時)
type : `timestamp` 不能搭配 new Date().toISOString()
new Date().toISOString() 會產生 2026-08-14T01:20:36.503Z 這邊都是對的
然後交給 PostgreSQL 遇到 timestamp (無時區)
PostgreSQL 需要把這個「帶有 UTC 時區的時間」塞進一個
沒有時區的 timestamp
所以會依 PostgreSQL session timezone 做轉換
Asia/Taipei 是 UTC + 8
所以 轉成UTC + 8
2026-08-14T01:20:36.503Z
              ↓
       + 8 小時
              ↓
2026-08-14 09:20:36.503
最後 timestamp 裡面只剩：
2026-08-14 09:20:36.503
// --------
寫入 : 轉成 UTC+0 時間 儲存
// 讀取時可根據 Session 時區自動轉換 (timezone)
// 如果連線時區是 Asia/Taipei（+08:00），
// PostgreSQL 就會把底層存的 UTC 時間加上 8 小時展示給你看
看UI : UTC+8 (方便給人看得)
讀出 : 維持 UTC+0


2. MongoDB (Mongoose)
欄位型態直接使用原生 Date
`timestamps: true`
{
  // 對應資料表名稱 ( 複數 + snake_case + 小寫 )
  collection: 'users',
  // 自動處理 createdAt, updatedAt
  timestamps: true,
},

自動產生的 : createdAt ( UTC+0 )
手動傳入的 : new Date() 或 ISO 字串皆可 ( UTC+0 )
// --------
轉成 UTC+0  儲存 (64-bit 毫秒整數)
寫入 : 轉成 UTC+0 時間 儲存
看UI : UTC+0 (方便給人看得)
讀出 : 維持 UTC+0 時間 給你


結論: 資料庫存同一個 保存時間點（Instant）
PostgreSQL：型態有分 
timestamp（無時區，易踩雷）
timestamptz（帶時區，推薦）。

MongoDB：沒有型態選擇問題，原生 Date / ISODate 
就是強制鎖定 UTC+0，設定 timestamps: true 即可直接符合標準規範。
// UTC+0
// 2026-08-14 01:20:00+00
// UTC+8
// 2026-08-14 09:20:00+08
// 這兩個：是同一個時間點（Instant）別糾結
```

> 各資料庫寫法

```jsx
2026/8/18 9:20分
---
* Date.now()：
// 1787016000000
* new Date()（以字串表示）：
// Tue Aug 18 2026 09:20:00 GMT+0800 (台北標準時間)
* new Date().toISOString()：
// 2026-08-18T01:20:00.000Z


// ==============================
// Mongose
// ==============================
Timestamp  =>  1787016000000 (毫秒-number)
----
export const orderSchema = new Schema<TOrder>(
  {
    // Timestamp  =>  1787016000000 (毫秒-number)
    // ----------
    // 💡 手動定義時間戳記欄位為 Number
    // 不交給 Mongoose 自動管理
    createdAt: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: Number,
      required: true,
    },
  },
  {
    // 自動處理 createdAt, updatedAt
    // 預設: true 會產生 格式: 2026-01-01T00:00:00.000Z
    // 💡 關鍵：關閉自動 timestamps，
    // 改由我們在假資料或業務邏輯中手動帶入
    timestamps: false,
  },
)
// type
export type TOrder = {
  // Timestamp  =>  1787016000000 (毫秒-number)
  // ----------
  createdAt: number
  updatedAt: number
}
// seed
export const mockOrders: TOrder[] = [
  {
    // Timestamp
    // Date.now() => 1787016000000 (毫秒-number)
    // --------
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]


// * 現在主流用這方式
ISO 8601 => "2026-06-12T06:08:46.000Z"
---
export const productSchema = new Schema<TProduct>(
  {
    // ISO 8601 => "2026-06-12T06:08:46.000Z"
    // ----------
    // 💡 註：在 Mongoose 中，底下的 timestamps: true
    // 會自動產生與維護 createdAt 和 updatedAt
    不需要寫
    // createdAt:
    // updatedAt:
  },
  {
    // 自動處理 createdAt, updatedAt
    // 預設: true 會產生 格式: 2026-01-01T00:00:00.000Z
    // 💡 關鍵：關閉自動 timestamps，
    // 改由我們在假資料或業務邏輯中手動帶入
    timestamps: true,
  },
)
// type
export type TProduct = {
  // ISO 8601
  // Date (object) => Fri Jun 12 2026 14:33:53 GMT+0800
  // 然後Mongoose 自己會再轉 2026-06-12T06:08:46.000Z
  // ----------
  createdAt: Date
  updatedAt: Date
}
// seed
export const mockProducts: TProduct[] = [
  {
    // ISO 8601
    // new Date() => Date (object)
    // 然後Mongoose 自己會再轉.toISOString()
    // => '2026-06-12T06:08:46.000Z' (string)
    // --------
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]


// ==============================
// Typeorm  Schema
// ==============================
Timestamp  =>  1787016000000 (毫秒-number)
----
// 自訂義函式
const bigintTransformer = {
  // bigint 透過 pg 驅動讀取時會回傳字串
  // 例如："1781248003298"
  // 使用 transformer 將字串轉成 number
  to: (value?: number) => value,
  from: (value: string) => Number(value),
}
columns: {
  createdAt: {
    type: 'bigint',
    transformer: bigintTransformer,
  },
  updatedAt: {
    type: 'bigint',
    transformer: bigintTransformer,
  },
},
// type
export type TProduct = {
  // Timestamp  =>  1787016000000 (毫秒-number)
  // ----------
  createdAt: number
  updatedAt: number
}
// seed
export const mockOrders: TOrder[] = [
  {
    // Timestamp
    // Date.now() => 1787016000000 (毫秒-number)
    // --------
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]


// * 現在主流用這方式
ISO 8601 => "2026-06-12T06:08:46.000Z"
---
columns: {
  createdAt: {
    // DB 自動產生建立時間
    type: 'timestamptz',
    createDate: true,
    nullable: false,
  },
  updatedAt: {
    // DB 更新時自動刷新
    type: 'timestamptz',
    updateDate: true,
    nullable: false,
  },
},
// type
export type TProduct = {
  // ISO 8601
  // Date (object) => 
  // Tue Aug 18 2026 09:20:00 GMT+0800 (台北標準時間)
  // 然後TypeOrm 自己會再轉 
  // 2026-08-18T01:20:00.000Z
  // ----------
  createdAt: Date
  updatedAt: Date
}
// seed
export const mockOrders: TOrder[] = [
  {
    // ISO 8601
    // new Date() => Date (object)
    // 然後TypeOrm 自己會再轉.toISOString()
    // => '2026-06-12T06:08:46.000Z' (string)
    // --------
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]


// ==============================
// Prisma
// ==============================
Timestamp  =>  1787016000000 (毫秒-number)
----
// createdAt BigInt @map("created_at")
// updatedAt BigInt @map("updated_at")
// 但這樣 不會自動 now() / 自動更新。
// 所以還是要用 標準作法
// *方法和ISO 8601 一樣

// 然後：
const newOrders = await prisma.order.findMany({
  include: {
    profile: true, // 對應 : profile: 虛擬要連結用的欄位
  },
})
// 
// Prisma出來永遠是
// createdAt: Date : "2026-06-16T03:39:33.493Z"
// 要手動轉格式.getTime() 才能變時間格式 => 1781581173493
const plainOrders = newOrders.map((order) => ({
  ...order,
  createdAt: order.createdAt.getTime(),
  updatedAt: order.updatedAt.getTime(),
}))
// DB       → timestamptz
// Prisma   → Date
// API      → timestamp (number)


ISO 8601 => "2026-06-12T06:08:46.000Z"
---
model Order {
  // @default(now())：對應 TypeORM 的 createDate: true，在建立資料時自動填入當前時間。
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  // @updatedAt：對應 TypeORM 的 updateDate: true，在資料有任何更新時自動刷新時間。
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz
}
// seed
export const mockOrders: Order[] = [
  {
    // Prisma 只能寫 Date物件 new Date()
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]
```


### localDB 注意事項

#### (一).多資料庫 注意事項
---

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


#### (二).自動建立 collection 測試
---

> 原理

```jsx
* 預設情況下，只要透過 mongoose.model('UserModel', userSchema) 註冊模型，
* Mongoose 就會觸發 autoCreate 機制，向 MongoDB 發送建立集合（Collection）的指令。
* 因為預設 autoCreate 為 true，所以在第一次使用模型時，Mongoose 會自動建立對應的集合。
* 除非 主動設定去關閉他 (autoCreate: false)，否則 Mongoose 會自動建立集合。
* const schema = new mongoose.Schema({ name: String}, { autoCreate: false });
```

> 測試

```jsx
* 1. 創一個檔案 test-autoCreate.js
import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  { name: String },
  {
    // 指定 collection 名稱
    collection: 'users333',
    // 關閉自動建立 Collection 的功能
    // autoCreate: false
  }
)

const User = mongoose.model('User', schema)
await mongoose.connect('mongodb://127.0.0.1:27017/test')
console.log('已連線')
// 明確等待 Mongoose 完成該 Model 的索引與 Collection 建立
await User.init()
// 此時再去查詢，就會正確拿到 users 囉！
const collections = await mongoose.connection.db.listCollections().toArray()
console.log(collections)
await mongoose.disconnect()

2. 然後 終端執行
node test-autoCreate.js

3. 就會秀出
// 已連線
// [
//   {
//     name: 'users333',
//     type: 'collection',
//     options: {},
//     info: {
//       readOnly: false,
//       uuid: new UUID('b44ce6d5-d606-4cf6-9fa1-e4722672f71b')
//     },
//     idIndex: { v: 2, key: [Object], name: '_id_' }
//   }
// ]
```


#### (三).handleAsyncError 原理
---

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


#### (四).公司localhost 無法連線 MongoDB原因
---

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
