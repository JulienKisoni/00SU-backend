import { Router } from 'express';

import * as productCtrl from '../controllers/products';
import * as productMiddlewares from '../middlewares/products';
import * as storeMiddlewares from '../middlewares/store';
import * as permissionMiddlewares from '../middlewares/permissions';

const productsRouter = Router();

/* [GET] */
productsRouter.get('/', permissionMiddlewares.hasPermission({ Model: 'products', Action: 'read' }), productCtrl.getAllProducts);
productsRouter.get('/:productId', permissionMiddlewares.hasPermission({ Model: 'products', Action: 'read' }), productCtrl.getOne);

/* [DELETE] */
productsRouter.delete(
  '/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'delete' }),
  storeMiddlewares.getStore,
  productMiddlewares.isProductOwner,
  productCtrl.deleteOne,
);

/* [PATCH] */
productsRouter.patch(
  '/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'update' }),
  storeMiddlewares.getStore,
  productMiddlewares.getProduct,
  productCtrl.updateOne,
);

export { productsRouter };
