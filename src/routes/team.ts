import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import * as teamCtrl from '../controllers/team';
import * as teamMiddleware from '../middlewares/teams';
import * as permissionMiddleware from '../middlewares/permissions';
import { rateLimitConfig } from '../helpers/constants';

const teamsRouter = Router();
const limiter = rateLimit(rateLimitConfig);

/* [GET] */
teamsRouter.get('/', permissionMiddleware.hasPermission({ Model: 'teams', Action: 'read' }), teamCtrl.getTeams); // TODO: isSuperAdmin
teamsRouter.get('/:teamId', permissionMiddleware.hasPermission({ Model: 'teams', Action: 'read' }), teamMiddleware.isTeamOwner, teamCtrl.getOneTeam);

/* [POST] */
teamsRouter.post('/add', limiter, teamCtrl.addTeamCtrl);

/* [PATCH] */
teamsRouter.patch('/:team', permissionMiddleware.hasPermission({ Model: 'teams', Action: 'update' }), teamMiddleware.isTeamOwner, teamCtrl.editTeam);

/* [DELETE] */
teamsRouter.delete(
  '/:team',
  permissionMiddleware.hasPermission({ Model: 'teams', Action: 'delete' }),
  teamMiddleware.isTeamOwner,
  teamCtrl.deleteTeam,
);

export { teamsRouter };
