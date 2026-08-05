const secret = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresDay: process.env.JWT_EXPIRES_DAY,
  variables: process.env.VARIABLES,
}

export default secret
