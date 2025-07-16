import { Router } from 'express';

import * as productCtrl from '../controllers/products';
import * as productMiddlewares from '../middlewares/products';
import * as storeMiddlewares from '../middlewares/store';
import * as permissionMiddlewares from '../middlewares/permissions';

const productsRouter = Router();

/* [GET] */
productsRouter.get(
  '/stores/:storeId/all',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'read' }),
  storeMiddlewares.getStore,
  productCtrl.getAllProducts,
);
productsRouter.get(
  '/stores/:storeId/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'read' }),
  storeMiddlewares.getStore,
  productMiddlewares.isTeamProduct,
  productCtrl.getOne,
);

/* [DELETE] */
productsRouter.delete(
  '/stores/:storeId/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'delete' }),
  storeMiddlewares.getStore,
  productMiddlewares.isTeamProduct,
  productCtrl.deleteOne,
);

/* [PATCH] */
productsRouter.patch(
  '/stores/:storeId/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'update' }),
  storeMiddlewares.getStore,
  productMiddlewares.getProduct,
  productCtrl.updateOne,
);

export { productsRouter };
