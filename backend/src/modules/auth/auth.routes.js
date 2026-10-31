import { Router } from 'express';
import { register, login, getMe, logout } from './auth.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;
