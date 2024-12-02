import registerUser from '../controllers/auth-controller/registerUser.js';
import loginUser from '../controllers/auth-controller/loginUser.js';

import express from 'express';


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;