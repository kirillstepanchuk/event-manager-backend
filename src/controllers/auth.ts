import { Response } from 'express';

import connection, { dbParameters } from '../configs/db.config';
import { TypedRequest } from '../types/api';
import sendResetEmail from '../utils/sendResetEmail';
import sendConfirmEmail from '../utils/sendConfirmEmail';
import getExpireTokenTime from '../utils/getExpireTokenTime';

const jwt = require('jsonwebtoken');

const { EXPIRE_HOURS, httpStatusCode, DEFAULT_ROLE } = require('../constants');

const handleRegisterUser = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindByEmail = `SELECT email, isConfirmed FROM ${dbParameters.NAME}.users WHERE email='${req.body.email}'`;

    connection.query(queryFindByEmail, (err, users) => {
      if (users.length > 0) {
        if (users[0].isConfirmed) {
          return res.status(httpStatusCode.BAD_REQUEST).send({
            message: req.t('auth.register.emailAlreadyRegistered'),
          });
        }
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.register.emailRegistereedButNotConfirmed'),
        });
      }

      const queryAddUser = `
      INSERT INTO ${dbParameters.NAME}.users (email, firstName, lastName, password, role) 
      VALUES ('${req.body.email}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.password}', '${DEFAULT_ROLE}');
      `;

      connection.query(queryAddUser, (error, results) => {
        const token = jwt.sign(
          { userId: results.insertId },
          process.env.JWT_SECRET,
          { expiresIn: `${EXPIRE_HOURS}h` },
        );

        const expireTime = getExpireTokenTime();

        const queryInsertOrUpdateToken = `
        REPLACE INTO ${dbParameters.NAME}.register_tokens (userId, token, expireDate) 
        VALUES (${results.insertId}, '${token}', '${expireTime}')
        `;

        connection.query(queryInsertOrUpdateToken);

        sendConfirmEmail(req.body.email, token, req.t);

        if (error) {
          return res.status(httpStatusCode.BAD_REQUEST).send({
            message: req.t('auth.register.fail'),
          });
        }
        return res.status(httpStatusCode.OK).send({
          message: req.t('auth.register.sentConfirmEmail'),
        });
      });
    });
  } catch (err) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleConfirmUser = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT * FROM ${dbParameters.NAME}.users WHERE id='${req.tokenData.userId}'`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const queryUpdateIsConfirmed = `UPDATE ${dbParameters.NAME}.users SET isConfirmed='${1}' WHERE id ='${req.tokenData.userId}';`;

      connection.query(
        queryUpdateIsConfirmed, () => res.status(httpStatusCode.OK).send({ message: req.t('auth.register.success') }),
      );
    });
  } catch (err) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleLoginUser = async (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT id, password, email, firstName, lastName, isConfirmed, description, role FROM ${dbParameters.NAME}.users WHERE email='${req.body.email}'`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisEmail'),
        });
      }

      const user = users[0];

      if (!user.isConfirmed) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.userIsNotConfirmed'),
        });
      }

      const passwordMatch:boolean = req.body.password === user.password;

      if (!passwordMatch) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.wrongPassword'),
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRE_HOURS}h` },
      );

      const expireTime = getExpireTokenTime();

      const queryInsertOrUpdateToken = `
      REPLACE INTO ${dbParameters.NAME}.login_tokens (userId, token, expireDate) 
      VALUES (${user.id}, '${token}', '${expireTime}') 
      `;

      connection.query(queryInsertOrUpdateToken);

      return res.status(httpStatusCode.OK).send({
        token,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        description: user.description,
        role: user.role,
      });
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleForgotPassword = (req: TypedRequest, res: Response) => {
  try {
    const queryFindUser = `SELECT * FROM ${dbParameters.NAME}.users WHERE email='${req.body.email}'`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisEmail'),
        });
      }

      const user = users[0];

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: `${EXPIRE_HOURS}h` },
      );

      const expireTime = getExpireTokenTime();

      const queryInsertOrUpdateToken = `
      REPLACE INTO ${dbParameters.NAME}.reset_tokens (userId, token, expireDate) 
      VALUES (${user.id}, '${token}', '${expireTime}') 
      `;

      connection.query(queryInsertOrUpdateToken);

      sendResetEmail(user.email, token, req.t);

      return res.status(httpStatusCode.OK).send({ message: req.t('auth.resetPassword.linkSent') });
    });
  } catch (error: unknown) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleResetPassword = (req: TypedRequest, res: Response) => {
  try {
    const { newPassword } = req.body;

    const queryFindUser = `SELECT * FROM ${dbParameters.NAME}.users WHERE id='${req.tokenData.userId}'`;

    connection.query(queryFindUser, (err, users) => {
      if (users.length === 0) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('auth.login.noUserWithThisId'),
        });
      }

      const queryUpdatePassword = `UPDATE ${dbParameters.NAME}.users SET password='${newPassword}' WHERE id ='${req.tokenData.userId}';`;

      connection.query(
        queryUpdatePassword, () => res.status(httpStatusCode.OK).send({ message: req.t('auth.resetPassword.passwordUpdated') }),
      );
    });
  } catch (err) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  handleRegisterUser,
  handleConfirmUser,
  handleLoginUser,
  handleForgotPassword,
  handleResetPassword,
};
