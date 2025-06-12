import { NextFunction, Response } from 'express';
import { mongo } from 'mongoose';
import Joi from 'joi';
import * as Sentry from '@sentry/node';

import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest } from '../types/models';
import Logger from '../utils/logger';

interface ErrorArgs {
  statusCode?: number;
  message: string;
  publicMessage?: string;
}

export class GenericError extends Error {
  statusCode: number;
  publicMessage: string;

  constructor({ statusCode, message, publicMessage }: ErrorArgs) {
    super();
    this.statusCode = statusCode || HTTP_STATUS_CODES.STH_WENT_WRONG;
    this.message = this.stack || message;
    this.publicMessage = publicMessage || 'Something went wrong';
  }
}

export const errorHandler = async (error: GenericError, req: ExtendedRequest<any>, res: Response, _next: NextFunction) => {
  const { statusCode = HTTP_STATUS_CODES.STH_WENT_WRONG, message, publicMessage = 'Something went wrong', stack } = error;
  const exception = `Public message | ${publicMessage} | Stack: ${stack || message}`;
  Logger.error(exception);
  const session = req.currentSession;
  if (session?.id) {
    await session.abortTransaction();
    await session.endSession();
  }
  Sentry.withScope((scope) => {
    const user: Sentry.User = {
      id: req.user?._id.toString(),
      email: req.user?.email,
      username: req.user?.username,
    };
    scope.setUser(user);
    Sentry.captureException(exception);
  });
  res.status(statusCode).json({
    errors: [
      {
        statusCode,
        publicMessage,
      },
    ],
  });
};

export const createError = ({ statusCode, message, publicMessage }: ErrorArgs): GenericError => {
  return new GenericError({ statusCode, message, publicMessage });
};

export const convertToGenericError = ({ error }: { error: Joi.ValidationError }): GenericError => {
  const message = error.message;
  return createError({ statusCode: HTTP_STATUS_CODES.BAD_REQUEST, message: error.stack || message, publicMessage: message });
};

interface HandleErrorArgs {
  error: GenericError | Error | Joi.ValidationError;
  publicMessage?: string;
  statusCode?: number;
  next: NextFunction;
  currentSession?: mongo.ClientSession | undefined;
}
export const handleError = async ({ error, statusCode, publicMessage, next }: HandleErrorArgs) => {
  let _error;
  if (error instanceof Joi.ValidationError) {
    _error = convertToGenericError({ error });
  } else if (error instanceof GenericError) {
    _error = error;
  } else if (error instanceof Error) {
    _error = createError({ statusCode, message: error.stack || error.message, publicMessage });
  } else {
    _error = new GenericError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Something went wrong',
      publicMessage: 'Something went wrong ',
    });
  }
  return next(_error);
};
