import { Router } from 'express';
import { requestOtp, verifyOtpAndLogin, refreshAccessToken, logout } from './auth.controller';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/otp/request', authRateLimiter, requestOtp);
router.post('/otp/verify', verifyOtpAndLogin);
router.post('/token/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);

export default router;
