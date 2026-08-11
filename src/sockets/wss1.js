import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'

const wss1 = new WebSocketServer({ noServer: true })
// ===================
// ... 流程07: 推播給其他用戶 ...
// ===================
const sendAllUser = (msg) => {
  // 推播給其他用戶
  // WebSocket 連線有 4 個狀態值（數字 0 ~ 3）：
  // 0 (WebSocket.CONNECTING)：連線中
  // 1 (WebSocket.OPEN)：連線成功，可以正常收發資料
  // 2 (WebSocket.CLOSING)：關閉中
  // 3 (WebSocket.CLOSED)：已斷線

  // #region WebSocket
  // ~具體流程
  // ---------------
  // 使用者 A (小明) 打開網頁：
  // 前端執行 new WebSocket('ws://localhost:3000/ws')
  // wss1.clients 裡面增加：[ client_A (UUID: 111) ] (人數：1)

  // 使用者 B (小華) 用另一個瀏覽器或手機打開網頁：
  // 前端執行 new WebSocket('ws://localhost:3000/ws')
  // wss1.clients 裡面再增加：[ client_A (UUID: 111), client_B (UUID: 222) ] (人數：2)

  // 使用者 C (小美) 也開啟網頁：
  // wss1.clients 變為：[ client_A, client_B, client_C ] (人數：3)

  // ~wss1.clients 就是伺服器用來「紀錄與追蹤所有在線用戶」的清單
  // ---------------
  // wss1.clients 迴圈開始 run 每一個人：
  // [第 1 輪] 遇到 client_A (UUID: 111)
  //   -> 判斷 client.uuid !== '111' ❌ 不成立！(這是發送者自己，不發給他)

  // [第 2 輪] 遇到 client_B (UUID: 222)
  //   -> 判斷 client.uuid !== '111' ⭕ 成立！
  //   -> client_B.send(訊息) 傳送給小華！

  // [第 3 輪] 遇到 client_C (UUID: 333)
  //   -> 判斷 client.uuid !== '111' ⭕ 成立！
  //   -> client_C.send(訊息) 傳送給小美！
  // #endregion
  // ---------------------

  wss1.clients.forEach(function (client) {
    // 已建立連線並且排除自身
    // client.readyState === WebSocket.OPEN：確認該 Client 的連線是活著且穩定的
    // * && client.uuid !== msg.uuid ：排除訊息發送者本人
    // *測試時,要拿掉排除那段 伺服器 和 瀏覽器才能看到訊息
    if (client.readyState === WebSocket.OPEN && client.uuid !== msg.uuid) {
      try {
        // 推播給其他用戶...XXXX 捐獻 1000 元
        console.log(`推播給其他用戶...XXXX 捐獻${msg.content}元`)
        const jsonMsg = JSON.stringify(msg)
        client.send(jsonMsg)
      } catch (error) {
        console.error('訊息發送失敗:', error)
      }
    }
  })
}

// ===================
// ... 流程03: 發送訊息 ...
// ===================
const handleSendMessage = (ws, uuid) => {
  const user = {
    action: 'INIT_USER',
    name: '龍族聊天室',
    timestamp: Date.now(),
    uuid,
  }

  try {
    ws.send(JSON.stringify(user))
  }
  catch (error) {
    console.error('初始化訊息發送失敗:', error)
  }
}

// ===================
// ... 流程06: 接收訊息 ...
// ===================
// 1. 定義各個 action 的處理邏輯
const actionHandlers = {
  CREATE_MESSAGES: (ws, msg) => {
    const newMessage = {
      action: 'CREATED_SUCCESS',
      uuid: ws.uuid, // 使用綁定在 ws 上面的 uuid
      content: msg.content,
    }
    // 推播給其他用戶
    sendAllUser(newMessage)
  },
  DELETE_MESSAGES: (ws, msg) => {
    console.log(`刪除訊息邏輯，UUID: ${ws.uuid}, Target ID: ${msg.messageId}`)
    // 執行資料庫刪除或廣播邏輯...
  },
}
// 2. 主進入點極簡化
const handleGetMessage = (ws, rawMessage) => {
  try {
    const msg = JSON.parse(rawMessage)
    console.log('接收 client 訊息:', msg)
    // { action: 'CREATE_MESSAGES', content: '1000' }

    const handler = actionHandlers[msg.action]

    if (handler) {
      handler(ws, msg) // 存在就直接執行
    }
    else {
      console.warn('未定義的 action:', msg.action)
    }
  }
  catch (error) {
    console.error('JSON 解析失敗或格式不正確:', error)
  }
}

// ===================
// ... 流程02: Server連線成功 ...
// ===================
wss1.on('connection', function connection(ws) {
  // ws 與 data 都是 ws 套件在 連線 與 訊息傳輸時，
  // 自動提供給你的內建物件/資料
  // ~ ws（WebSocket 實例物件）
  // ~ data（接收到的原始資料）
  ws.on('error', console.error)
  console.log('WebSocketServer (wss1) 連線成功')

  // 初始化用戶身份
  // 使用者 A (小明) (UUID: 111)
  const uuid = uuidv4()
  ws.uuid = uuid

  // 流程03: 發送訊息 ...
  // 發出第一個訊息給用戶，表示用戶是誰
  handleSendMessage(ws, uuid)

  // 流程06: 接收訊息 ...
  // 這個 data 是 ws 套件收到封包後，自動傳給你的
  ws.on('message', (data) => handleGetMessage(ws, data))
})
export default wss1
