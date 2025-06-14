import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import * as userCtrl from '../controllers/users';
import * as userMiddleware from '../middlewares/users';
import * as permissionMiddleware from '../middlewares/permissions';
import * as teamMiddleware from '../middlewares/teams';
import * as orderCtrl from '../controllers/orders';
import { rateLimitConfig } from '../helpers/constants';

const usersRouter = Router();
const limiter = rateLimit(rateLimitConfig);

/* [GET] */
usersRouter.get('/', userCtrl.getUsers);
usersRouter.get('/:userId', userCtrl.getOneUser);
usersRouter.get('/me/orders', orderCtrl.getUserOrders);
usersRouter.get(
  '/:teamId/users',
  permissionMiddleware.hasPermission({ Model: 'users', Action: 'read' }),
  teamMiddleware.isTeamOwner,
  userCtrl.getTeamUsers,
);

/* [POST] */
usersRouter.post('/signup', limiter, userCtrl.addUserCtrl);
usersRouter.post('/invalidateToken', limiter, userMiddleware.isAdmin, userCtrl.invalidateToken);
usersRouter.post(
  '/:teamId/inviteUser',
  permissionMiddleware.hasPermission({ Model: 'users', Action: 'create' }),
  teamMiddleware.isTeamOwner,
  userCtrl.inviteUserCtrl,
);

/* [PATCH] */
usersRouter.patch('/:userId', userCtrl.editUser);

/* [DELETE] */
usersRouter.delete('/:userId', userCtrl.deleteUser);

export { usersRouter };
