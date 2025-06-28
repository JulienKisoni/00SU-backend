import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { createError } from './errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { IUserMethods, UserModel } from '../models/user';
import { nonSecureRoutes } from '../helpers/constants';

interface ExtendedRequest<B> extends Request {
  user?: IUserMethods;
  tokenId?: string;
  body: B;
}

export const validateToken = async (req: ExtendedRequest<undefined>, _res: Response, next: NextFunction) => {
  const byPassToken = nonSecureRoutes.some((route) => {
    const { path, method } = req;
    return path.includes(route.path) && method.toLowerCase() === route.method.toLowerCase();
  });
  if (byPassToken) {
    return next();
  }
  const authorization = req.get('Authorization');
  if (!authorization) {
    const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'No authorization header', publicMessage: 'Unauthorized' });
    return next(error);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, token] = authorization.split(' ');
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  if (!ACCESS_TOKEN_SECRET) {
    const error = createError({ statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG, message: 'No ACCESS_TOKEN_SECRET env variable' });
    return next(error);
  }
  if (!token) {
    const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'No token', publicMessage: 'Unauthorized' });
    return next(error);
  }
  try {
    const decoded = verify(token, ACCESS_TOKEN_SECRET);
    const decodedToken = decoded as API_TYPES.DecodedToken;
    const user = await UserModel.findById<IUserMethods>(decodedToken.sub).exec();
    if (!user || !user._id || !user?.checkValidToken) {
      const error = createError({
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: 'Cannot find associated user',
        publicMessage: 'Unauthorized',
      });
      return next(error);
    }
    // compare tokens
    const isTokenInvalidated = user.checkValidToken(decodedToken);
    if (isTokenInvalidated) {
      const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'Token expired', publicMessage: 'Please re-login' });
      return next(error);
    }
    req.user = user;
    return next();
  } catch (err) {
    if (err.message.includes('jwt expired')) {
      const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'Token expired', publicMessage: 'Refresh your token' });
      return next(error);
    }
    const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'Cannot verify token' });
    return next(error);
  }
};
