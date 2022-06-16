import { authOptions } from '../configs/oAuth2Client.config';

const { getEmailTransport } = require('../configs/email.config');
const { CLIENT_URL } = require('../constants');

const sendConfirmEmail = async (
  mailAdress: string,
  token: string,
  getProperText: (str: string) => string,
) => {
  const transport = await getEmailTransport();

  const mailOptions = {
    from: `Event manager <${authOptions.USER_EMAIL}>`,
    to: mailAdress,
    subject: getProperText('email.confirm.subject'),
    text: `${getProperText('email.confirm.message')} ${CLIENT_URL}/register-status?token=${token}`,
    html: `<h1>${getProperText('email.confirm.message')} 
    <a href="${CLIENT_URL}/register-status?token=${token}">${getProperText('email.confirm.subject')}</a></h1>`,
  };

  await transport.sendMail(mailOptions);
};

export default sendConfirmEmail;
