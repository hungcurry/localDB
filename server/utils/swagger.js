import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
// ~npm install swagger-jsdoc swagger-ui-express
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'localDB API 文件',
      version: '1.0.0',
      description: 'API 文件，提供了所有可用的 API 端點和使用說明。',
      contact: {
        name: '技術支援團隊',
        url: 'https://support.example.com',
        email: 'support@example.com'
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: '本地開發伺服器' },
      { url: 'https://localdb-1w4g.onrender.com', description: '生產環境伺服器' }
    ]
  },
  apis: ['./server/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
export { swaggerDocs, swaggerUi };
