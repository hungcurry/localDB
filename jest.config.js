export default {
  // 指定測試環境為 Node.js
  testEnvironment: 'node',

  // 測試檔案比對規則：搜尋 src 目錄下所有的 *.test.js 或 *.spec.js
  testMatch: [
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.spec.js'
  ],

  // 覆蓋率收集範圍：包含 src 下所有 .js 檔，排除測試檔與 node_modules
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],

  // 覆蓋率報告輸出目錄
  coverageDirectory: 'coverage',

  // 每次執行測試前自動清除 mock 紀錄
  clearMocks: true
};
