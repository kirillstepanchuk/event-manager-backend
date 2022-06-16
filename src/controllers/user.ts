import { Response } from 'express';

import connection, { dbParameters } from '../configs/db.config';
import { TypedRequest } from '../types/api';
import isEmailExistsInDB from '../utils/isEmailExistsInDB';
import isEmailNotDuplicated from '../utils/isEmailNotDuplicated';

const { httpStatusCode } = require('../constants');

const handleGetUser = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT id, email, firstName, lastName, description, role FROM ${dbParameters.NAME}.users WHERE id=${req.tokenData.userId};`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const user = {
        userId: users[0].id,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        email: users[0].email,
        description: users[0].description,
        role: users[0].role,
      };

      return res.status(httpStatusCode.OK).send(user);
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetUserInfo = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT id, email, firstName, lastName, description, role FROM ${dbParameters.NAME}.users WHERE id=${req.query.id};`;

    connection.query(queryFindUser, async (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const user = {
        userId: users[0].id,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        email: users[0].email,
        description: users[0].description,
        role: users[0].role,
      };

      return res.status(httpStatusCode.OK).send(user);
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetAllUsers = async (req: TypedRequest, res: Response) => {
  try {
    const numPerPage = 2;
    const skip = (+req.query.page - 1) * numPerPage;
    const limit = `${skip},${numPerPage}`;

    const sqlGetUsersCountQuery = `
    SELECT count(*) as usersCount FROM ${dbParameters.NAME}.users 
    WHERE (firstName LIKE '%${req.query.title}%' OR lastName LIKE '%${req.query.title}%')
    AND role = '${req.query.role}' 
    AND isBlocked = '${req.query.isBlocked}'`;

    connection.query(sqlGetUsersCountQuery, (err, results) => {
      const numRows = results[0].usersCount;
      const numPages = Math.ceil(numRows / numPerPage);

      const queryFindUsers = `
      SELECT id, email, firstName, lastName FROM ${dbParameters.NAME}.users 
      WHERE (firstName LIKE '%${req.query.title}%' OR lastName LIKE '%${req.query.title}%')
      AND role = '${req.query.role}' 
      AND isBlocked = '${req.query.isBlocked}' 
      LIMIT ${limit};`;
      connection.query(queryFindUsers, (error, rows) => res.send({
        users: rows,
        pageCount: numPages,
      }));
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleEditUser = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT firstName, lastName, description FROM ${dbParameters.NAME}.users WHERE id=${req.tokenData.userId};`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const queryUpdateProfile = `
      UPDATE ${dbParameters.NAME}.users SET 
      firstName='${req.body.firstName}', lastName='${req.body.lastName}', description='${req.body.description}'
      WHERE id ='${req.tokenData.userId}';`;

      connection.query(queryUpdateProfile, () => {
        connection.query(queryFindUser, (error, updatedUsers) => {
          const user = {
            firstName: updatedUsers[0].firstName,
            lastName: updatedUsers[0].lastName,
            description: updatedUsers[0].description,
          };

          return res.status(httpStatusCode.OK).send(user);
        });
      });
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleEditClient = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT firstName, lastName, description FROM ${dbParameters.NAME}.users WHERE id=${req.body.clientId};`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const queryUpdateProfile = `
      UPDATE ${dbParameters.NAME}.users SET 
      firstName='${req.body.firstName}', lastName='${req.body.lastName}', description='${req.body.description}', role='${req.body.role}'
      WHERE id ='${req.body.clientId}';`;

      connection.query(queryUpdateProfile, () => {
        connection.query(queryFindUser, (error, updatedUsers) => {
          const user = {
            firstName: updatedUsers[0].firstName,
            lastName: updatedUsers[0].lastName,
            description: updatedUsers[0].description,
            role: updatedUsers[0].role,
          };

          return res.status(httpStatusCode.OK).send(user);
        });
      });
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleChangePassword = async (req: TypedRequest, res: Response) => {
  try {
    const { newPassword, currentPassword } = req.body;

    const queryFindUser = `SELECT password FROM ${dbParameters.NAME}.users WHERE id='${req.tokenData.userId}'`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const userPassword = users[0].password;

      if (userPassword !== currentPassword) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('user.changePassword.currentPasswordIncorrect'),
        });
      }

      const queryUpdatePassword = `UPDATE ${dbParameters.NAME}.users SET password='${newPassword}' WHERE id ='${req.tokenData.userId}';`;

      connection.query(
        queryUpdatePassword, () => res.status(httpStatusCode.OK).send({ message: req.t('auth.resetPassword.passwordUpdated') }),
      );
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleBlockUser = async (req: TypedRequest, res: Response) => {
  try {
    const sqlQuery = `UPDATE ${dbParameters.NAME}.users SET isBlocked='1' WHERE id='${req.query.user_id}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({
      message: req.t('user.block.success'),
    }));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleImportClients = async (req: TypedRequest, res: Response) => {
  try {
    const { clients } = req.body;

    if (!isEmailNotDuplicated(clients)) {
      return res.status(httpStatusCode.BAD_REQUEST).send({
        message: req.t('user.importClients.notDuplicated'),
      });
    }

    for (let i = 0, len = clients.length; i < len; i += 1) {
      const client = clients[i];
      if (await isEmailExistsInDB(client.email)) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: `${req.t('user.importClients.existsInDB')} ${client.email}`,
        });
      }
    }

    const sqlInsertClientsQuery = `
    INSERT INTO ${dbParameters.NAME}.users (fistName, lastName, email, role, password, isConfirmed) 
    VALUES ?`;

    connection.query(
      sqlInsertClientsQuery,
      [
        clients.map((client) => Object.values({ ...client, isConfirmed: 1 })),
      ],
      () => res.status(httpStatusCode.OK).send({
        message: req.t('user.importClients.success'),
      }),
    );
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  handleGetUser,
  handleGetAllUsers,
  handleEditUser,
  handleChangePassword,
  handleBlockUser,
  handleGetUserInfo,
  handleEditClient,
  handleImportClients,
};
