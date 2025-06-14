import { Router } from 'express';

import * as authCtrl from '../controllers/auth';

const authRouter = Router();

authRouter.post('/login', authCtrl.login);
authRouter.post('/refreshToken', authCtrl.refreshToken);
authRouter.post('/recoverPassword', authCtrl.recoverPassword);

export { authRouter };
