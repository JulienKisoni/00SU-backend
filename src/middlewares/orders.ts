import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { regex } from '../helpers/constants';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, IUserDocument, ParamsDictionary } from '../types/models';
import { handleError, createError } from './errors';
import { OrderModel } from '../models/order';

type GetOneOrderParams = API_TYPES.Routes['params']['orders']['getOne'];
export const isTeamOrder = async (req: ExtendedRequest<undefined, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneOrderParams;
  const orderIdMessages: LanguageMessages = {
    'any.required': 'Please provide a orderId',
    'string.pattern.base': 'Please provide a valid orderId',
  };
  const session = req.currentSession;
  const schema = Joi.object<GetOneOrderParams>({
    orderId: Joi.string().regex(regex.mongoId).messages(orderIdMessages),
  });

  const { error, value } = schema.validate(params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { orderId } = value;
  const { _id, teamId } = req.user || ({} as IUserDocument);
  const userId = _id.toString();
  if (!orderId || !userId || !teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Either no user, userId or orderId`,
      publicMessage: 'Ressource not found',
    });
    return next(error);
  }
  const order = await OrderModel.findOne({ _id: orderId, teamId }).lean().exec();
  if (!order?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User ${userId} may not be the owner of the order (${orderId})`,
      publicMessage: 'Please make sure the order exist and you are the owner',
    });
    return handleError({ error, next, currentSession: session });
  }
  req.isTeamOrder = true;
  req.order = order;
  next();
};
