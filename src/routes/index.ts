import express, { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

import { usersRouter } from './users';
import { storesRouter } from './stores';
import { productsRouter } from './products';
import { reviewRouter } from './reviews';
import { orderRouters } from './orders';
import { authRouter } from './auth';
import { teamsRouter } from './team';
import { HTTP_STATUS_CODES } from '../types/enums';
import { rateLimitConfig } from '../helpers/constants';

const router = express.Router();
const limiter = rateLimit(rateLimitConfig);

const getController = (_req: Request, res: Response) => {
  res.status(HTTP_STATUS_CODES.OK).json({ res: 'ok' });
};

/* GET home page. */
router.get('/', getController);
router.get('/debug-sentry', function mainHandler() {
  throw new Error('My first Sentry error!');
});

router.use('/users', usersRouter);
router.use('/stores', storesRouter);
router.use('/products', productsRouter);
router.use('/reviews', reviewRouter);
router.use('/orders', orderRouters);
router.use('/auth', limiter, authRouter);
router.use('/teams', teamsRouter);

export default router;
