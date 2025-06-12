import { Router } from 'express';

import * as productCtrl from '../controllers/products';
import * as reviewCtrl from '../controllers/reviews';
import * as productMiddlewares from '../middlewares/products';
import * as storeMiddlewares from '../middlewares/store';

const productsRouter = Router();

/* [GET] */
productsRouter.get('/', productCtrl.getAllProducts);
productsRouter.get('/:productId', productCtrl.getOne);
productsRouter.get('/:productId/reviews', productMiddlewares.getProduct, reviewCtrl.getProductReviews);

/* [DELETE] */
productsRouter.delete('/:productId', storeMiddlewares.getStore, productMiddlewares.isProductOwner, productCtrl.deleteOne);

/* [PATCH] */
productsRouter.patch('/:productId', storeMiddlewares.getStore, productMiddlewares.isProductOwner, productCtrl.updateOne);

export { productsRouter };
