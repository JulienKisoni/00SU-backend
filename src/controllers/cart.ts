import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest, ParamsDictionary } from '../types/models';
import { regex } from '../helpers/constants';
import { createError, handleError } from '../middlewares/errors';
import * as cartBusiness from '../business/cart';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddCartItemBody = API_TYPES.Routes['business']['cart']['addCartItem']['body'];
type AddCartItemParams = Pick<API_TYPES.Routes['params']['cart']['addCartItem'], 'cartId'>;
interface AddCartItemSchema {
  params: AddCartItemParams;
  body?: AddCartItemBody;
}
export const addCartItems = async (req: ExtendedRequest<AddCartItemBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as AddCartItemParams;

  const cartIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartId',
    'string.pattern.base': 'Please provide a valid cartId',
  };
  const qtyMessages: LanguageMessages = {
    'any.required': 'Please provide a quantity',
  };
  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide a productId',
    'string.pattern.base': 'Please provide a valid productId',
  };
  const itemsMessages: LanguageMessages = {
    'any.required': 'Please provide at least one item',
  };

  const schema = Joi.object<AddCartItemSchema>({
    params: {
      cartId: Joi.string().regex(regex.mongoId).required().messages(cartIdMessages),
    },
    body: {
      items: Joi.array()
        .items(
          Joi.object({
            quantity: Joi.number().positive().required().messages(qtyMessages),
            productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
          }),
        )
        .required()
        .messages(itemsMessages),
    },
  });

  const payload: AddCartItemSchema = {
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
  const { error: _error, data } = await cartBusiness.addProducts({
    cartId: value.params.cartId,
    products: req.productsToAdd,
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(data);
};

interface DeleteCartItemParams extends ParamsDictionary {
  cartId: string;
  cartItemId: string;
}
export const deleteCartItem = async (req: ExtendedRequest<undefined, DeleteCartItemParams>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Missing user`,
      publicMessage: 'Bad request',
    });
    return handleError({ error, next, currentSession: session });
  }
  const cartIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartId',
    'string.pattern.base': 'Please provide a valid cartId',
  };
  const cartItemIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartItemId',
    'string.pattern.base': 'Please provide a valid cartItemId',
  };
  const schema = Joi.object<DeleteCartItemParams>({
    cartItemId: Joi.string().regex(regex.mongoId).required().messages(cartItemIdMessages),
    cartId: Joi.string().regex(regex.mongoId).required().messages(cartIdMessages),
  });

  const { value, error: _error } = schema.validate(req.params, { abortEarly: true, stripUnknown: true });

  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  const { error, data } = await cartBusiness.deleteCartItem(value);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ cart: data });
};

type UpdateCartItemBody = API_TYPES.Routes['body']['cart']['updateCartItem'];
type UpdateCartItemParams = { cartItemId: string; cartId: string };
interface UpdateProductSchema {
  params: UpdateCartItemParams;
  body: UpdateCartItemBody | undefined;
}
export const updateCartItem = async (req: ExtendedRequest<UpdateCartItemBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const cartIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartId',
    'string.pattern.base': 'Please provide a valid cartId',
  };
  const cartItemIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartId',
    'string.pattern.base': 'Please provide a valid cartId',
  };
  const qtyMessages: LanguageMessages = {
    'any.required': 'Please provide a quantity',
  };

  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const schema = Joi.object<UpdateProductSchema>({
    params: {
      cartId: Joi.string().regex(regex.mongoId).required().messages(cartIdMessages),
      cartItemId: Joi.string().regex(regex.mongoId).required().messages(cartItemIdMessages),
    },
    body: {
      quantity: Joi.number().positive().required().messages(qtyMessages),
    },
  });

  const payload: UpdateProductSchema = {
    params: req.params as unknown as UpdateCartItemParams,
    body: req.body,
  };

  const { error, value } = schema.validate(payload, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await cartBusiness.updateCartItem({ body: value.body, cartItemId: value.params.cartItemId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

export const createCart = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a storeId',
    'string.pattern.base': 'Please provide a valid storeId',
  };

  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const schema = Joi.object({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });

  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await cartBusiness.createCart({ storeId: value.storeId, userId: user._id.toString() });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

interface GetCartParams extends ParamsDictionary {
  storeId: string;
  userId: string;
  cartId: string;
}

export const getCart = async (req: ExtendedRequest<undefined, GetCartParams>, res: Response, next: NextFunction) => {
  const storeIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid storeId',
  };
  const userIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid userId',
  };
  const cartIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid cartId',
  };

  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const schema = Joi.object<GetCartParams>({
    storeId: Joi.string().regex(regex.mongoId).messages(storeIdMessages),
    userId: Joi.string().regex(regex.mongoId).messages(userIdMessages),
    cartId: Joi.string().regex(regex.mongoId).messages(cartIdMessages),
  });

  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await cartBusiness.getCart(value);
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};
interface DeleteCartParams extends ParamsDictionary {
  cartId: string;
}
export const deleteCart = async (req: ExtendedRequest<undefined, DeleteCartParams>, res: Response, next: NextFunction) => {
  const cartIdMessages: LanguageMessages = {
    'any.required': 'Please provide a cartId',
    'string.pattern.base': 'Please provide a valid cartId',
  };

  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const schema = Joi.object<DeleteCartParams>({
    cartId: Joi.string().regex(regex.mongoId).required().messages(cartIdMessages),
  });

  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error } = await cartBusiness.deleteCart(value);
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};
