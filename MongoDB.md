## MongoDB

- **ODM**
- Mongoose

### MongoDB Dockerfile

> 指令

```jsx
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

> Dockerfile

1. Standalone模式( 預設 )
```jsx
// docker-compose.yml
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb_Docker
    # 開發環境建議用 unless-stopped，避免電腦一開機就在背景默默吃資源
    restart: unless-stopped
    ports:
    # 建議改用 27018，格式為 "本機Port:容器內Port"
      - "27018:27017"
    environment:
      # 必須改成官方指定的變數名稱 / ${變數:-預設值}
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME:-testXXXX}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD:-passwordXXXX}
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
    name: mongodb_Docker
```

```jsx
// .env
MONGODB_URI = mongodb://testCurryLee:password1234@localhost:27018

// MongoDB Compass
name: mongodb_Docker
URL : mongodb://testCurryLee:password1234@localhost:27018/?authSource=admin
```

2. Replica Set模式 + Keyfile 認證
```jsx
副本集（Replica Set）」模式
---
交易機制（Transaction）：保護你的資料「要嘛全成功，要嘛全失敗」
session.startTransaction()
啟動後，接下來所有的寫入/刪除操作都會進入「臨時沙盒」
常用在金流部分,避免斷線 扣錯 / 失敗..等
```

```jsx
// docker-compose.yml
# 這份 Docker Compose 配置主要用於
# 快速建立一個具備 Keyfile 認證（安全加密）且自動初始化副本集（Replica Set）的 MongoDB 服務。
# MongoDB 規定只要啟用副本集（Replica Set）又同時想要有帳密認證，
# 成員之間就必須透過內部金鑰（Keyfile）進行安全通訊。
# 而且該檔案的權限必須非常嚴格（400），擁有者必須是 999:999。
# 這段腳本自動幫你處理了這個繁瑣的原生權限問題
#
# 副本集（Replica Set）」模式
# ---
# 交易機制（Transaction）：保護你的資料「要嘛全成功，要嘛全失敗」
# session.startTransaction()
# 啟動後，接下來所有的寫入/刪除操作都會進入「臨時沙盒」
# 常用在金流部分,避免斷線 扣錯 / 失敗..等
# ----------------------------------------
services:
  # ==========================================
  # 1. Keyfile 產生器 (一次性執行的初始化容器)
  # ==========================================
  keyfile-generator:
    image: mongo:7.0
    container_name: mongodb_KeyGenerator
    # 💡 [關鍵安全設定] 說明：
    # 1. 檢查 keyfile 是否已存在，避免重複產生導致副本集成員密鑰不一致。
    # 2. 產生 756 位元組的隨機 Base64 字串作為加密金鑰。
    # 3. 權限必須是 400 (僅擁有者可讀，拒絕群組與其他人存取)。
    # 4. 變更擁有者為 MongoDB 預設用戶 (UID/GID 999:999)，否則主資料庫啟動會報權限錯誤。
    entrypoint: >
      bash -c "
      if [ ! -f /data/configdb/keyfile ]; then
        openssl rand -base64 756 > /data/configdb/keyfile
        chmod 400 /data/configdb/keyfile
        chown 999:999 /data/configdb/keyfile
        echo 'Keyfile 產生並設定權限成功！'
      else
        echo 'Keyfile 已存在，跳過。'
      fi
      "
    volumes:
      # 與主要資料庫服務共用 config 磁碟卷，以便傳遞產生的 keyfile
      - mongo_config:/data/configdb

  # ==========================================
  # 2. MongoDB 主資料庫服務
  # ==========================================
  mongodb:
    image: mongo:7.0
    container_name: mongodb_Docker
    restart: unless-stopped
    environment:
      # 必須改成官方指定的變數名稱 / ${變數:-預設值}
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME:-testCurryLee}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD:-password1234}
    depends_on:
      # 嚴格依賴：必須等 keyfile-generator 成功執行完畢並退出，此容器才能啟動
      keyfile-generator:
        condition: service_completed_successfully
    command: >
      mongod 
      --replSet rs0 
      --bind_ip_all 
      --keyFile /data/configdb/keyfile
    ports:
      # 建議改用 27018，格式為 "本機Port:容器內Port"
      - '27018:27017' # 對外暴露 27018 埠，對內維持 27017
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    # 💡 補上這個 Healthcheck，mongo-init 才知道何時能開始執行
    healthcheck:
      test: mongosh --eval 'db.runCommand("ping").ok' --quiet
      interval: 5s # 每 5 秒檢查一次
      timeout: 5s # 逾時時間 5 秒
      retries: 5 # 失敗 5 次視為不健康
      start_period: 10s # 容器啟動後的 10 秒緩衝期，期間失敗不計入重試次數

  # ==========================================
  # 3. MongoDB 副本集Replica Set (一次性執行的初始化容器)
  # ==========================================
  mongo-init:
    image: mongo:7
    restart: 'no' # 執行完畢即關閉，不需要重啟
    environment:
      # 必須改成官方指定的變數名稱 / ${變數:-預設值}
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME:-testCurryLee}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD:-password1234}
    depends_on:
      # 嚴格依賴：必須等主要資料庫符合 healthcheck 的 healthy 狀態，才開始執行初始化
      mongodb:
        condition: service_healthy
    # 💡 [副本集初始化邏輯] 說明：
    # 1. sleep 5 給予資料庫額外的緩衝時間確保安全連線。
    # 2. 檢查機制：先測試副本集是否已經初始化過 (rs.status().ok)。
    # 3. 若已初始化，前面的指令會成功返回；若尚未初始化，則執行後續的 || (OR) 邏輯進行 rs.initiate()。
    entrypoint: >
      bash -c "
      sleep 5;
      mongosh --host mongodb:27017 -u \"$$MONGO_INITDB_ROOT_USERNAME\" -p \"$$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase admin --eval 'rs.status().ok' || mongosh --host mongodb:27017 -u \"$$MONGO_INITDB_ROOT_USERNAME\" -p \"$$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase admin --eval 'rs.initiate({_id:\"rs0\",members:[{_id:0,host:\"mongodb:27017\"}]})'
      "

