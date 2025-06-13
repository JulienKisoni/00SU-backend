import { NextFunction, Response } from 'express';

import { ExtendedRequest } from '../types/models';
import { createError } from './errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { TeamModel } from '../models/team';

export const isTeamOwner = async (req: ExtendedRequest<unknown>, _res: Response, next: NextFunction) => {
  const { user } = req;
  const team = await TeamModel.findOne({ _id: user?.teamId, owner: user?._id }).exec();
  if (team?.id) {
    req.isTeamOwner = true;
    next();
  } else {
    req.isTeamOwner = false;
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User (${req.user?._id}) is not team owner`,
      publicMessage: 'Unauthorized to perform this action',
    });
    return next(error);
  }
};
