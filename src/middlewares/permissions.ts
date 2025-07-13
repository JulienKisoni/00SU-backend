import { NextFunction, Response } from 'express';

import { ExtendedRequest, ParamsDictionary, PERMISSION_LEVEL_KEYS, PermissionKey } from '../types/models';
import { createError } from './errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { roleActions } from '../permissions';

interface HasPerm {
  Model: PermissionKey;
  Action: PERMISSION_LEVEL_KEYS;
}

export const hasPermission = ({ Model, Action }: HasPerm) => {
  return (req: ExtendedRequest<unknown, ParamsDictionary>, _res: Response, next: NextFunction) => {
    const { user } = req;
    const role = user?.profile?.role;
    if (!role) {
      const error = createError({
        statusCode: HTTP_STATUS_CODES.FORBIDDEN,
        message: `User (${req.user?._id}) has no role`,
        publicMessage: 'Unauthorized to perform this Action',
      });
      return next(error);
    }
    const targetPermission = `${Model}.${Action}`;
    const adminPermission = `${Model}.*`;
    const userPermissions = roleActions[role];
    const hasAccess = userPermissions.some((perm) => perm === adminPermission || perm === targetPermission);
    if (!hasAccess) {
      const error = createError({
        statusCode: HTTP_STATUS_CODES.FORBIDDEN,
        message: `User (${req.user?._id}) not allowed`,
        publicMessage: 'Unauthorized to perform this Action',
      });
      return next(error);
    }
    return next();
  };
};
