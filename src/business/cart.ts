import isEmpty from 'lodash.isempty';
import { Types, PipelineStage } from 'mongoose';

import { CartItemDetails, ExtendedProduct, GeneralResponse, ICart, ICartItem, IProductDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { CartItemModel } from '../models/cartItem';
import { CartModel } from '../models/Cart';

const addProductToCart = async (product: IProductDocument, quantity: number, cartId: string): Promise<string | undefined> => {
  const totalPrice = product.unitPrice * quantity;
  const body = {
    quantity,
    productId: product._id.toString(),
  };
  let cartItem: ICartItem | null;
  const _cartItem = await CartItemModel.findOne({ cartId, productId: product._id.toString() }).exec();
  if (_cartItem?.id) {
    cartItem = await CartItemModel.findByIdAndUpdate(_cartItem.id, { quantity: _cartItem.quantity + 1 }, { new: true }).exec();
    return;
  }
  cartItem = await CartItemModel.create({
    ...body,
    totalPrice,
    cartId,
  });
  const cartItemId = cartItem?._id?.toString();
  return cartItemId;
};

interface AddCartItems {
  products?: ExtendedProduct[];
  cartId: string;
}
type AddProductReturn = Promise<GeneralResponse<ICart | null>>;
export const addProducts = async ({ products, cartId }: AddCartItems): AddProductReturn => {
  if (!products?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No product(s) associated with the request',
      publicMessage: 'Please provide product(s) to add ',
    });
    return { error };
  }

  const promises = [];

  for (const product of products) {
    promises.push(addProductToCart(product, product.qtyToAdd, cartId));
  }

  const results = await Promise.all(promises);
  const cartItemIds = results.filter((id) => !!id);

  await CartModel.findByIdAndUpdate(
    cartId,
    {
      $push: { items: cartItemIds },
    },
    { new: true },
  );
  const { data } = await getCart({ cartId });
  if (data) {
    calculateTotalPrices(data);
    return { data };
  }
  return { data: null };
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
  await CartModel.findByIdAndUpdate(cartId, { $pull: { items: cartItemId } }).exec();
  const { data: cart } = await getCart({ cartId });
  if (cart) {
    calculateTotalPrices(cart);
    return { data: cart };
  }
  return { error: undefined, data: cart };
};

type UpdateCartItemBody = API_TYPES.Routes['body']['cart']['updateCartItem'];
interface UpdateProductPayload {
  cartItemId: string;
  body?: UpdateCartItemBody;
}
type UpdateProductResponse = Promise<GeneralResponse<ICart>>;
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
  const { data } = await getCart({ cartId: cartItem.cartId.toString() });
  if (data) {
    calculateTotalPrices(data);
    return { data };
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
  const $match: { [key: string]: Types.ObjectId } = {};
  const hint: { [key: string]: number } = {};
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: 'CartItems',
        localField: 'items',
        foreignField: '_id',
        as: 'items',
      },
    },
    {
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'Products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'items.productDetails',
      },
    },
    {
      $unwind: {
        path: '$items.productDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        storeId: {
          $first: '$storeId',
        },
        userId: {
          $first: '$userId',
        },
        totalPrices: {
          $first: '$totalPrices',
        },
        createdAt: {
          $first: '$createdAt',
        },
        updatedAt: {
          $first: '$updatedAt',
        },
        items: {
          $push: '$items',
        },
      },
    },
  ];
  if (cartId) {
    $match._id = new Types.ObjectId(cartId);
    pipeline.unshift({ $match });
    const results = await CartModel.aggregate<ICart>(pipeline).hint({ _id: 1 });
    if (Array.isArray(results) && results.length) {
      cart = results[0];
      calculateTotalPrices(cart);
    }
    return { data: cart || undefined };
  } else if (storeId && userId) {
    $match.storeId = new Types.ObjectId(storeId);
    $match.userId = new Types.ObjectId(userId);
    hint.storeId = 1;
    hint.userId = 1;
    pipeline.unshift({ $match });
    const results = await CartModel.aggregate<ICart>(pipeline).hint(hint);
    if (Array.isArray(results) && results.length) {
      cart = results[0];
      calculateTotalPrices(cart);
    }
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

const calculateTotalPrices = (cart: ICart) => {
  let tempTotalPrice: number = 0;
  cart.items?.forEach((_) => {
    const item = _ as CartItemDetails;
    const totalPrice = item.quantity * item.productDetails.unitPrice;
    tempTotalPrice += totalPrice;
    item.totalPrice = totalPrice;
  });
  cart.totalPrices = tempTotalPrice;
};
