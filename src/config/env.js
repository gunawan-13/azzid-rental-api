require('dotenv').config();
module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  jwtSecret: process.env.JWT_SECRET || 'CHANGE_ME_IN_ENV',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || '',
  db: { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME || 'azzid_rental', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' }
};
