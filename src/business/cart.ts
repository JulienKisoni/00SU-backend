import isEmpty from 'lodash.isempty';

import { GeneralResponse, ICart, IProductDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { CartItemModel } from '../models/cartItem';
import { CartModel } from '../models/Cart';

type AddCartItemBody = API_TYPES.Routes['business']['cart']['addCartItem']['body'];
interface AddCartItem {
  body?: AddCartItemBody;
  product?: IProductDocument;
  cartId: string;
}
type AddProductReturn = Promise<GeneralResponse<{ cart: ICart | null }>>;
export const addProduct = async ({ body, product, cartId }: AddCartItem): AddProductReturn => {
  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please provide valid fields ',
    });
    return { error };
  }
  if (!product || isEmpty(product)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No product associated with the request',
      publicMessage: 'Please provide product to add ',
    });
    return { error };
  }

  const totalPrice = product.unitPrice * body.quantity;

  const cartItem = await CartItemModel.create({
    ...body,
    totalPrice,
    cartId,
  });

  const cartItemId = cartItem._id.toString();

  const cart = await CartModel.findByIdAndUpdate(
    cartId,
    {
      $push: { items: cartItemId },
    },
    { new: true },
  );
  return { data: { cart } };
};

type DeleteOneCartItemPayload = API_TYPES.Routes['params']['cart']['deleteOne'];
type DeleteOneCartItemResponse = Promise<GeneralResponse<ICart | null>>;
export const deleteCartItem = async ({ cartItemId, cartId }: DeleteOneCartItemPayload): DeleteOneCartItemResponse => {
  const cartItem = await CartItemModel.findByIdAndDelete(cartItemId).exec();
  if (!cartItem?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `cart item (${cartItemId}) not found`,
      publicMessage: 'This cartItem does not exist',
    });
    return { error, data: undefined };
  }
  const cart = await CartModel.findByIdAndUpdate(cartId, { $pull: { items: cartItemId } }, { new: true }).exec();
  return { error: undefined, data: cart };
};

type UpdateCartItemBody = API_TYPES.Routes['body']['cart']['updateCartItem'];
interface UpdateProductPayload {
  cartItemId: string;
  body?: UpdateCartItemBody;
}
type UpdateProductResponse = Promise<GeneralResponse<undefined>>;
export const updateCartItem = async ({ body, cartItemId }: UpdateProductPayload): UpdateProductResponse => {
  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please provide valid fields ',
    });
    return { error };
  }
  const cartItem = await CartItemModel.findByIdAndUpdate(cartItemId, body).exec();
  if (!cartItem?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Cart item not found (${cartItemId})`,
      publicMessage: 'This cart Item does not exist',
    });
    return { error };
  }
  return { data: undefined };
};
interface CreateCartPayload {
  storeId: string;
  userId: string;
}
type CreateCartResponse = Promise<GeneralResponse<ICart>>;
export const createCart = async ({ storeId, userId }: CreateCartPayload): CreateCartResponse => {
  const _cart = await CartModel.findOne({ storeId, userId }).exec();
  if (_cart?.id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Cannot duplicate cart for this store (${storeId}) and user (${userId})`,
      publicMessage: 'Cart already exist',
    });
    return { error };
  }

  const cart = await CartModel.create({ userId, storeId, totalPrices: 0 });
  return { data: cart };
};
interface GetCartPayload {
  storeId?: string;
  userId?: string;
  cartId?: string;
}
type GetCartResponse = Promise<GeneralResponse<ICart | null>>;
export const getCart = async ({ storeId, userId, cartId }: GetCartPayload): GetCartResponse => {
  let cart: ICart | null = null;
  if (cartId) {
    cart = await CartModel.findById(cartId).exec();
    return { data: cart || undefined };
  } else if (storeId && userId) {
    cart = await CartModel.findOne({ storeId, userId }).exec();
    return { data: cart || undefined };
  } else {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Missing either store (${storeId}), user (${userId}) or cartId (${cartId})`,
      publicMessage: 'Cannot fetch cart with invalid parameters',
    });
    return { error };
  }
};
interface DeleteCartPayload {
  cartId: string;
}
type DeleteCartResponse = Promise<GeneralResponse<undefined>>;
export const deleteCart = async ({ cartId }: DeleteCartPayload): DeleteCartResponse => {
  const cart = await CartModel.findById(cartId).exec();
  if (!cart) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Cart does not exist cartId (${cartId})`,
      publicMessage: 'Non existing cart',
    });
    return { error };
  }
  const res = await CartModel.deleteOne({ _id: cartId }).exec();
  if (res.deletedCount) {
    await CartItemModel.deleteMany({ _id: { $in: cart.items } });
  }
  return { error: undefined, data: undefined };
};
