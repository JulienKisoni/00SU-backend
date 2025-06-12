import { NextFunction, Request, Response } from 'express';

import { IUserMethods } from '../models/user';
import { USER_ROLES } from '../types/models';
import { createError } from './errors';
import { HTTP_STATUS_CODES } from '../types/enums';

interface ExtendedRequest extends Request {
  user?: IUserMethods;
  tokenId?: string;
}

export const isAdmin = (req: ExtendedRequest, _res: Response, next: NextFunction) => {
  const { user } = req;
  const role = user?.profile?.role;
  if (!role || role !== USER_ROLES.admin) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDEN,
      message: `User (${req.user?._id}) is not admin`,
      publicMessage: 'Unauthorized to perform this action',
    });
    return next(error);
  }
  next();
};
