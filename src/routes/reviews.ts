import { Router } from 'express';

import * as productMiddlewares from '../middlewares/products';
import * as reviewMiddlewares from '../middlewares/reviews';
import * as reviewCtrl from '../controllers/reviews';

const reviewRouter = Router();

/* [GET] */
reviewRouter.get('/', reviewCtrl.getAllReviews);
reviewRouter.get('/:reviewId', reviewCtrl.getOneReview);

/* [DELETE] */
reviewRouter.delete('/:reviewId', productMiddlewares.getProduct, reviewCtrl.deleteOne);

/* [POST] */
reviewRouter.post('/', productMiddlewares.isNotProductOwner, reviewMiddlewares.notAlreadyReviewed, reviewCtrl.addReview);

/* [POST] */
reviewRouter.patch('/:reviewId', reviewMiddlewares.isReviewOwner, reviewCtrl.updateOne);

export { reviewRouter };