# ==========================================
# 磁碟卷定義 (儲存數據與金鑰)
# ==========================================
volumes:
  mongo_data:
    name: mongodb_Docker # 指定實體 Volume 名稱，存放資料庫數據
  mongo_config:
    name: mongodb_Config # 指定實體 Volume 名稱，存放設定檔與關鍵金鑰
```

```jsx
// .env
MONGODB_URI = mongodb://testCurryLee:password1234@localhost:27018/?authSource=admin&replicaSet=rs0&directConnection=true

// MongoDB Compass
name: mongodb_Docker
URL : mongodb://testCurryLee:password1234@localhost:27018/?authSource=admin&replicaSet=rs0&directConnection=true 
```

### 什麼時候用 aggregate()

```jsx
什麼時候用 aggregate()

1. 基本 CRUD 與單純關聯（用 Mongoose 專用 API）
---
// * .find(), .findOne(), .populate()
// * 優點：會受到 Schema 的 Middleware (Pre/Post hooks)、Virtuals、Validation 的保護與轉換，程式碼非常直覺。
// * 預設情境：能用 .find(), .findOne(), .populate() 解決的，就直接用 Mongoose 專用 API。

2. 統計、分組、報表、複雜條件跨表（用 aggregate()）
---
// * $group, $match, $project, $unwind
// * 語法與原生的 MongoDB Shell 幾乎一模一樣。
// * 注意：aggregate() 回傳的是純 JS Plain Object（類似有經過 .lean() 處理），
//   不會具有 Mongoose Document 的實例方法（如 .save()）。
// * 統計與報表情境：一旦涉及 $group（分組）、$avg/$sum（統計）、
//   或者需要超高效能的複雜跨表運算時，再開闢 Model.aggregate() 來處理。
```

### Compass UI聚合功能

> 資料

```jsx
// orders
{
  "_id": 1,
  "amount": 500,
  "createdAt": 1784259606271,
  "updatedAt": 1784259606271,
  "profile_id": 101
}

// profiles
{
  "_id": 101,
  "name": "Tom"
}
```

> Step 1：進入 Aggregations

```jsx
進入 orders Collection
點選 Aggregationsu頁簽
下方按鈕 按 + Add stage
```

> Step 2：加入 $lookup

```jsx
Stage 選擇 [ $lookup ]

內容輸入：
{
  "from": "profiles", // 要關聯的目標
  "localField": "profile_id", // 本地商品表的關聯欄位
  "foreignField": "_id", // 目標分類表的關聯欄位
  "as": "profile" // 暫存的關聯陣列名稱
}

執行後 Preview
{
  "_id": 1,
  "amount": 500,
  "createdAt": 1784259606271,
  "updatedAt": 1784259606271,
  "profile_id": 101,
  "profile": [
    {
      "_id": 101,
      "name": "Tom"
    }
  ]
}

注意：
profile 是 陣列(Array)。
```

> Step 3：加入 $unwind

```jsx
再按 + Add stage

Stage 選擇 [ $$unwind ]

內容輸入：
{
  "path": "$profile"
}

