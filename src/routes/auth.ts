import express from 'express';

import validate from '../middleware/validate';
import verifyToken from '../middleware/verifyToken';
import {
  loginSchema, registerSchema, confirmRegistrationSchema, forgotPasswordSchema, resetPasswordSchema,
} from './validationSchemas/auth';

const {
  handleRegisterUser,
  handleConfirmUser,
  handleLoginUser,
  handleForgotPassword,
  handleResetPassword,
} = require('../controllers/auth');

const router = express();

router.post('/register', validate(registerSchema), handleRegisterUser);
router.post('/confirm-account', validate(confirmRegistrationSchema), verifyToken, handleConfirmUser);
router.post('/login', validate(loginSchema), handleLoginUser);
router.post('/forgot-password', validate(forgotPasswordSchema), handleForgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), verifyToken, handleResetPassword);

export default router;
