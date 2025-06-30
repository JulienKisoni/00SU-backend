import isEmpty from 'lodash.isempty';
import omit from 'lodash.omit';

import { GeneralResponse, ICart, IProductDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { CartItemModel } from 'src/models/cartItem';
import { CartModel } from 'src/models/Cart';

// const retrieveProduct = async (filters: RetrieveOneFilters<IProductDocument>): Promise<IProductDocument | null> => {
//   const product = (await ProductModel.findOne(filters).lean().exec()) as IProductDocument;
//   if (!product || product === null) {
//     return null;
//   }

//   return product;
// };

type TransformKeys = keyof IProductDocument;
interface ITransformProduct {
  excludedFields: TransformKeys[];
  product: IProductDocument;
}
export const transformProduct = ({ product, excludedFields }: ITransformProduct): Partial<IProductDocument> => {
  return omit(product, excludedFields);
};

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