執行後 Preview
{
  "_id": 1,
  "amount": 500,
  "createdAt": 1784259606271,
  "updatedAt": 1784259606271,
  "profile_id": 101,
  "profile": {
    "_id": 101,
    "name": "Tom"
  }
}

注意：
現在 profile 已經不是陣列，而是物件。
```

> Step 4：加入 $project

```jsx
再按 + Add stage

Stage 選擇 [ $project ]

內容輸入：
{
  "_id": 0,           // _id 預設會保留，只有寫 0 才會排除
  "amount": 1,        // 保留 amount 欄位
  "profile.name": 1   // 保留 profile 底下的 name 欄位
}

執行後 Preview
{
  "amount": 500,
  "profile": {
    "name": "Tom"
  }
}

注意：
1 = 保留
0 = 排除
不能混用 1 和 0
唯一例外：_id 可以寫 0 與其他欄位的 1 一起使用
```

> Step 5：匯出 Pipeline

```jsx
點上方 EXPORT CODE </>
選擇 Node.js

會得到：
db.orders.aggregate([
  {
    $lookup: {
      from: "profiles",
      localField: "profile_id",
      foreignField: "_id",
      as: "profile"
    }
  },
  {
    $unwind: {
      path: "$profile"
    }
  },
  {
    $project: {
      _id: 0,
      amount: 1,
      "profile.name": 1
    }
  }
])
```

### $unwind 展開物件

> 原理定義

```jsx
將陣列欄位中的每個元素展開為單獨的文件。
```

> 實際範例

```jsx
{
  "_id": 1,
  "operator_types": [
    { "type": "charge", "time": 27, "kwh": 1.059 },
    { "type": "discharge", "time": 15, "kwh": 0.8 }
  ]
}

db.collection.aggregate([
  {
    $unwind: '$operator_types' // 將 operator_types 陣列展開
  },
  {
    $match: { 'operator_types.type': 'charge' } // 只保留 type 為 'charge' 的項目
  }
])
//----
// 結果=>
[
  {
    "_id": 1,
    "operator_types": {
      "type": "charge",
      "time": 27,
      "kwh": 1.059
    }
  }
]
```

> 實際範例-2

```jsx
[
  { _id: 1, name: 'Post 1', tags: ['mongodb', 'database', 'nosql'] },
  { _id: 2, name: 'Post 2', tags: ['javascript', 'nodejs'] },
]

db.collection.aggregate([
  { $unwind: '$tags' }
])
//----
// 結果=>
[
  { _id: 1, name: 'Post 1', tags: 'mongodb' },
  { _id: 1, name: 'Post 1', tags: 'database' },
  { _id: 1, name: 'Post 1', tags: 'nosql' },
  { _id: 2, name: 'Post 2', tags: 'javascript' },
  { _id: 2, name: 'Post 2', tags: 'nodejs' }
]
```

### $lookup 聯合查詢(JOIN)

> 原理定義

```jsx
用來進行集合之間的聯合查詢，相當於 SQL 的 JOIN。
$lookup 為一種將兩個集合的資料關聯起來的方式，
它可以讓主集合中的每個文檔都包含更多來自其他集合的資訊，使資料更加豐富和完整。
```

```jsx
{
  $lookup: {
    localField: "customerId", // 當前主表_的欄位
    from: "orders",           // 要聯合查詢的集合表
    foreignField: "_id",      // 要聯合查詢的集合表_的欄位
    as: "orderDetails"        // 必加:將結果放新欄位中,避免屬性覆蓋
  }
}
```

> 實際範例

```jsx
// orders集合
[
  { order_id: 1, product: 'Laptop', cust_id: 101 },
  { order_id: 2, product: 'Phone', cust_id: 102 },
]
// customers集合
[
  { customer_id: 101, name: 'Alice' }, 
  { customer_id: 102, name: 'Bob' }
]

db.orders.aggregate([
  {
    $lookup: {
      // 1. 當前主表欄位：目前這張表（通常是 Customers）要拿來對照的「鑰匙」
      localField: 'cust_id',
      // 2. 外部表：你想要抓哪一張表的資料過來合併？
      from: 'customers',
      // 3. 外部表欄位：目標對象（orders 表）裡面，哪一個欄位跟那把「鑰匙」是對得上的？
      foreignField: 'customer_id',
      // 4. 輸出的新欄位名稱：合併進來後，要在當前物件裡建立什麼名字來放「陣列」結果？
      as: 'customer_info',
    },
  },
])
//----
// 結果=>
[
  {
    order_id: 1,
    product: 'Laptop',
    cust_id: 101,
    customer_info: [{ customer_id: 101, name: 'Alice' }],
  },
  {
    order_id: 2,
    product: 'Phone',
    cust_id: 102,
    customer_info: [{ customer_id: 102, name: 'Bob' }],
  }
]
```

> 實際範例-2

```jsx
// 主集合：orders
[
  { _id: 1, name: 'Order A', evses: [101, 102] },
  { _id: 2, name: 'Order B', evses: [103] },
]
// EVSE 集合：
[
  { _id: 101, model: 'Model X', connectors: [201, 202] },
  { _id: 102, model: 'Model Y', connectors: [203] },
  { _id: 103, model: 'Model Z', connectors: [204, 205] }
]
// Connector 集合：
[
  { _id: 201, type: 'Type 1' },
  { _id: 202, type: 'Type 2' },
  { _id: 203, type: 'Type 3' },
  { _id: 204, type: 'Type 4' },
  { _id: 205, type: 'Type 5' }
]

