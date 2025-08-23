import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest, ParamsDictionary } from '../types/models';
import { regex } from '../helpers/constants';
import { createError, handleError } from '../middlewares/errors';
import * as productBusiness from '../business/products';
import * as historyBusiness from '../business/history';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddProductBody = API_TYPES.Routes['business']['products']['add']['body'];
type AddProductParams = Pick<API_TYPES.Routes['business']['products']['add'], 'storeId'>;
interface AddProductSchema {
  params: AddProductParams;
  body: AddProductBody | undefined;
}
export const addProduct = async (req: ExtendedRequest<AddProductBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as AddProductParams;

  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a storeId',
    'string.pattern.base': 'Please provide a valid storeId',
  };
  const nameMessages: LanguageMessages = {
    'any.required': 'Please provide a product name',
    'string.min': 'The field name must have 3 characters minimum',
    'string.max': 'The field name must have 200 characters maximum',
  };
  const descriptionMessages: LanguageMessages = {
    'any.required': 'Please provide a product description',
    'string.min': 'The field description must have 6 characters minimum',
    'string.max': 'The field description must have 500 characters maximum',
  };
  const qtyMessages: LanguageMessages = {
    'any.required': 'The field quantity is required',
  };
  const minQtyMessages: LanguageMessages = {
    'any.required': 'The field minQuantity is required',
  };
  const unitPriceMessages: LanguageMessages = {
    'any.required': 'The field unitPrice is required',
  };

  const schema = Joi.object<AddProductSchema>({
    params: {
      storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
    },
    body: {
      name: Joi.string().required().messages(nameMessages),
      description: Joi.string().min(12).max(100).required().messages(descriptionMessages),
      quantity: Joi.number().positive().required().messages(qtyMessages),
      minQuantity: Joi.number().positive().required().messages(minQtyMessages),
      picture: Joi.string().allow('', null).min(50).max(2000),
      unitPrice: Joi.number().positive().required().messages(unitPriceMessages),
    },
  });

  const payload: AddProductSchema = {
    params,
    body: req.body,
  };

  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const { error, value } = schema.validate(payload, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const userId = user._id?.toString() || '';
  const storeId = value.params.storeId;
  const teamId = user.teamId.toString();
  const { error: _error, data: createdProduct } = await productBusiness.addProduct({
    owner: userId,
    storeId,
    body: value.body,
    teamId,
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  const { error: __error } = await historyBusiness.writeHistory({
    userId,
    storeId,
    teamId,
    quantity: createdProduct?.quantity || NaN,
    product: createdProduct,
  });
  if (__error) {
    return handleError({ error: __error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(createdProduct);
};

export const getAllProducts = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const storeId = req.storeId?.toString();
  const teamId = req.user?.teamId.toString();
  const session = req.currentSession;
  if (!storeId || !teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No store|team id (${storeId})`,
      publicMessage: 'The store does not exist or you are not logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const { products } = await productBusiness.getAllProducts({ storeId, teamId });
  res.status(HTTP_STATUS_CODES.OK).json({ products });
};

type GetStoreProductsPayload = API_TYPES.Routes['business']['products']['getByStoreId'];
export const getStoreProducts = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { storeId, user } = req;
  const session = req.currentSession;
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No store id (${storeId})`,
      publicMessage: 'The store does not exist',
    });
    return handleError({ error, next, currentSession: session });
  }
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }

  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a storeId',
    'string.pattern.base': 'Please provide a valid storeId',
  };
  const schema = Joi.object<GetStoreProductsPayload>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });

  const { error, value } = schema.validate({ storeId }, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { products } = await productBusiness.getStoreProducts({ storeId: value.storeId, teamId: user.teamId.toString() });

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ products });
};

export const deleteOne = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { storeId, productId } = req;
  const session = req.currentSession;
  if (!storeId || !productId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Missing either store id or product id`,
      publicMessage: 'Bad request',
    });
    return handleError({ error, next, currentSession: session });
  }

  const { error } = await productBusiness.deleteOne({ storeId, productId });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type GetOneProductParams = API_TYPES.Routes['params']['products']['getOne'];
interface GetOneProductPayload {
  params: GetOneProductParams;
}
export const getOne = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneProductParams;

  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide a productId',
    'string.pattern.base': 'Please provide a valid productId',
  };
  const session = req.currentSession;
  const schema = Joi.object<GetOneProductPayload>({
    params: {
      productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
    },
  });

  const { error, value } = schema.validate({ params }, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { data, error: _error } = await productBusiness.getOne({ productId: value.params.productId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type UpdateProductBody = Partial<API_TYPES.Routes['body']['products']['updateOne']>;
type UpdateProductParams = { productId: string };
interface UpdateProductSchema {
  params: UpdateProductParams;
  body: UpdateProductBody | undefined;
}
export const updateOne = async (req: ExtendedRequest<UpdateProductBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide a productId',
    'string.pattern.base': 'Please provide a valid productId',
  };
  const descriptionMessages: LanguageMessages = {
    'string.min': 'The field description must have 6 characters minimum',
    'string.max': 'The field description must have 500 characters maximum',
  };
  const nameMessages: LanguageMessages = {
    'string.min': 'The field name must have 3 characters minimum',
    'string.max': 'The field name must have 200 characters maximum',
  };

  const session = req.currentSession;
  const { user, product } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  if (!product) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No product associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const userId = user._id.toString();
  const teamId = user.teamId.toString();
  const storeId = product.storeId.toString();
  const schema = Joi.object<UpdateProductSchema>({
    params: {
      productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
    },
    body: {
      name: Joi.string().min(3).max(100).messages(nameMessages),
      description: Joi.string().min(6).max(500).messages(descriptionMessages),
      quantity: Joi.number(),
      minQuantity: Joi.number(),
      unitPrice: Joi.number(),
      picture: Joi.string(),
    },
  });

  const payload: UpdateProductSchema = {
    params: req.params as unknown as UpdateProductParams,
    body: req.body,
  };

  const { error, value } = schema.validate(payload, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data: updatedProduct } = await productBusiness.updateOne({
    productId: value.params.productId,
    body: value.body,
    teamId: user.teamId.toString(),
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (req.body?.quantity && updatedProduct) {
    const { error: __error, data } = await historyBusiness.writeHistory({
      userId,
      storeId,
      teamId,
      quantity: updatedProduct?.quantity || NaN,
      product: updatedProduct,
    });
    if (__error) {
      return handleError({ error: __error, next, currentSession: session });
    }
    res.status(HTTP_STATUS_CODES.OK).json(data);
    if (session) {
      await session.endSession();
    }
  } else {
    if (session) {
      await session.endSession();
    }
    res.status(HTTP_STATUS_CODES.OK).json({});
  }
};
