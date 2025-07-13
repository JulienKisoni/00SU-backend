import { Router } from 'express';

import * as orderCtrl from '../controllers/orders';
import * as orderMiddlewares from '../middlewares/orders';
import * as permissionMiddlewares from '../middlewares/permissions';

const orderRouters = Router();

/* [GET] */
orderRouters.get('/', permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'read' }), orderCtrl.getAllOrders);
orderRouters.get(
  '/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'read' }),
  orderMiddlewares.isTeamOrder,
  orderCtrl.getOneOrder,
);

/* [POST] */
orderRouters.post('/', permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'create' }), orderCtrl.addOrder);

/* [DELETE] */
orderRouters.delete(
  '/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'delete' }),
  orderMiddlewares.isTeamOrder,
  orderCtrl.deleteOne,
);

/* [PATCH] */
orderRouters.patch(
  '/:orderId',
  permissionMiddlewares.hasPermission({ Model: 'orders', Action: 'update' }),
  orderMiddlewares.isTeamOrder,
  orderCtrl.updateOne,
);

export { orderRouters };
