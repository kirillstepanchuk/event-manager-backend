import connection, { dbParameters } from '../configs/db.config';

const { httpStatusCode } = require('../constants');

module.exports = (rolesWithAccess) => (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;

    const sqlQuery = `
    SELECT role 
    FROM ${dbParameters.NAME}.login_tokens lt 
    JOIN ${dbParameters.NAME}.users u 
    ON lt.userId = u.id 
    WHERE token='${token}'`;

    connection.query(sqlQuery, (error, result) => {
      if (rolesWithAccess.length && !rolesWithAccess.includes(result[0].role)) {
        return res.status(httpStatusCode.UNAUTHORIZED).send({ message: req.t('rbac.noPermissions') });
      }
      next();
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};
