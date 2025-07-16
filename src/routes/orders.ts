import { Router } from 'express';

import * as orderCtrl from '../controllers/orders';
import * as orderMiddlewares from '../middlewares/orders';
import * as storeMiddlewares from '../middlewares/store';
import * as permissionMiddlewares from '../middlewares/permissions';

const orderRouters = Router();

/* [GET] */
orderRouters.get(
  '/stores/:storeId/all',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'read' }),
  storeMiddlewares.getStore,
  orderCtrl.getAllOrders,
);
orderRouters.get(
  '/stores/:storeId/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'read' }),
  storeMiddlewares.getStore,
  orderMiddlewares.isTeamOrder,
  orderCtrl.getOneOrder,
);

/* [POST] */
orderRouters.post('/', permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'create' }), orderCtrl.addOrder);

/* [DELETE] */
orderRouters.delete(
  '/stores/:storeId/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'delete' }),
  storeMiddlewares.getStore,
  orderMiddlewares.isTeamOrder,
  orderCtrl.deleteOne,
);

/* [PATCH] */
orderRouters.patch(
  '/stores/:storeId/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'update' }),
  storeMiddlewares.getStore,
  orderMiddlewares.isTeamOrder,
  orderCtrl.updateOne,
);

export { orderRouters };