db.orders.aggregate([
  {
    $lookup: {
      localField: 'evses',
      from: 'EVSE',
      foreignField: '_id',
      as: 'EVSES',
    },
  },
  // 要先看第一個lookup 結果 才能繼續比對 第2個$lookup
  {
    $lookup: {
      localField: 'EVSES.connectors',
      from: 'Connector',
      foreignField: '_id',
      as: 'Connectors',
    },
  },
])
//----
// 結果=>
[
  // 第一個$lookup 結果=>
  {
    _id: 1,
    name: 'Order A',
    evses: [101, 102],
    EVSES: [
      {
        _id: 101,
        model: 'Model X',
        connectors: [201, 202],
      },
      {
        _id: 102,
        model: 'Model Y',
        connectors: [203],
      },
    ],
  },
  {
    _id: 2,
    name: 'Order B',
    evses: [103],
    EVSES: [
      {
        _id: 103,
        model: 'Model Z',
        connectors: [204, 205],
      },
    ],
  }
]
//----------------------------------------
[
  // 第2個 結果=>
  // 找 localField: 'EVSES.connectors'
  // 會自動抽取： 找到2個 EVSES.connectors
  // [
  //   [201,202],
  //   [203]
  // ]

  // 再自動 flatten 成：
  // [201,202,203]
  //--------------------
  ({
    _id: 1,
    name: 'Order A',
    evses: [101, 102],
    EVSES: [
      {
        _id: 101,
        model: 'Model X',
        connectors: [201, 202],
      },
      {
        _id: 102,
        model: 'Model Y',
        connectors: [203],
      },
    ],
    Connectors: [
      { _id: 201, type: 'Type 1' },
      { _id: 202, type: 'Type 2' },
      { _id: 203, type: 'Type 3' },
    ],
  },
  {
    _id: 2,
    name: 'Order B',
    evses: [103],
    EVSES: [
      {
        _id: 103,
        model: 'Model Z',
        connectors: [204, 205],
      },
    ],
    Connectors: [
      { _id: 204, type: 'Type 4' },
      { _id: 205, type: 'Type 5' },
    ],
  })
]
```

### $group 分組/重新組裝物件資料

> 原理定義

```jsx
// 用來分組並對每組資料進行計算
寫$group
一定要先寫 _id
_id : "XXXX"  然後才能分組
或 _id: null

//----------
// 寫法範例
{
  $group: {
    // 按照 'department' 欄位分組
    _id: "$department",
    // 計算每個部門的薪水總和
    totalSalary: { $sum: "$salary" },
    // 計算每個部門的平均年齡
    avgAge: { $avg: "$age" }
  }
}
```

> 實際範例

```jsx
// 原始資料
[
  { name: 'Alice', department: 'Engineering', salary: 70000, age: 30 },
  { name: 'Bob', department: 'Engineering', salary: 80000, age: 35 },
  { name: 'Charlie', department: 'Marketing', salary: 60000, age: 28 },
  { name: 'David', department: 'Marketing', salary: 55000, age: 32 },
  { name: 'Eve', department: 'HR', salary: 50000, age: 40 },
  { name: 'Frank', department: 'HR', salary: 52000, age: 45 })
]

// 分組邏輯
db.employees.aggregate([
  {
    $group: {
      _id: '$department',
      totalSalary: { $sum: '$salary' },
      avgAge: { $avg: '$age' },
    },
  },
])
//----
// 結果=>
[
  {
    _id: 'Engineering',
    totalSalary: 150000,
    avgAge: 32.5,
  },
  {
    _id: 'Marketing',
    totalSalary: 115000,
    avgAge: 30,
  },
  {
    _id: 'HR',
    totalSalary: 102000,
    avgAge: 42.5,
  }
]
```

### $facet 包含多個 結果陣列的物件

> 原理定義

```jsx
指令核心目的實務場景
$group 📊聚合（統計歸納）：把很多筆資料，依照某個欄位加總成一筆。
使用: 計算財務報表、算平均分、統計男女比例（如：{ _id: '$status', count: { $sum: 1 } }）

