import { Router } from 'express';

import * as graphicCtrl from '../controllers/graphic';
import * as graphicMiddlewares from '../middlewares/graphic';
import * as storeMiddlewares from '../middlewares/store';
import * as permissionMiddlewares from '../middlewares/permissions';

const graphicRouters = Router();

/* [GET] */
graphicRouters.get(
  '/stores/:storeId/all',
  permissionMiddlewares.hasPermission({ Model: 'graphics', Action: 'read' }),
  storeMiddlewares.getStore,
  graphicCtrl.getAllGraphics,
);
graphicRouters.get(
  '/stores/:storeId/:graphicId',
  permissionMiddlewares.hasPermission({ Model: 'graphics', Action: 'read' }),
  storeMiddlewares.getStore,
  graphicMiddlewares.isTeamGraphic,
  graphicCtrl.getOneGraphic,
);

/* [POST] */
graphicRouters.post(
  '/stores/:storeId/add',
  permissionMiddlewares.hasPermission({ Model: 'graphics', Action: 'create' }),
  storeMiddlewares.getStore,
  graphicCtrl.addGraphic,
);

/* [DELETE] */
graphicRouters.delete(
  '/stores/:storeId/:graphicId',
  permissionMiddlewares.hasPermission({ Model: 'graphics', Action: 'delete' }),
  storeMiddlewares.getStore,
  graphicMiddlewares.isTeamGraphic,
  graphicCtrl.deleteOne,
);

/* [PATCH] */
graphicRouters.patch(
  '/stores/:storeId/:graphicId',
  permissionMiddlewares.hasPermission({ Model: 'graphics', Action: 'update' }),
  storeMiddlewares.getStore,
  graphicMiddlewares.isTeamGraphic,
  graphicCtrl.updateOne,
);

export { graphicRouters };
