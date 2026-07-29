import { ArticleModel } from '../../models/article.model.js'

// #region 原始資料
// 原始資料
// [
//   {
//     "title": "探索 Vue 3 的 Composition API 核心優勢",
//     "content": "這篇文章深入探討了 Vue 3 的 Setup 語法糖與 Composable 的實務應用...",
//     "status": "published"
//   },
//   {
//     "title": "TypeScript 嚴格模式下的高階型別實戰",
//     "content": "如何在實務專案中完全捨棄 any，改用泛型與 Utility Types 建立強型別架構...",
//     "status": "published"
//   },
//   {
//     "title": "Vite 專案打包優化與快取策略指南",
//     "content": "探討如何優化 Vite 的模組分塊 (Code Splitting)，提升前端首頁載入速度...",
//     "status": "published"
//   },
//   {
//     "title": "Node.js 與 Mongoose 效能優化的大坑",
//     "content": "為什麼你的 countDocuments 那麼慢？你需要知道的索引與 lean() 的加速秘密...",
//     "status": "published"
//   },
//   {
//     "title": "使用 Express 5 建立現代化商務 API 後端",
//     "content": "這是一篇關於如何整合 Express 5 新特性，優化全域錯誤處理機制的開發筆記...",
//     "status": "draft"
//   },
//   {
//     "title": "Pinia 狀態管理在大型前端專案的切分藝術",
//     "content": "如何避免把 Pinia 當成全域變數亂塞？良好的模組化劃分與訂閱監聽實務...",
//     "status": "published"
//   }
// ]

//-------------------
// DB Articles found: [
//   {
//     "metadata": [
//       {
//         "totalCount": 6
//       }
//     ],
//     "data": [
//       {
//         "title": "Node.js 與 Mongoose 效能優化的大坑",
//         "content": "為什麼你的 countDocuments 那麼慢？你需要知道的索引與 lean() 的加速秘密...",
//         "status": "published"
//       },
//       {
//         "title": "使用 Express 5 建立現代化商務 API 後端",
//         "content": "這是一篇關於如何整合 Express 5 新特性，優化全域錯誤處理機制的開發筆記...",
//         "status": "draft"
//       },
//       {
//         "title": "Pinia 狀態管理在大型前端專案的切分藝術",
//         "content": "如何避免把 Pinia 當成全域變數亂塞？良好的模組化劃分與訂閱監聽實務...",
//         "status": "published"
//       }
//     ]
//   }
// ]
// #endregion

// 升級查詢文章數據，導入分頁與搜尋管道
const handleAggregate = async (page, limit, search) => {
  const pipeline = [] // 管道陣列段

  // 1. 如果有搜尋關鍵字，加入篩選階段
  if (search) {
    pipeline.push({
      // $match 過濾/塞選資料
      $match: {
        // 尋找 title 欄位中，包含 search 變數內容，不區分大小寫
        title: { $regex: search, $options: 'i' },
      },
    })
  }

  // 2. 使用 $facet 同時計算總數與獲取當頁資料
  // page = 2（第二頁）、limit = 3（每頁顯示 3 筆），
  // 我們直接把數字套進公式裡算給你看：
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'totalCount' }],
      data: [
        // -1 依照分數「由新而舊」排序, 新文章在前
        { $sort: { createdAt: -1 } },

        // 數學計算： $(2 - 1) * 3 = 1 * 3 = 3
        // 白話意思： 「跳過前 3 筆資料不看。」
        { $skip: (page - 1) * limit },

        // 接下來只抓取 3 筆資料
        { $limit: limit },

        // 依你的需求排除 __v
        { $project: { __v: 0 } },
      ],
    },
  })

  return await ArticleModel.aggregate(pipeline)
}
// 查詢文檔
const getDBArticles = async (page, limit, search) => {
  try {
    const result = await handleAggregate(page, limit, search)

    // 解析 $facet 出來的結果
    const totalCount = result[0]?.metadata[0]?.totalCount || 0
    const articles = result[0]?.data || []

    if (process.env.NODE_ENV === 'dev') {
      console.log('MongoDB')
    }

    if (articles.length === 0) {
      console.log('DB 沒有資料')
      return { articles: [], totalCount: 0 } // 回傳空陣列與 0 總數
    }

    // ~把它轉成字串，並強制縮排 2 個空格，這樣它就不會被縮寫，而且排版會變超漂亮
    console.log('DB Articles found:', JSON.stringify(result, null, 2))
    return { articles, totalCount }
  } 
  catch (err) {
    console.error('Error finding articles:', err)
    throw err
  }
}

export { getDBArticles }