$facet 🌟分流（平行處理）：同一批資料，各自走獨立的流水線。一邊算總數、一邊只切出 3 筆資料。
使用: 分頁查詢、多條件篩選器（如電商側邊欄同時統計各分類商品數）。
```

> 實際範例

```jsx
// 原始資料
[
  { _id: 1, station: '台北站', fee: 150, kwh: 12.5 },
  { _id: 2, station: '台中站', fee: 250, kwh: 20.0 },
  { _id: 3, station: '台北站', fee: 100, kwh: 8.0 },
]

// 分組邏輯
db.transactions.aggregate([
  {
    // 第一步：分頭並行計算
    $facet: {
      // 營收加總
      revenueReport: [{ $group: { _id: null, totalIncome: { $sum: '$fee' } } }],
      // 充電量加總
      powerReport: [{ $group: { _id: null, totalKwh: { $sum: '$kwh' } } }],
    },
  },
  {
    // 第二步：把陣列結構撈出來，重新打包成乾淨的格式
    // 為了打破上面的「陣列地獄」，我們用 { $arrayElemAt: ["$某陣列.某欄位", 0] }
    // 去把陣列裡面的第 0 項元素直接挖出來，並且塞進我們自訂的 finalReport 物件裡。
    $project: {
      _id: 0, // 隱藏預設的 _id
      finalReport: {
        total_money: { $arrayElemAt: ['$revenueReport.totalIncome', 0] },
        total_power: { $arrayElemAt: ['$powerReport.totalKwh', 0] },
      },
    },
  },
])
//----
// 結果=>
[
  // $facet 結果=>
  {
    revenueReport: [
      { _id: null, totalIncome: 500 }, // 150 + 250 + 100
    ],
    powerReport: [
      { _id: null, totalKwh: 40.5 }, // 12.5 + 20.0 + 8.0
    ],
  }
]
[
  // $project 結果=>
  {
    finalReport: {
      total_money: 500,
      total_power: 40.5,
    },
  }
]
```

> 實際範例-2

```jsx
// 原始資料
[
  { name: 'Product A', category: 'Electronics', price: 150 },
  { name: 'Product B', category: 'Electronics', price: 99 },
  { name: 'Product C', category: 'Clothing', price: 75 },
  { name: 'Product D', category: 'Clothing', price: 50 },
  { name: 'Product E', category: 'Electronics', price: 200 },
  { name: 'Product F', category: 'Clothing', price: 120 },
]

// 分組邏輯
db.products.aggregate([
  {
    $facet: {
      cheapProducts: [
        {
          $match: {
            price: { $lt: 100 }, // 小於
          },
        },
        {
          $sort: {
            price: 1,
          },
        },
      ],
      categoryCounts: [
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ],
    },
  },
])
//----
// 結果=>
[
  {
    cheapProducts: [
      { name: 'Product D', category: 'Clothing', price: 50 },
      { name: 'Product C', category: 'Clothing', price: 75 },
      { name: 'Product B', category: 'Electronics', price: 99 },
    ],
    categoryCounts: [
      { _id: 'Electronics', count: 3 },
      { _id: 'Clothing', count: 3 },
    ],
  }
]
```

### $project 返回的欄位/重新改寫欄位

> 原理定義

```jsx
// $project 使用重點總結：都用同一種規則就好
01-同一層級內需統一規則：
同一層級的所有欄位，要麼全部設為 1（包含），要麼全部設為 0（排除），不能混合使用。
例外情況：
頂層的 _id 欄位 可以與其他欄位混合使用。例如：可以設定 _id: 0 同時其他欄位設為 1

$project: {
  _id: 0,          // 排除顶层 _id
  name: 1,         // 包含字段
  "address.city": 1   // 包含嵌套文档字段
}

/-----------

02-嵌套文件：
在嵌套的文件中
所有欄位必須遵循相同的包含或排除規則，不能在同一個嵌套文檔內混用 1 和 0。

// 嵌套寫法
"details.warranty": 1
```

> 嵌套層要用 "字串顯示"

```jsx
// 這是一個投影操作，用來指定查詢結果中要返回的欄位。
// $project 指定應該包括的欄位，
// 表示這些欄位將會出現在查詢結果中。
// 1 表示包括該欄位。
// 0 表示排除該欄位。
//-----------------------
$project: {
  _id: 0,
  country_code: 0,
  directions: 0,

  // 嵌套層
  'EVSES._id': 0,
  "EVSES.floor_level": 0,

  'Connector.id': 0,
  'Connector.format': 0,
},
```

> 新增屬性 注意

```jsx
// 操控做事情都要用 物件 執行
{
  $project: {
    price: '$summaryPrice.price'
  },
},

