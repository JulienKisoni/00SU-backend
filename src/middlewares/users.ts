import { NextFunction, Response } from 'express';

import { ExtendedRequest, USER_ROLES } from '../types/models';
import { createError } from './errors';
import { HTTP_STATUS_CODES } from '../types/enums';

interface ParamsDictionary {
  [key: string]: string;
}

export const isAdmin = (req: ExtendedRequest<unknown, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const { user } = req;
  const role = user?.profile?.role;
  if (!role || role !== USER_ROLES.admin) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User (${req.user?._id}) is not admin`,
      publicMessage: 'Unauthorized to perform this action',
    });
    return next(error);
  }
  next();
};
export const isManager = (req: ExtendedRequest<unknown, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const { user } = req;
  const role = user?.profile?.role;
  if (!role || role !== USER_ROLES.manager) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User (${req.user?._id}) is not manager`,
      publicMessage: 'Unauthorized to perform this action',
    });
    return next(error);
  }
  next();
};
export const isClerk = (req: ExtendedRequest<unknown, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const { user } = req;
  const role = user?.profile?.role;
  if (!role || role !== USER_ROLES.clerk) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User (${req.user?._id}) is not clerk`,
      publicMessage: 'Unauthorized to perform this action',
    });
    return next(error);
  }
  next();
};

interface IsUserParams extends ParamsDictionary {
  userId: string;
}

export const isHisUser = (req: ExtendedRequest<unknown, IsUserParams>, _res: Response, next: NextFunction) => {
  const { user } = req;
  const userId = req.params.userId;
  if (user?._id && userId && user._id === userId) {
    next();
  }
  const error = createError({
    statusCode: HTTP_STATUS_CODES.FORBIDDEN,
    message: `User (${req.user?._id}) is not the same`,
    publicMessage: 'Unauthorized to perform this action',
  });
  return next(error);
};
