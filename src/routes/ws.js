import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'

const wss1 = new WebSocketServer({ noServer: true })
const wss2 = new WebSocketServer({ noServer: true })

wss1.on('connection', function connection(ws) {
  ws.on('error', console.error)
  console.log('WebSocketServer 連線成功')

  // 判斷是哪一個用戶使用
  const uuid = uuidv4()
  ws.uuid = uuid

  // 發出第一個訊息給用戶，表示用戶是誰
  const user = {
    name: 'curry',
    uuid,
  }
  // 發訊息給用戶(只能發送字串)
  ws.send(JSON.stringify(user))

  // 監聽
  ws.on('message', (message) => {
    const msg = JSON.parse(message)
    console.log('接收client訊息', msg)

    const newMessage = {
      context: 'message',
      uuid,
      content: msg.content,
    }

    // 再次回傳發訊息(只能發送字串)
    // ws.send(JSON.stringify(newMessage))

    // 推播給其他用戶
    sendAllUser(newMessage)
  })
})

wss2.on('connection', function connection(ws) {
  ws.on('error', console.error)
  console.log('WebSocket2 連線成功')
  // ...
})

// 推播給其他用戶
// WebSocket.OPEN 分別對應於 WebSocket 客戶端
// WebSocketServer.OPEN 分別對應於 WebSocketServer 伺服器端
const sendAllUser = (msg) => {
  wss1.clients.forEach(function (client) {
    // 已建立連線並且排除自身
    if (client.readyState === WebSocket.OPEN && client.uuid !== msg.uuid) {
      try {
        const jsonMsg = JSON.stringify(msg)
        client.send(jsonMsg)
      } catch (error) {
        console.error('訊息發送失敗:', error)
      }
    }
  })
}

export { wss1, wss2 }
