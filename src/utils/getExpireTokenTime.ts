const { EXPIRE_HOURS } = require('../constants');

const getExpireTokenTime = () => {
  const date = new Date();

  date.setMilliseconds(EXPIRE_HOURS * 60 * 60 * 1000);

  return date.toISOString().slice(0, 19).replace('T', ' ');
};

export default getExpireTokenTime;
