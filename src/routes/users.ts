import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import * as userCtrl from '../controllers/users';
import * as userMiddleware from '../middlewares/users';
import * as orderCtrl from '../controllers/orders';
import { rateLimitConfig } from '../helpers/constants';

const usersRouter = Router();
const limiter = rateLimit(rateLimitConfig);

/* [GET] */
usersRouter.get('/', userCtrl.getUsers);
usersRouter.get('/:userId', userCtrl.getOneUser);
usersRouter.get('/me/orders', orderCtrl.getUserOrders);

/* [POST] */
usersRouter.post('/signup', limiter, userCtrl.addUserCtrl);
usersRouter.post('/invalidateToken', limiter, userMiddleware.isAdmin, userCtrl.invalidateToken);

/* [PATCH] */
usersRouter.patch('/:userId', userCtrl.editUser);

/* [DELETE] */
usersRouter.delete('/:userId', userCtrl.deleteUser);

export { usersRouter };
