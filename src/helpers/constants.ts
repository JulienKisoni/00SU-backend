import { type Options } from 'express-rate-limit';

import { handleError } from '../middlewares/errors';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, ParamsDictionary } from '../types/models';

export const nonSecureRoutes: { path: string; method: string }[] = [
  {
    path: '/auth/login',
    method: 'POST',
  },
  {
    path: '/auth/refreshToken',
    method: 'POST',
  },
  {
    path: '/teams/add',
    method: 'POST',
  },
  {
    path: '/users/signup',
    method: 'POST',
  },
  {
    path: '/v1/api-docs',
    method: 'GET',
  },
  {
    path: '/favicon.ico',
    method: 'GET',
  },
  {
    path: '/debug-sentry',
    method: 'GET',
  },
];

export const regex = {
  mongoId: /^[0-9a-fA-F]{24}$/,
};

export const rateLimitConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true,
  handler: (req: ExtendedRequest<unknown, ParamsDictionary>, __, next, options) => {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: options.message,
      publicMessage: 'Too many requests, please try again later.',
    });
    return handleError({ error, next, currentSession: req.currentSession });
  },
};