{
  $project: {
    summary: {
      price: { $arrayElemAt: ['$summaryPrice.price', 0] },
      times: { $arrayElemAt: ['$summaryTimes.times', 0] },
      power: { $arrayElemAt: ['$summaryPower.power', 0] },
      time:  { $arrayElemAt: ['$summaryTime.time', 0] },
    },
  },
},
```

> 實際範例

```jsx
// 原始資料
[
  {
    _id: 1,
    item: '7kW 交流充電樁',
    price: 15000,
    details: {
      brand: 'Delta',
      warranty: '3年保固',
      features: ['Type 2 槍頭', 'IP55 防塵防水', 'RFID 卡片鎖'],
    },
  },
  {
    _id: 2,
    item: '120kW 直流快充樁',
    price: 450000,
    details: {
      brand: 'Phihong',
      warranty: '2年保固',
      features: ['CCS1雙槍', '液冷散熱技術', '7吋觸控螢幕'],
    },
  },
  {
    _id: 3,
    item: 'Type 2 轉 Type 1 轉接頭',
    price: 3500,
    details: {
      brand: 'Jowua',
      warranty: '1年保固',
      features: ['高導電鍍銀端子', '耐重壓防車壓'],
    },
  },
]

db.sales.aggregate([
  {
    $project: {
      // 新增一個新的屬性 'discounted_price'，$multiply相乘 / 用於顯示打折後的價格
      discounted_price: { $multiply: ['$price', 0.9] },
      // 嵌套屬性：從 'details' 中提取 'brand' 並放到新的屬性 'product_brand' 中
      product_brand: '$details.brand',
      // 使用 $arrayElemAt 提取嵌套數組中的第一個元素，假設 'details.features' 是一個數組
      // 以下示例中假設 'details.features' 是數組
      features: { $arrayElemAt: ['$details.features', 0] },
      // ~移除不需要的字段
      _id: 0, // 若想排除 '_id'，可以設為 0

      // 包含的字段
      item: 1,
      price: 1,
      // 嵌套寫法
      'details.warranty': 1,
    },
  },
])
//----
// 結果=>
[
  ({
    item: '7kW 交流充電樁',
    price: 15000,
    discounted_price: 13500,
    product_brand: 'Delta',
    features: 'Type 2 槍頭',
    details: { warranty: '3年保固' },
  },
  {
    item: '120kW 直流快充樁',
    price: 450000,
    discounted_price: 405000,
    product_brand: 'Phihong',
    features: 'CCS1雙槍',
    details: { warranty: '2年保固' },
  },
  {
    item: 'Type 2 轉 Type 1 轉接頭',
    price: 3500,
    discounted_price: 31500,
    product_brand: 'Jowua',
    features: '高導電鍍銀端子',
    details: { warranty: '1年保固' },
  })
]
```

### $facet 和 $group 和 $project 差異

> 流程使用

```jsx
// 在實務的開發流程中，順序通常是：
1.先用 $match 篩選本月資料。
2.用 $facet 同時處理多個統計。
3.如果 $facet 裡面需要分類，就在裡面寫 $group。
4.最後最外層用 $project 把格式修漂亮，完美收工！
```

> 原始資料

```jsx
[
  { _id: 1, station: '台北站', fee: 100, kwh: 10 },
  { _id: 2, station: '台北站', fee: 150, kwh: 15 },
  { _id: 3, station: '台中站', fee: 300, kwh: 30 },
]
```

> $group：分組與重新組裝 (加總、平均)

```jsx
// 🎯 使用時機： 當你需要把多筆資料，依照「某個分類」壓扁成一筆，
// 並計算總和、平均值或計數時。

db.transactions.aggregate([
  {
    $group: {
      _id: '$station', // 依據 station 欄位分組
      total_fee: { $sum: '$fee' }, // 計算該站總金額
      count: { $sum: 1 }, // 計算該站有幾筆資料
    },
  },
])
//----
// 結果=>
[
  (
    { _id: '台北站', total_fee: 250, count: 2 }, // 100 + 150
    { _id: '台中站', total_fee: 300, count: 1 }
  )
]
```

> $facet：多功能平行處理 (一魚多吃)

```jsx
//🎯 使用時機： 當前端畫面需要同時顯示「總營收統計」跟「排行榜」時。
// 一般情況下一條 Pipeline 只能做一次 $group（做完資料就變形了），
// 但 $facet 可以讓資料複製多份，同時跑不同的統計，最後合併成一個大物件。

