import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'

const wss2 = new WebSocketServer({ noServer: true })
// ===================
// ... Server連線成功 ...
// ===================
wss2.on('connection', (ws) => {
  ws.on('error', console.error)
  console.log('WebSocketServer (wss2) 連線成功')
  // wss2 專屬邏輯...
})
export default wss2
