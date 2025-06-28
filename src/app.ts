import createError from 'http-errors';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
// import swaggerUi from 'swagger-ui-express';
// import * as Sentry from '@sentry/node';

import httpLogger from './middlewares/httpLogger';
import { validateToken } from './middlewares/validateToken';
import router from './routes/index';
import { errorHandler } from './middlewares/errors';
// import { generateSwaggerDoc } from '../swagger';
import { handleTransaction } from './middlewares/session-transaction';

const TEST_ENABLED = process.env.TEST_ENABLED === 'true';
// const LOAD_TEST_ENABLED = process.env.LOAD_TEST_ENABLED === 'true';

const app: express.Application = express();

if (!TEST_ENABLED) {
  app.use(httpLogger);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// const swaggerDoc = generateSwaggerDoc();
// app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
const fakeRouter = express.Router();
const getController = (_req: Request, res: Response) => {
  res.status(200).json({ res: 'ok' });
};
fakeRouter.get('/', getController);

app.use('/ping', fakeRouter);

app.use(validateToken);
app.use(handleTransaction);
app.use('/v1', router);

/* if (!TEST_ENABLED && !LOAD_TEST_ENABLED && Sentry) {
  // The error handler must be registered before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);
} */

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createError(404));
});

app.use(errorHandler);

export { app };
