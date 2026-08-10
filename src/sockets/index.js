import { parse } from 'url'
import wss1 from './wss1.js'
import wss2 from './wss2.js'

export function initWebSocket(server) {
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url)

    switch (pathname) {
      case '/ws':
        wss1.handleUpgrade(request, socket, head, (ws) => {
          wss1.emit('connection', ws, request)
        })
        break

      case '/ws2':
        wss2.handleUpgrade(request, socket, head, (ws) => {
          wss2.emit('connection', ws, request)
        })
        break

      default:
        socket.destroy()
        break
    }
  })
}