db.transactions.aggregate([
  {
    $facet: {
      // 宇宙 A：計算整張表的大總和 (不分站點)
      all_summary: [{ $group: { _id: null, income: { $sum: '$fee' }, power: { $sum: '$kwh' } } }],
      // 宇宙 B：篩選出金額大於 100 的高額消費紀錄
      vip_orders: [{ $match: { fee: { $gt: 100 } } }],  // 大於
    },
  },
])
//----
// 結果=>
[
  {
    all_summary: [
      { _id: null, income: 550, power: 55 }, // 100+150+300
    ],
    vip_orders: [
      { _id: 2, station: '台北站', fee: 150, kwh: 15 },
      { _id: 3, station: '台中站', fee: 300, kwh: 30 },
    ],
  }
]
```

> $project：整容與欄位包裝 (改名、隱藏)

```jsx
//🎯 使用時機： 當資料計算完了，但是結構太醜、巢狀太深（例如剛剛 $facet 吐出來的格式），
// 或者你單純想把隱私欄位（密碼）藏起來、把金額打折、把欄位改名時。

db.transactions.aggregate([
  // ... 假設前面接了剛剛那個 $facet ...
  {
    $project: {
      _id: 0, // 隱藏
      // { $arrayElemAt: [ <陣列欄位>, <索引位置> ] }
      total_money: { $arrayElemAt: ['$all_summary.income', 0] }, // 把第 0 項的數字挖出來
      vip_list: '$vip_orders', // 改個漂亮的名字給前端
    },
  },
])
//----
// 結果=>
[
  {
    total_money: 550,
    vip_list: [
      { _id: 2, station: '台北站', fee: 150, kwh: 15 },
      { _id: 3, station: '台中站', fee: 300, kwh: 30 },
    ],
  }
]
```

### 簡單範例

> 原始資料

```jsx
[
  { "item": "apple", "quantity": 10, "price": 5, "date": "2023-08-01" }
  { "item": "banana", "quantity": 5, "price": 2, "date": "2023-08-02" }
  { "item": "orange", "quantity": 8, "price": 3, "date": "2023-08-02" }
  { "item": "apple", "quantity": 3, "price": 5, "date": "2023-08-03" }
]
```

> 實際範例

```jsx
// 我們想要達成以下幾個目標：
// ------------
// * 過濾出 2023-08-01 到 2023-08-02 之間的銷售記錄。
// * 計算每種商品的總銷售額（quantity * price）。
// * 根據銷售額降序排列。
// * 只顯示前 2 個結果。
db.sales.aggregate([
  // 1. $match: 過濾出指定日期範圍內的銷售記錄
  {
    $match: {
      date: { $gte: '2023-08-01', $lte: '2023-08-02' },
    },
  },
  // 2. $addFields: 新增一個欄位 'totalSale'，表示每筆交易的總銷售額
  {
    $addFields: {
      totalSale: { $multiply: ['$quantity', '$price'] },
    },
  },
  // 3. $group: 按照 'item' 分組，並計算每種商品的總銷售額
  {
    $group: {
      _id: '$item',
      // 如果$item 相同 就要相加($sum) 不然只會取到隨機一筆的值
      totalAmount: { $sum: '$totalSale' },
    },
  },
  // 4. $sort: 根據 'totalAmount' 降序排列
  // 進行由大到小的降序排序（-1)
  {
    $sort: { totalAmount: -1 },
  },
  // 5. $limit: 只顯示前 2 個結果
  {
    $limit: 2,
  },
])

// 解釋
// $match: 先過濾出 2023-08-01 到 2023-08-02 之間的銷售記錄。
// $addFields: 新增一個欄位 totalSale，用來表示每筆交易的總銷售額（數量乘以單價）。
// $group: 根據商品名稱（item）分組，並計算每種商品的總銷售額。
// $sort: 根據 totalAmount 進行降序排列，這樣銷售額最高的商品會排在最前面。
// $limit: 最後，只顯示前 2 個銷售額最高的商品。
```

> 執行結果

```jsx
$match: =>
date : [
  { "item": "apple", "quantity": 10, "price": 5, "date": "2023-08-01" },
  { "item": "banana", "quantity": 5, "price": 2, "date": "2023-08-02" },
  { "item": "orange", "quantity": 8, "price": 3, "date": "2023-08-02" }
]

$addFields: =>
[
  { "item": "apple", "quantity": 10, "price": 5, "date": "2023-08-01", "totalSale": 50 },
  { "item": "banana", "quantity": 5, "price": 2, "date": "2023-08-02", "totalSale": 10 },
  { "item": "orange", "quantity": 8, "price": 3, "date": "2023-08-02", "totalSale": 24 }
]

