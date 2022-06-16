const { google } = require('googleapis');

const { CLIENT_URL } = require('../constants');

export const authOptions = {
  USER_EMAIL: process.env.USER_EMAIL,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  REDIRECT_URL: CLIENT_URL,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
};

const getAuth = () => {
  const oAuth2Client = new google.auth.OAuth2(
    authOptions.CLIENT_ID,
    authOptions.CLIENT_SECRET,
    authOptions.REDIRECT_URL,
  );

  oAuth2Client.setCredentials({ refresh_token: authOptions.REFRESH_TOKEN });

  return oAuth2Client;
};

export default getAuth;
