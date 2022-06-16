const mysql = require('mysql');
require('dotenv').config();

export const dbParameters = {
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT,
  USERNAME: process.env.DB_USERNAME,
  USER_PASSWORD: process.env.DB_USER_PASSWORD,
  NAME: process.env.DB_NAME,
};

const connection = mysql.createPool({
  host: dbParameters.HOST,
  port: dbParameters.PORT,
  user: dbParameters.USERNAME,
  password: dbParameters.USER_PASSWORD,
  database: dbParameters.NAME,
  multipleStatements: true,
});

export default connection;
