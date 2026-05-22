import { ArticleModel } from '../../models/article.model.js'

// 升級查詢文章數據，導入分頁與搜尋管道
const aggregateArticles = async (page, limit, search) => {
  const pipeline = []

  // 1. 如果有搜尋關鍵字，加入篩選階段
  if (search) {
    pipeline.push({
      $match: {
        title: { $regex: search, $options: 'i' },
      },
    })
  }

  // 2. 使用 $facet 同時計算總數與獲取當頁資料，避免兩次查詢
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'totalCount' }],
      data: [
        { $sort: { createdAt: -1 } }, // 新文章在前
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { __v: 0 } }, // 依你的需求排除 __v
      ],
    },
  })

  return await ArticleModel.aggregate(pipeline)
}

// 查詢文檔
const getDBArticles = async (page, limit, search) => {
  try {
    const [result] = await aggregateArticles(page, limit, search)

    // 解析 $facet 出來的結果
    const totalCount = result.metadata[0]?.totalCount || 0
    const articles = result.data || []

    if (process.env.NODE_ENV === 'dev') {
      console.log('MongoDB')
    }

    if (articles.length === 0) {
      console.log('DB 沒有資料')
      return { articles: [], totalCount: 0 } // 回傳空陣列與 0 總數
    }

    // 這裡保留你原本的 log 習慣
    console.log('DB 獲取 Articles 數量:', articles.length)
    return { articles, totalCount }
  } catch (err) {
    console.error('Error finding articles:', err)
    throw err
  }
}

export { getDBArticles }
