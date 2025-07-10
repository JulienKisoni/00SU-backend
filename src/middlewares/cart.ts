import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, ICartItem, ICart, ParamsDictionary } from '../types/models';
import { createError, handleError } from './errors';
import { regex } from '../helpers/constants';
import { CartModel } from '../models/Cart';
import { CartItemModel } from '../models/cartItem';
import { ProductModel } from '../models/product';

interface IGetProdMiddleware {
  cartId?: string;
  cartItemId?: string;
}
export const getCart = async (req: ExtendedRequest<undefined, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const params = req.params as unknown as IGetProdMiddleware;

  const cartIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid cart id',
  };
  const cartItemIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid cartItem id',
  };

  const schema = Joi.object<IGetProdMiddleware>({
    cartId: Joi.string().regex(regex.mongoId).messages(cartIdMessages),
    cartItemId: Joi.string().regex(regex.mongoId).messages(cartItemIdMessages),
  });

  const session = req.currentSession;

  const { error, value } = schema.validate(params);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { cartId, cartItemId } = value;

  let cart: ICart | null = null;
  let cartItem: ICartItem | null = null;

  if (cartId) {
    cart = await CartModel.findById(cartId).exec();
  }
  if (cartItemId) {
    cartItem = await CartItemModel.findById(cartId).exec();
  }

  if (cartId && !cart?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find cart (${cartId})`,
      publicMessage: 'Could not find any cart associated with your request',
    });
    return handleError({ error, next, currentSession: session });
  }
  if (cartItemId && !cartItem?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find cartItem (${cartId})`,
      publicMessage: 'Could not find any cart item associated with your request',
    });
    return handleError({ error, next, currentSession: session });
  }

  req.cart = cart || undefined;
  req.cartItem = cartItem || undefined;
  return next();
};

export const getProduct = async (req: ExtendedRequest<undefined, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const session = req.currentSession;
  const cartItem = req.cartItem;
  const productId = cartItem?.productId;
  if (!productId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find product associated to this cart item (${cartItem?._id})`,
      publicMessage: 'Could not find any product associated with your request',
    });
    req.productId = undefined;
    return handleError({ error, next, currentSession: session });
  }

  const product = await ProductModel.findById(productId).exec();

  if (!productId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find product associated to this cart item (${productId})`,
      publicMessage: 'Could not find any product associated with your request',
    });
    req.productId = undefined;
    return handleError({ error, next, currentSession: session });
  }
  req.product = product || undefined;
  return next();
};
