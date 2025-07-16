import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { regex } from '../helpers/constants';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, IUserDocument, ParamsDictionary } from '../types/models';
import { handleError, createError } from './errors';
import { GraphicModel } from '../models/graphic';

type GetOneGraphicParams = API_TYPES.Routes['params']['graphics']['getOne'];

export const isTeamGraphic = async (req: ExtendedRequest<undefined, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneGraphicParams;
  const graphicIdMessages: LanguageMessages = {
    'any.required': 'Please provide a graphicId',
    'string.pattern.base': 'Please provide a valid graphicId',
  };
  const session = req.currentSession;
  const schema = Joi.object<GetOneGraphicParams>({
    graphicId: Joi.string().regex(regex.mongoId).required().messages(graphicIdMessages),
  });

  const { error, value } = schema.validate(params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { graphicId } = value;
  const { _id, teamId } = req.user || ({} as IUserDocument);
  const userId = _id.toString();
  const storeId = req.storeId?.toString();
  if (!graphicId || !userId || !teamId || !storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Either no user, userId, storeId or graphicId`,
      publicMessage: 'Resource not found',
    });
    return next(error);
  }
  const graphic = await GraphicModel.findOne({ _id: graphicId, teamId, storeId }).lean().exec();
  if (!graphic?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User ${userId} may not be the owner of the graphic (${graphicId})`,
      publicMessage: 'Please make sure the graphic exist and you are the owner',
    });
    return handleError({ error, next, currentSession: session });
  }
  req.isTeamGraphic = true;
  req.graphic = graphic;
  next();
};