$group: =>
[
  { "_id": "apple", "totalAmount": 50 },
  { "_id": "banana", "totalAmount": 10 },
  { "_id": "orange", "totalAmount": 24 }
]

$sort +  $limit: 2:
[
  { "_id": "apple", "totalAmount": 50 },
  { "_id": "orange", "totalAmount": 24 }
]
```

//---------------

> 原始資料

```jsx
[
  { _id: 1, status: 'active', category: 'Electronics', amount: 1200, tax_id: '100.5' },
  { _id: 2, status: 'active', category: 'Electronics', amount: 800, tax_id: '200.0' },
  { _id: 3, status: 'active', category: 'Clothing', amount: 500, tax_id: '50.2' },
  { _id: 4, status: 'inactive', category: 'Clothing', amount: 1500, tax_id: '300.0' },
]
[
  // productSummary 合併資料
  {
    _id: 'old_id_1',
    category: 'Electronics',
    total: 1500,
    updatedBy: 'Andy',
    tags: ['3C', 'Gadget'],
  },
  {
    _id: 'old_id_2',
    category: 'Books',
    total: 300,
    updatedBy: 'Bob',
    tags: ['Education'],
  }
]
```

> 實際範例

```jsx
db.collection.aggregate([
  // 第一步：過濾/塞選資料
  { $match: { status: 'active' } },
  // 第二步：新增或修改資料類型
  {
    $addFields: {
      amountNumeric: { $toDouble: '$tax_id' },
    },
  },
  // 第三步：分組/重新組裝物件資料
  {
    $group: {
      _id: '$category', // 要先寫id 分組
      total: { $sum: '$amount' },
    },
  },
  // 第四步：返回的欄位/重新改寫欄位
  {
    $project: {
      _id: 0, // 不包含 MongoDB 的默認 "_id" 欄位
      $category: '$_id', // 將分組的 "_id" 欄位重命名為 "$category"
      total: 1, // 保留 "total" 欄位
    },
  },
  // 第五步：按總和降序排列
  { $sort: { total: -1 } },
  // 第六步：合併資料
  {
    $merge: {
      into: 'productSummary', // 將結果寫入到 "productSummary" 集合
      whenMatched: 'merge', // 如果集合中已經有相同的文檔，則合併
      whenNotMatched: 'insert', // 如果集合中沒有相同的文檔，則插入新文檔
    },
  },
])
```

> 執行結果

```jsx
$match: =>
[
  { "_id": 1, "status": "active", "category": "Electronics", "amount": 1200, "tax_id": "100.5" },
  { "_id": 2, "status": "active", "category": "Electronics", "amount": 800, "tax_id": "200.0" },
  { "_id": 3, "status": "active", "category": "Clothing", "amount": 500, "tax_id": "50.2" },
]
$addFields: =>
[
  { "_id": 1, "status": "active", "category": "Electronics", "amount": 1200, "tax_id": "100.5", "amountNumeric": 100.5 },
  { "_id": 2, "status": "active", "category": "Electronics", "amount": 800, "tax_id": "200.0", "amountNumeric": 200.0 },
  { "_id": 3, "status": "active", "category": "Clothing", "amount": 500, "tax_id": "50.2", "amountNumeric": 50.2 }
]
$group: =>
[
  { "_id": "Electronics", "total": 2000 },
  { "_id": "Clothing", "total": 500 }
]
$project + $sort : =>
[
  { "total": 2000, "category": "Electronics" },
  { "total": 500, "category": "Clothing" }
]

productSummary 合併資料
[
  {
    "_id": "old_id_1",
    "category": "Electronics",
    "total": 1500,
    "updatedBy": "Andy",
    "tags": ["3C", "Gadget"]
  },
  {
    "_id": "old_id_2",
    "category": "Books",
    "total": 300,
    "updatedBy": "Bob",
    "tags": ["Education"]
  }
]

/-----
[
  { "total": 2000, "category": "Electronics" },
  { "total": 500, "category": "Clothing" }
]

$merge: =>
[
  {
    "_id": "old_id_1",
    "category": "Electronics",
    "total": 2000,           // 1. 重複的欄位：total 被成功更新成最新的 2000 了
    "updatedBy": "Andy",     // 2. 舊有的欄位：被完整保留下來，沒有消失！
    "tags": ["3C", "Gadget"] // 3. 舊有的欄位：被完整保留下來，沒有消失！
  },
  {
    "_id": "old_id_2",
    "category": "Books",
    "total": 300,
    "updatedBy": "Bob",
    "tags": ["Education"]
  }
]
```
