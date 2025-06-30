import { Router } from 'express';

import * as cartCtrl from '../controllers/cart';
import * as permissionMiddlewares from '../middlewares/permissions';
import * as cartMiddlewares from '../middlewares/cart';

const cartRouter = Router();

/* [POST] */
cartRouter.post(
  '/:cartId/addItem',
  permissionMiddlewares.hasPermission({ Model: 'cartItems', Action: 'create' }),
  cartMiddlewares.getCart,
  cartMiddlewares.getProduct,
  cartCtrl.addCartItem,
);

/* [GET] */

/* [DELETE] */
cartRouter.delete(
  '/:cartId/cartItems/:cartItemId',
  permissionMiddlewares.hasPermission({ Model: 'cartItems', Action: 'delete' }),
  cartCtrl.deleteCartItem,
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
