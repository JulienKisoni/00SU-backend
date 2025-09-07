import { Router } from 'express';

import * as reportCtrl from '../controllers/reports';
import * as reportMiddlewares from '../middlewares/reports';
import * as storeMiddlewares from '../middlewares/store';
import * as permissionMiddlewares from '../middlewares/permissions';

const reportRouters = Router();

/* [GET] */
reportRouters.get(
  '/stores/:storeId/all',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'read' }),
  storeMiddlewares.getStore,
  reportCtrl.getAllReports,
);
reportRouters.get(
  '/stores/:storeId/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'read' }),
  storeMiddlewares.getStore,
  reportMiddlewares.isTeamReport,
  reportCtrl.getOneReport,
);

/* [POST] */
reportRouters.post('/', permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'create' }), reportCtrl.addReport);

/* [DELETE] */
reportRouters.delete(
  '/stores/:storeId/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'delete' }),
  storeMiddlewares.getStore,
  reportMiddlewares.isTeamReport,
  reportCtrl.deleteOne,
);

/* [PATCH] */
reportRouters.patch(
  '/stores/:storeId/:reportId',
  permissionMiddlewares.hasPermission({ Model: 'reports', Action: 'update' }),
  storeMiddlewares.getStore,
  reportMiddlewares.isTeamReport,
  reportCtrl.updateOne,
);

export { reportRouters };
