import { authOptions } from '../configs/oAuth2Client.config';

const { getEmailTransport } = require('../configs/email.config');
const { CLIENT_URL } = require('../constants');

interface Subscriber {
  email: string,
  id: string,
}

const sendComingEmail = async (
  data: Subscriber[],
) => {
  const transport = await getEmailTransport();

  // const mailOptions = {
  //   from: `Event manager <${authOptions.USER_EMAIL}>`,
  //   subject: 'email.notification.subject',
  //   text: `email.notification.message ${CLIENT_URL}/event/${eventId}`,
  //   html: `<h1>email.notification.message
  //   <a href="${CLIENT_URL}/event/${eventId}">email.notification.subject</a></h1>`,
  // };

  // data.map(async (mail) => {
  //   await transport.sendMail({ ...mailOptions, to: mail.email });
  // });

  // const mailOptions = {
  //   from: `Event manager <${authOptions.USER_EMAIL}>`,
  //   to: mail.email,
  //   subject: 'email.notification.subject',
  //   text: `email.notification.message ${CLIENT_URL}/event/${eventId}`,
  //   html: `<h1>email.notification.message
  //   <a href="${CLIENT_URL}/event/${eventId}">email.notification.subject</a></h1>`,
  // };

  data.map(async (mail) => {
    await transport.sendMail({
      from: `Event manager <${authOptions.USER_EMAIL}>`,
      to: mail.email,
      subject: 'email.notification.subject',
      text: `email.notification.message ${CLIENT_URL}/event/${mail.id}`,
      html: `<h1>email.notification.message 
      <a href="${CLIENT_URL}/event/${mail.id}">email.notification.subject</a></h1>`,
    });
  });
};

export default sendComingEmail;
