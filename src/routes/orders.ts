import { Router } from 'express';

import * as orderCtrl from '../controllers/orders';
import * as orderMiddlewares from '../middlewares/orders';

const orderRouters = Router();

/* [GET] */
orderRouters.get('/', orderCtrl.getAllOrders);
orderRouters.get('/:orderId', orderMiddlewares.isOrderOwner, orderCtrl.getOneOrder);

/* [POST] */
orderRouters.post('/', orderCtrl.addOrder);

/* [DELETE] */
orderRouters.delete('/:orderId', orderMiddlewares.isOrderOwner, orderCtrl.deleteOne);

/* [PATCH] */
orderRouters.patch('/:orderId', orderMiddlewares.isOrderOwner, orderCtrl.updateOne);

export { orderRouters };
