import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, ICartItem, ICart, ParamsDictionary, ExtendedProduct } from '../types/models';
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
    cartItem = await CartItemModel.findById(cartItemId).exec();
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
  const cart = req.cart;
  const storeId = cart?.storeId?.toString();
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
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find store associated to this cart item (${cartItem?._id})`,
      publicMessage: 'Could not find any store associated with your request',
    });
    req.productId = undefined;
    return handleError({ error, next, currentSession: session });
  }

  const product = await ProductModel.findOne({ _id: productId, storeId }).lean().exec();

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
type GetProductMidBody = API_TYPES.Business['cart']['addCartItem']['body'];
export const getProducts = async (req: ExtendedRequest<GetProductMidBody, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const session = req.currentSession;
  const cartItem = req.cartItem;
  const cart = req.cart;
  const storeId = cart?.storeId?.toString();

  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find store associated to this cart item (${cartItem?._id})`,
      publicMessage: 'Could not find any store associated with your request',
    });
    req.productId = undefined;
    return handleError({ error, next, currentSession: session });
  }

  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide productId(s)',
    'string.pattern.base': 'Please provide valid product ID (s)',
  };
  const qtyMessages: LanguageMessages = {
    'any.required': 'Please provide a quantity',
  };
  const itemsMessages: LanguageMessages = {
    'any.required': 'Please provide at least one item',
  };
  const schema = Joi.object<{ body: GetProductMidBody }>({
    body: {
      items: Joi.array()
        .items(
          Joi.object({
            quantity: Joi.number().positive().required().messages(qtyMessages),
            productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
          }),
        )
        .min(1)
        .required()
        .messages(itemsMessages),
    },
  });
  const { error, value } = schema.validate(req, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const productIDs = value.body.items.map((item) => item.productId);
  const products = await ProductModel.find({ _id: { $in: productIDs }, storeId })
    .lean()
    .exec();
  if (!products?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find product(s) associated to this cart item (${cartItem?._id})`,
      publicMessage: 'Could not find any product(s) associated with your request',
    });
    req.productId = undefined;
    return handleError({ error, next, currentSession: session });
  }
  const productsToAdd: ExtendedProduct[] = products.map((prod) => {
    const item = value.body.items.find((item) => item.productId === prod._id.toString());
    const qtyToAdd = item?.quantity || 1;
    return {
      ...prod,
      qtyToAdd,
    };
  });
  req.productsToAdd = productsToAdd || undefined;
  return next();
};
