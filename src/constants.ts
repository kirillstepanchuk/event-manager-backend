module.exports = {
  // CLIENT_URL: 'https://eventsfront.herokuapp.com',
  KM_IN_DEG: 111.321377778,
  CLIENT_URL: 'http://localhost:3001',
  FILE_SIZE_LIMIT: '50mb',
  EXPIRE_HOURS: 20,
  DEFAULT_TIME_ZONE: 'Europe/Minsk',
  NAME_REG_EXP: /^[A-Za-z]+$/i,
  PHONE_REG_EXP: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  TOKEN_REG_EXP: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
  PAYMENT_SESSION_ID_REG_EXP: /^[A-Za-z0-9-_]*$/,
  PAYMENT_SESSION_MODE: 'payment',
  CALENDAR_ID: 'primary',
  SUCCESS_PAYMENT_STATUS: 'paid',
  DEFAULT_ROLE: 'customer',
  eventTypes: {
    ORGANIZED: 'organized',
    BOOKED: 'booked',
    HISTORY: 'history',
  },
  appParameters: {
    PORT: process.env.PORT || 5000,
  },
  languages: {
    ENGLISH: 'en',
    GERMAN: 'de',
  },
  httpStatusCode: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500,
  },
  roles: {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super-admin',
  },
};
