import { Response } from 'express';

import connection, { dbParameters } from '../configs/db.config';
import { TypedRequest } from '../types/api';

const { httpStatusCode } = require('../constants');

const handleSetInterestedCategories = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `
    DELETE FROM ${dbParameters.NAME}.user_interested_categories WHERE user_id = '?';
    REPLACE INTO ${dbParameters.NAME}.user_interested_categories (user_id, category_id) 
    VALUES ?`;

    connection.query(
      sqlQuery,
      [
        req.tokenData.userId,
        req.body.data.map((categoryId) => [req.body.user_id, categoryId]),
      ],
      () => res.status(httpStatusCode.OK).send({
        message: req.t('interestedCategories.set.success'),
      }),
    );
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetInterestedCategories = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `
    SELECT category_name 
    FROM ${dbParameters.NAME}.categories c 
    INNER JOIN ${dbParameters.NAME}.user_interested_categories uic 
    ON c.id = uic.category_id
    WHERE user_id = '${req.tokenData.userId}';`;

    connection.query(sqlQuery, (err, results) => res.status(httpStatusCode.OK).send(results));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  handleSetInterestedCategories,
  handleGetInterestedCategories,
};
