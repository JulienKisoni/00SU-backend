import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest, ParamsDictionary } from '../types/models';
import { regex } from '../helpers/constants';
import { createError, handleError } from '../middlewares/errors';
import * as graphicBusiness from '../business/graphic';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddGraphicBody = API_TYPES.Routes['body']['graphics']['add'];
export const addGraphic = async (req: ExtendedRequest<AddGraphicBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  const teamId = req.user?.teamId.toString();
  const storeId = req.storeId?.toString();

  const productsMessages: LanguageMessages = {
    'any.required': 'Please provide products for your graphic',
    'number.min': 'Graphic should at least have 1 product',
  };
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid graphic name for your graphic',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid graphic description for your graphic',
  };

  const session = req?.currentSession;

  const schema = Joi.object<AddGraphicBody>({
    name: Joi.string().min(3).max(100).required().messages(nameMessages),
    description: Joi.string().min(6).max(500).required().messages(descriptionMessages),
    productsIDs: Joi.array().items(Joi.string().regex(regex.mongoId)).min(1).required().messages(productsMessages),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: true });

  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  if (!teamId || !userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team|user associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No store associated with the request',
      publicMessage: 'Please provide a valid store',
    });
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await graphicBusiness.addGraphic({ body: value, userId, teamId, storeId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(data);
};

export const getAllGraphics = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const user = req.user;
  const userId = user?._id.toString();
  const teamId = user?.teamId?.toString();
  const storeId = req.storeId?.toString();
  const session = req.currentSession;
  if (!teamId || !userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team|user associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No store associated with the request',
      publicMessage: 'Please provide a valid store',
    });
    return handleError({ error, next, currentSession: session });
  }

  const storeIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid storeId',
  };

  const schema = Joi.object<{ storeId: string }>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });
  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { data } = await graphicBusiness.getAllGraphics({ teamId, storeId: value.storeId });
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

interface GetOneGraphicParams extends ParamsDictionary {
  graphicId: string;
}
export const getOneGraphic = async (req: ExtendedRequest<undefined, GetOneGraphicParams>, res: Response, next: NextFunction) => {
  const params = req.params;
  const { data, error } = await graphicBusiness.getOneGraphic({
    graphic: req.graphic,
    graphicId: params.graphicId,
    userId: req.user?._id.toString(),
  });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type DeleteOneGraphicParams = API_TYPES.Routes['params']['graphics']['deleteOne'];
export const deleteOne = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as DeleteOneGraphicParams;
  const { error } = await graphicBusiness.deleteOne({ params, graphic: req.graphic });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type UpdateOneGraphicBody = API_TYPES.Routes['body']['graphics']['updateOne'];
type UpdateOneGraphicParams = API_TYPES.Routes['params']['graphics']['updateOne'];
export const updateOne = async (req: ExtendedRequest<UpdateOneGraphicBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as UpdateOneGraphicParams;
  const session = req.currentSession;
  if (!req?.user) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No user associated with the request',
      publicMessage: 'Please make sure you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const storeId = req.graphic?.storeId?.toString();
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No store associated with the graphic',
      publicMessage: 'Please make sure store graphic exist',
    });
    return handleError({ error, next, currentSession: session });
  }
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product name for each item inside your graphic',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product description for each item inside your graphic',
  };

  const schema = Joi.object<UpdateOneGraphicBody>({
    name: Joi.string().min(3).max(100).messages(nameMessages),
    description: Joi.string().min(6).max(500).messages(descriptionMessages),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await graphicBusiness.updateOne({
    body: value,
    graphicId: params.graphicId,
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};
