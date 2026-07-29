// --- 前端分頁與搜尋狀態管理 (純 JS 全域變數) ---
let currentPage = 1
const limit = 3 // 預設 5 筆，方便用你塞入的 6 筆測試資料來玩分頁
let searchKeyword = ''
let totalPages = 1

// --- 抓取 DOM 節點 ---
const searchInput = document.getElementById('searchInput')
const searchBtn = document.getElementById('searchBtn')
const statusMessage = document.getElementById('statusMessage')
const listWrapper = document.getElementById('listWrapper')
const paginationWrapper = document.getElementById('paginationWrapper')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const pageIndicator = document.getElementById('pageIndicator')

// --- 後端 API 設定 ---
// * 正式環境
// let API_BASE_URL = 'https://local-db.vercel.app/api2/article'

// * 開發環境
let API_BASE_URL = 'http://localhost:3000/api2/article'

// --- 核心業務邏輯：向後端請求資料 ---
async function fetchArticles() {
  // 顯示載入中狀態
  showStatus('資料載入中...', 'info')
  listWrapper.innerHTML = ''
  paginationWrapper.style.display = 'none'

  try {
    // 1. 組裝 Query String 網址參數
    // 範例網址：http://localhost:3000/api/articles?page=1&limit=5&search=關鍵字
    const url = new URL(API_BASE_URL)
    url.searchParams.append('page', currentPage)
    url.searchParams.append('limit', limit)
    if (searchKeyword) {
      url.searchParams.append('search', searchKeyword)
    }

    // 2. 發送原生 fetch 請求
    const response = await fetch(url)
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '無法取得資料')
    }

    // 3. 隱藏載入提示
    hideStatus()

    // 4. 渲染文章列表與分頁
    renderArticles(result.data)
    renderPagination(result.pagination)
  } 
  catch (error) {
    console.error('讀取文章失敗:', error)
    showStatus(error.message || '系統發生錯誤，請稍後再試', 'error')
  }
}

// --- 畫面渲染：文章列表 ---
function renderArticles(articles) {
  if (!articles || articles.length === 0) {
    listWrapper.innerHTML = '<div class="no-data">查無對應文章資料</div>'
    return
  }

  // 用 map 串接 HTML 字串並一次塞入，比逐個 append 效能更好
  listWrapper.innerHTML = articles
    .map(
      (item) => `
        <div class="article-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.content)}</p>
          <div class="meta">
            <span class="badge ${item.status}">${item.status}</span>
          </div>
        </div>
      `,
    )
    .join('')
}

// --- 畫面渲染：分頁按鈕與數字 ---
function renderPagination(paginationData) {
  totalPages = paginationData.totalPages
  currentPage = paginationData.currentPage

  // 如果總頁數小於等於 1 頁，就不需要顯示分頁 UI
  if (totalPages <= 1) {
    paginationWrapper.style.display = 'none'
    return
  }

  paginationWrapper.style.display = 'flex'

  // 根據後端給的布林值，直接操控按鈕的 disabled 屬性
  prevBtn.disabled = !paginationData.hasPrevPage
  nextBtn.disabled = !paginationData.hasNextPage

  // 更新文字提示
  pageIndicator.textContent = `第 ${currentPage} / ${totalPages} 頁 (共 ${paginationData.totalCount} 筆)`
}

// --- 輔助工具函式 ---
function showStatus(msg, type) {
  statusMessage.textContent = msg
  statusMessage.className = type === 'error' ? 'status-error' : 'status-info'
  statusMessage.style.display = 'block'
}

function hideStatus() {
  statusMessage.style.display = 'none'
}

// 防禦 XSS 攻擊的字串安全轉換
function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// --- 事件監聽 (Event Listeners) ---

// 點擊搜尋按鈕
searchBtn.addEventListener('click', () => {
  searchKeyword = searchInput.value.trim()
  currentPage = 1 // 關鍵：搜尋時必須回到第一頁
  fetchArticles()
})

// 搜尋欄按 Enter 鍵
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click()
  }
})

// 點擊上一頁
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--
    fetchArticles()
  }
})

// 點擊下一頁
nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++
    fetchArticles()
  }
})

// 初始載入
document.addEventListener('DOMContentLoaded', fetchArticles)
