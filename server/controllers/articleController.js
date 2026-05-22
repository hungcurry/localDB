import { getDBArticles } from '../../db/index.js'
// 引入 logger
import { createLogger } from '../utils/logger.js'
import { handleError, appError } from '../middlewares/errorHandler.js'

// *logger參數順序：level, message, payload
const logger = createLogger('articleController')

/**
 * 取得文章列表（分頁與搜尋）
 * GET /api/articles?page=1&limit=10&search=關鍵字
 */
export const handleGetArticles = async (req, res, next) => {
  try {
    // 1. 解析並防呆分頁參數
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)))
    const { search } = req.query

    // 記錄收到請求的 log
    logger.setLog('info', '接收到分頁查詢請求', { page, limit, search })

    // 2. 呼叫 DB 層取得資料與總筆數
    const { articles, totalCount } = await getDBArticles(page, limit, search)

    // 3. 計算分頁元數據
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // 4. 記錄成功 log
    logger.setLog('info', '分頁查詢成功', {
      retrievedCount: articles.length,
      totalCount,
    })

    // 5. 回傳統一格式
    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    })
  } 
  catch (error) {
    // 記錄錯誤 log
    logger.setLog('error', '分頁查詢失敗', { error: error.message })

    // 丟給全域的錯誤處理 middleware
    next(error)
  }
}
