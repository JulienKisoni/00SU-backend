import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import * as teamCtrl from '../controllers/team';
import { rateLimitConfig } from '../helpers/constants';

const teamsRouter = Router();
const limiter = rateLimit(rateLimitConfig);

/* [GET] */
teamsRouter.get('/', teamCtrl.getTeams);
teamsRouter.get('/:teamId', teamCtrl.getOneTeam);

/* [POST] */
teamsRouter.post('/add', limiter, teamCtrl.addTeamCtrl);
// teamsRouter.post('/invalidateToken', limiter, userMiddleware.isAdmin, userCtrl.invalidateToken);

/* [PATCH] */
teamsRouter.patch('/:team', teamCtrl.editTeam);

/* [DELETE] */
teamsRouter.delete('/:team', teamCtrl.deleteTeam);

export { teamsRouter };
