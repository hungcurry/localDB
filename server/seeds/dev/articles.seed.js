import { Types } from 'mongoose'

export const mockArticles = [
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6021'),
    title: '探索 Vue 3 的 Composition API 核心優勢',
    content: '這篇文章深入探討了 Vue 3 的 Setup 語法糖與 Composable 的實務應用...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6022'),
    title: 'TypeScript 嚴格模式下的高階型別實戰',
    content: '如何在實務專案中完全捨棄 any，改用泛型與 Utility Types 建立強型別架構...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6023'),
    title: 'Vite 專案打包優化與快取策略指南',
    content: '探討如何優化 Vite 的模組分塊 (Code Splitting)，提升前端首頁載入速度...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6024'),
    title: 'Node.js 與 Mongoose 效能優化的大坑',
    content: '為什麼你的 countDocuments 那麼慢？你需要知道的索引與 lean() 的加速秘密...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6025'),
    title: '使用 Express 5 建立現代化商務 API 後端',
    content: '這是一篇關於如何整合 Express 5 新特性，優化全域錯誤處理機制的開發筆記...',
    status: 'draft',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6026'),
    title: 'Pinia 狀態管理在大型前端專案的切分藝術',
    content: '如何避免把 Pinia 當成全域變數亂塞？良好的模組化劃分與訂閱監聽實務...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6027'),
    title: 'Vue 3 自訂 Composable 的封裝哲學與記憶體洩漏預防',
    content: '寫出乾淨可重用的 Composable 不難，但你注意到 onUnmounted 裡該清理的事件與監聽器了嗎？',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6028'),
    title: '前端安全第一課：防範 XSS 與 CSRF 的實戰守則',
    content: '從 Cookie 設定 SameSite 屬性到 Content Security Policy (CSP)，打造堅不可摧的前端防線...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc6029'),
    title: '打造流暢 UI：Vue 3 Async Component 與 Suspense 設計模式',
    content: '如何利用非同步元件進行 Code Splitting，搭配優雅的 Skeleton Loading 提升使用者體驗...',
    status: 'draft',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc602a'),
    title: 'RESTful API 與 GraphQL 的抉擇：微服務架構下的實體溝通',
    content: '探討前後端分離專案中，何時該繼續使用 RESTful API，何時又該升級為 GraphQL...',
    status: 'published',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc602b'),
    title: '前端單元測試指南：Vitest + Vue Test Utils 實務',
    content: '擺脫手動測試的噩夢，教你如何為 Pinia Store 與 Vue 元件寫出高覆蓋率且可靠的單元測試...',
    status: 'draft',
  },
  {
    _id: new Types.ObjectId('6a0fc282080f062b5cdc602c'),
    title: 'Docker 化你的 前後端分離專案：從 開發 到 生產環境',
    content: '手把手帶你編寫 Multi-stage Dockerfile，極小化前端 Nginx 與後端 Node.js 映像檔體積...',
    status: 'published',
  },
]
