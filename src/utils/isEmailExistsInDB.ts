import connection, { dbParameters } from '../configs/db.config';

const isEmailExistsInDB = (email) => new Promise((resolve, reject) => {
  const sqlCheckEmailsQuery = `
    SELECT EXISTS(SELECT * from ${dbParameters.NAME}.users WHERE email=?) as isExists;`;

  connection.query(sqlCheckEmailsQuery, [email], (err, result) => {
    if (err) {
      return reject(err);
    }

    return resolve(Boolean(result[0].isExists));
  });
});

export default isEmailExistsInDB;
