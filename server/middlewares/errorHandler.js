// !catchAsyncErrors 的作用：
// 主要功能：它用來捕捉異步函數（例如 async 和 await 函數）中的錯誤。
// Express 本身無法自動捕捉非同步錯誤，
// 所以我們需要 catchError 來捕捉這些錯誤，如果不用 就是每個fun都要寫 try catch
const catchAsyncErrors = (asyncFn) => {
  return (req, res, next) => {
    // 方法一 只傳 通用伺服器錯誤 不讓客戶端知道詳細的伺服器錯誤
    asyncFn(req, res, next).catch((err) => {
      console.log('伺服器錯誤捕捉::', err)
       // 只傳通用的伺服器錯誤給客戶端
      res.status(500).send({
        message: '伺服器錯誤',
      })
    })

    // 方法二 捕捉錯誤並傳遞給 next()
    // 會傳遞 handleHttpErrors 然後客戶端 就會知道詳細的伺服器錯誤
    // asyncFn(req, res, next).catch(next)
  }
}

// !catchHttpErrors 的作用：
// 主要功能：作為 Express 應用的錯誤處理中間件，
// 用來處理從路由或中間件傳遞過來的所有錯誤。
// 它會依據錯誤的類型或狀態，回應不同的 HTTP 狀態碼和錯誤訊息
// 讓用戶能夠知道發生了什麼錯誤。
const catchHttpErrors = (err, req, res, next) => {
  // 設定本地變量，僅在開發環境中提供錯誤信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'dev' ? err : {};

  // 錯誤日誌（僅在開發環境中）
  if (req.app.get('env') === 'dev') {
    console.error(`[ 錯誤名稱 ]: ${err.name}`);
    console.error(`[ 錯誤訊息 ]: ${err.message}`);
    console.error(`[ 堆疊追蹤 ]: ${err.stack}`);
    console.error(`----`);
  }

  // 用來生成錯誤回應的輔助函式
  const errorResponse = (status, message, details = null) => {
    const response = { status: 'error', message, statecode: status };
    if (details && Object.keys(details).length > 0) response.details = details;
    return res.status(status).json(response);
  };

  // 根據錯誤名稱進行處理
  switch (err.name) {
    case 'CastError':
      return errorResponse(400, 'Invalid ObjectId format', { error: err.message });
    case 'ValidationError':
      return errorResponse(400, 'Validation Error', { error: err.message });
    case 'UnauthorizedError':
      return errorResponse(401, 'Unauthorized', { error: err.message });
    case 'ForbiddenError':
      return errorResponse(403, 'Forbidden', { error: err.message });
    case 'NotFoundError':
      return errorResponse(404, 'Resource Not Found', { error: err.message });
    case 'SyntaxError':
      return errorResponse(400, 'Syntax Error', { error: err.message });
    case 'TypeError':
      return errorResponse(400, 'Type Error', { error: err.message });
    case 'RangeError':
      return errorResponse(400, 'Range Error', { error: err.message });
    case 'ReferenceError':
      return errorResponse(400, 'Reference Error', { error: err.message });
    default:
      // 對於未知錯誤，返回 500 並記錄錯誤，但不將詳細訊息暴露給客戶端
      return errorResponse(
        err.status || 500,
        req.app.get('env') === 'dev' ? err.message : 'Internal Server Error',
        req.app.get('env') === 'dev' ? { stack: err.stack } : null
      );
  }
}

export { catchAsyncErrors, catchHttpErrors }
