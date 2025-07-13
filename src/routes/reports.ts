import { Router } from 'express';

import * as reportCtrl from '../controllers/reports';
import * as reportMiddlewares from '../middlewares/reports';
import * as permissionMiddlewares from '../middlewares/permissions';

const reportRouters = Router();

/* [GET] */
reportRouters.get('/', permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'read' }), reportCtrl.getAllReports);
reportRouters.get(
  '/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'read' }),
  reportMiddlewares.isTeamReport,
  reportCtrl.getOneReport,
);

/* [POST] */
reportRouters.post('/', permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'create' }), reportCtrl.addReport);

/* [DELETE] */
reportRouters.delete(
  '/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'delete' }),
  reportMiddlewares.isTeamReport,
  reportCtrl.deleteOne,
);

/* [PATCH] */
reportRouters.patch(
  '/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'update' }),
  reportMiddlewares.isTeamReport,
  reportCtrl.updateOne,
);

export { reportRouters };
