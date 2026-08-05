import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// ~npm install swagger-jsdoc swagger-ui-express

// swagger-jsdoc 設定
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "localDB API 文件",
      version: "1.0.0",
      description: "API 文件，提供了所有可用的 API 端點和使用說明。",
      contact: {
        name: "技術支援團隊",
        url: "https://support.example.com",
        email: "support@example.com",
      },
    },
    components: {
      securitySchemes: {
        /**
         * 第一個：Token 組專用 (API Key 模式)
         * 適用於：/token/validate 等 API
         * 使用方式：在 UI 輸入框直接輸入密鑰即可
         */
        tokenAuth: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
          description: "【Token 組專用】請輸入 Token 密鑰 (直接輸入值)",
        },
        /**
         * 第二個：User 組專用 (HTTP Bearer 模式)
         * 適用於：/{env}/users、profile 等 API
         * 使用方式：只需輸入 JWT 字串，Swagger 會自動加上 'Bearer ' 前綴
         */
        JWTAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "【User 組專用】請輸入 JWT Token (系統會自動補上 Bearer 前綴)",
        },
      },
    },
    servers: [
      { url: "http://localhost:3000", description: "本地開發伺服器" },
      { url: "https://local-db.vercel.app", description: "生產環境伺服器" },
    ],
  },
  // 從專案根目錄出發指向 src/routes
  apis: ["./src/routes/*.js", "./src/routes/**/*.js"],
};

// swagger-ui-express UI 設定
// !解決部屬Vercel Swagger(無法顯示問題) => 使用CDN
const SWAGGER_OPTIONS = {
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
export { swaggerDocs, swaggerUi, SWAGGER_OPTIONS };
