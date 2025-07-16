import { Router } from 'express';

import * as cartCtrl from '../controllers/cart';
import * as permissionMiddlewares from '../middlewares/permissions';
import * as storeMiddlewares from '../middlewares/store';
import * as cartMiddlewares from '../middlewares/cart';

const cartRouter = Router();

/* [POST] */
cartRouter.post(
  '/stores/:storeId/:cartId/addItems',
  permissionMiddlewares.hasPermission({ Model: 'cartItems', Action: 'create' }),
  storeMiddlewares.getStore,
  cartMiddlewares.getCart,
  cartMiddlewares.getProducts,
  cartCtrl.addCartItems,
);

/* [GET] */
cartRouter.get(
  '/stores/:storeId/:cartId',
  permissionMiddlewares.hasPermission({ Model: 'carts', Action: 'read' }),
  storeMiddlewares.getStore,
  cartMiddlewares.getCart,
  cartCtrl.getCart,
);

/* [DELETE] */
cartRouter.delete(
  '/:cartId/cartItems/:cartItemId',
  permissionMiddlewares.hasPermission({ Model: 'cartItems', Action: 'delete' }),
  storeMiddlewares.getStore,
  cartCtrl.deleteCartItem,
);
cartRouter.delete(
  '/stores/:storeId/:cartId',
  permissionMiddlewares.hasPermission({ Model: 'carts', Action: 'delete' }),
  storeMiddlewares.getStore,
  cartMiddlewares.getCart,
  cartCtrl.deleteCart,
);

/* [PATCH] */
cartRouter.patch(
  '/:cartId/cartItems/:cartItemId',
  permissionMiddlewares.hasPermission({ Model: 'cartItems', Action: 'update' }),
  cartMiddlewares.getCart,
  cartMiddlewares.getProduct,
  cartCtrl.updateCartItem,
);

export { cartRouter };
