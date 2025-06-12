import express from 'express';

import * as storeCtrl from '../controllers/stores';
import * as storeMiddlewares from '../middlewares/store';
import * as productCtrl from '../controllers/products';
import * as productMiddlewares from '../middlewares/products';

const storesRouter = express.Router();

/* [GET] */
storesRouter.get('/', storeCtrl.getStores);
storesRouter.get('/:storeId', storeCtrl.getOneStore);
storesRouter.get('/:storeId/products', storeMiddlewares.getStore, productCtrl.getStoreProducts);

/* [POST] */
storesRouter.post('/', storeCtrl.addStore);
storesRouter.post('/:storeId/products', storeMiddlewares.isStoreOwner, productCtrl.addProduct);

/* [DELETE] */
storesRouter.delete('/:storeId', storeCtrl.deleteStore);
storesRouter.delete('/:storeId/products/:productId', productMiddlewares.isProductOwner, productCtrl.deleteOne);

/* [PATCH] */
storesRouter.patch('/:storeId', storeMiddlewares.isStoreOwner, storeCtrl.editStore);

export { storesRouter };
