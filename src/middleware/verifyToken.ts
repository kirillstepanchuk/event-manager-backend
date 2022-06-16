import connection, { dbParameters } from '../configs/db.config';

const jwt = require('jsonwebtoken');

const { httpStatusCode } = require('../constants');

const isTokenExpired = (expiredDate) => {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  return currentDate >= expiredDate;
};

const verifyToken = (req, res, next) => {
  const requestToken = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;
  const { action } = req.query;

  if (!requestToken) {
    return res.status(httpStatusCode.UNAUTHORIZED).send({
      message: req.t('token.verify.tokenIsRequired'),
    });
  }

  try {
    const queryFindToken = `SELECT expireDate FROM ${dbParameters.NAME}.${action}_tokens WHERE token='${requestToken}'`;

    connection.query(queryFindToken, (error, storedTokens) => {
      if (storedTokens.length === 0) {
        return res.status(httpStatusCode.UNAUTHORIZED).send({
          message: req.t('token.verify.noTokenInDataBase'),
        });
      }

      const { expireDate } = storedTokens[0];

      if (isTokenExpired(expireDate)) {
        return res.status(httpStatusCode.UNAUTHORIZED).send({
          message: req.t('token.verify.invalidToken'),
        });
      }

      jwt.verify(requestToken, process.env.JWT_SECRET, (e, decoded) => {
        if (e) {
          return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
            message: req.t('token.verify.expired'),
          });
        }
        req.tokenData = decoded;
        next();
      });
    });
  } catch (err) {
    return res.status(httpStatusCode.UNAUTHORIZED).send({
      message: req.t('token.verify.invalidToken'),
    });
  }
};

export default verifyToken;
