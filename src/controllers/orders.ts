import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest, ParamsDictionary } from '../types/models';
import { regex } from '../helpers/constants';
import { createError, handleError } from '../middlewares/errors';
import * as orderBusiness from '../business/orders';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddOrderBody = API_TYPES.Routes['body']['orders']['add'];
export const addOrder = async (req: ExtendedRequest<AddOrderBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  const teamId = req.user?.teamId.toString();

  const productIdMessages: LanguageMessages = {
    'any.required': 'Please a productId is required for each item inside your order',
    'string.pattern.base': 'Please provide a valid productId for each item inside your order',
  };
  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please a storeId is required for your order',
    'string.pattern.base': 'Please provide a valid storeId for your order',
  };
  const quantityMessages: LanguageMessages = {
    'any.required': 'Please provide quantity for each item inside your order',
    'number.min': 'Each item inside your order should at leat have quantity equals to 1',
  };
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product name for each item inside your order',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product description for each item inside your order',
  };
  const priceMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product price for each item inside your order',
  };
  const pictureMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product picture for each item inside your order',
  };

  const session = req?.currentSession;

  const schema = Joi.object<AddOrderBody>({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
          quantity: Joi.number().min(1).required().messages(quantityMessages),
          productDetails: Joi.object({
            name: Joi.string().messages(nameMessages),
            description: Joi.string().messages(descriptionMessages),
            unitPrice: Joi.number().messages(priceMessages),
            picture: Joi.string().allow('').messages(pictureMessages),
          }).required(),
        }),
      )
      .min(1)
      .required(),
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: true });

  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  if (!teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await orderBusiness.addOrder({ body: value, userId, teamId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(data);
};

export const getAllOrders = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const user = req.user;
  const teamId = user?.teamId?.toString();
  const session = req.currentSession;
  if (!teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const { data } = await orderBusiness.getAllOrders({ teamId });
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type GetOneOrderParams = API_TYPES.Routes['params']['orders']['getOne'];
export const getOneOrder = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneOrderParams;
  const { data, error } = await orderBusiness.getOneOrder({ order: req.order, orderId: params.orderId, userId: req.user?._id.toString() });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

export const getUserOrders = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  const session = req.currentSession;
  if (!userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No user associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const { data } = await orderBusiness.getUserOrders({ userId });
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type DeleteOneOrderParams = API_TYPES.Routes['params']['orders']['deleteOne'];
export const deleteOne = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as DeleteOneOrderParams;
  const { error } = await orderBusiness.deleteOne({ params, order: req.order });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type UpdateOneOrderBody = API_TYPES.Routes['body']['orders']['updateOne'];
type UpdateOneOrderParams = API_TYPES.Routes['params']['orders']['getOne'];
export const updateOne = async (req: ExtendedRequest<UpdateOneOrderBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as UpdateOneOrderParams;
  const session = req.currentSession;
  if (!req?.user) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No user associated with the request',
      publicMessage: 'Please make sure you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const storeId = req.order?.storeId?.toString();
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No store associated with the order',
      publicMessage: 'Please make sure store order exist',
    });
    return handleError({ error, next, currentSession: session });
  }
  const teamId = req.user.teamId.toString();
  const productIdMessages: LanguageMessages = {
    'any.required': 'Please a productId is required for each item inside your order',
    'string.pattern.base': 'Please provide a valid productId for each item inside your order',
  };
  const quantityMessages: LanguageMessages = {
    'any.required': 'Please provide quantity for each item inside your order',
    'number.min': 'Each item inside your order should at leat have quantity equals to 1',
  };
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product name for each item inside your order',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product description for each item inside your order',
  };
  const priceMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product price for each item inside your order',
  };
  const pictureMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product picture for each item inside your order',
  };

  const schema = Joi.object<UpdateOneOrderBody>({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
          quantity: Joi.number().min(1).required().messages(quantityMessages),
          productDetails: Joi.object({
            name: Joi.string().messages(nameMessages),
            description: Joi.string().messages(descriptionMessages),
            unitPrice: Joi.number().messages(priceMessages),
            picture: Joi.string().allow('').messages(pictureMessages),
          }).required(),
        }),
      )
      .min(1)
      .required(),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await orderBusiness.updateOne({
    body: value,
    orderId: params.orderId,
    userId: req.user?._id.toString(),
    order: req.order,
    teamId,
    storeId,
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};
