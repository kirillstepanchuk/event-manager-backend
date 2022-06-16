import express from 'express';

import validate from '../middleware/validate';
import verifyToken from '../middleware/verifyToken';
import { changePasswordSchema, editUserSchema } from './validationSchemas/user';

const {
  handleGetUser,
  handleGetAllUsers,
  handleEditUser,
  handleChangePassword,
  handleBlockUser,
  handleGetUserInfo,
  handleEditClient,
  handleImportClients,
} = require('../controllers/user');
const rbac = require('../middleware/rbac');
const { roles } = require('../constants');

const router = express();

router.get('/get-user', verifyToken, handleGetUser);
router.get('/get-all-users', verifyToken, rbac([roles.SUPER_ADMIN]), handleGetAllUsers);
router.post('/block-user', verifyToken, rbac([roles.SUPER_ADMIN]), handleBlockUser);
router.post('/edit-user', validate(editUserSchema), verifyToken, handleEditUser);
router.post('/change-password', validate(changePasswordSchema), verifyToken, handleChangePassword);
router.get('/get-user-info', verifyToken, rbac([roles.SUPER_ADMIN]), handleGetUserInfo);
router.post('/edit-user-info', validate(editUserSchema), verifyToken, rbac([roles.SUPER_ADMIN]), handleEditClient);
router.post('/import-clients', handleImportClients);

export default router;
