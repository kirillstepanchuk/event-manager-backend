import { authOptions } from '../configs/oAuth2Client.config';

const { getEmailTransport } = require('../configs/email.config');
const { CLIENT_URL } = require('../constants');

const sendResetEmail = async (
  mailAdress: string,
  token: string,
  getProperText: (str: string) => string,
) => {
  const transport = await getEmailTransport();

  const mailOptions = {
    from: `Event manager <${authOptions.USER_EMAIL}>`,
    to: mailAdress,
    subject: getProperText('email.resetPassword.subject'),
    text: `${getProperText('email.resetPassword.message')} ${CLIENT_URL}/reset-password?token=${token}`,
    html: `<h1>${getProperText('email.resetPassword.message')} 
    <a href="${CLIENT_URL}/reset-password?token=${token}">${getProperText('email.resetPassword.subject')}</a></h1>`,
  };

  await transport.sendMail(mailOptions);
};

export default sendResetEmail;
