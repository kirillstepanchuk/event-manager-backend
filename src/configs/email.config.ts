import getAuth, { authOptions } from './oAuth2Client.config';

const nodemailer = require('nodemailer');

const getEmailTransport = async () => {
  const oAuth2Client = await getAuth();

  const accessToken = await oAuth2Client.getAccessToken();

  const transport = await nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: authOptions.USER_EMAIL,
      clientId: authOptions.CLIENT_ID,
      clientSecret: authOptions.CLIENT_SECRET,
      refreshToken: authOptions.REFRESH_TOKEN,
      accessToken,
    },
  });

  return transport;
};

module.exports = {
  getEmailTransport,
};
