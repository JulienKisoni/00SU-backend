import express from 'express';

import * as storeCtrl from '../controllers/stores';
import * as storeMiddlewares from '../middlewares/store';
import * as productCtrl from '../controllers/products';
import * as cartCtrl from '../controllers/cart';
import * as productMiddlewares from '../middlewares/products';
import * as permissionMiddlewares from '../middlewares/permissions';

const storesRouter = express.Router();

/* [GET] */
storesRouter.get('/', permissionMiddlewares.hasPermission({ Model: 'stores', Action: 'read' }), storeCtrl.getStores);
storesRouter.get('/:storeId', permissionMiddlewares.hasPermission({ Model: 'stores', Action: 'read' }), storeCtrl.getOneStore);
storesRouter.get(
  '/:storeId/products',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'read' }),
  storeMiddlewares.getStore,
  productCtrl.getStoreProducts,
);

/* [POST] */
storesRouter.post('/', permissionMiddlewares.hasPermission({ Model: 'stores', Action: 'create' }), storeCtrl.addStore);
storesRouter.post(
  '/:storeId/products',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'create' }),
  storeMiddlewares.isStoreOwner,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  productCtrl.addProduct,
);
storesRouter.post(
  '/:storeId/cart',
  permissionMiddlewares.hasPermission({ Model: 'carts', Action: 'create' }),
  storeMiddlewares.getStore,
  cartCtrl.createCart,
);

/* [DELETE] */
storesRouter.delete(
  '/:storeId',
  permissionMiddlewares.hasPermission({ Model: 'stores', Action: 'delete' }),
  storeMiddlewares.isStoreOwner,
  storeCtrl.deleteStore,
);
storesRouter.delete(
  '/:storeId/products/:productId',
  permissionMiddlewares.hasPermission({ Model: 'products', Action: 'delete' }),
  productMiddlewares.isTeamProduct,
  productCtrl.deleteOne,
);

/* [PATCH] */
storesRouter.patch(
  '/:storeId',
  permissionMiddlewares.hasPermission({ Model: 'stores', Action: 'update' }),
  storeMiddlewares.isStoreOwner,
  storeCtrl.editStore,
);

export { storesRouter };
