const db = {
  mongoEnv: process.env.MONGO_ENV,
  mongoUriProd: process.env.MONGO_URI_PROD,
  mongoUriDev: process.env.MONGO_URI_DEV,
  mongoUriTest: process.env.MONGO_URI_TEST,
}

export default db
