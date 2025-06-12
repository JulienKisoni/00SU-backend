import ShortUniqueId from 'short-unique-id';
import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';

import { CartItem, GeneralResponse, IOrderDocument, IProductDocument, RetreiveOneFilters } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES, ORDER_STATUS } from '../types/enums';
import { ProductModel } from '../models/product';
import { OrderModel } from '../models/order';
import { transformProduct } from './products';

const retrieveOrder = async (filters: RetreiveOneFilters<IOrderDocument>): Promise<IOrderDocument | null> => {
  const order = (await OrderModel.findOne(filters).populate({ path: 'items.productId' }).lean().exec()) as IOrderDocument;
  if (!order || order === null) {
    return null;
  }
  const newItems = order.items.map((item) => {
    const product = item.productId as unknown as IProductDocument;
    const productId = product._id.toString();
    return {
      ...item,
      productId,
      productDetails: transformProduct({ product, excludedFields: ['__v'] }),
    };
  });
  order.items = newItems;
  return order;
};

type TransformKeys = keyof IOrderDocument;
interface ITransformOrder {
  excludedFields: TransformKeys[];
  order: IOrderDocument;
}
const transformOrder = ({ order, excludedFields }: ITransformOrder): Partial<IOrderDocument> => {
  return omit(order, excludedFields);
};

interface CalculatePriceArgs {
  items: CartItem[];
  products: IProductDocument[];
}
export const calculateTotalPrice = (params: CalculatePriceArgs): number => {
  const { items, products } = params;
  const cartItems: { unitPrice: number; quantity: number }[] = [];
  products.forEach((product) => {
    const item = items.find((item) => item.productId.toString() === product._id.toString());
    if (item) {
      cartItems.push({ unitPrice: product.unitPrice, quantity: item.quantity });
    }
  });
  const prices: number[] = cartItems.map((item) => {
    return item.quantity * item.unitPrice;
  });
  const totalPrice: number = prices.reduce((prev, current) => {
    return prev + current;
  });
  return totalPrice;
};

export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate();
  const id = new ShortUniqueId({ length: 5 }).rnd().toUpperCase();
  const orderNumber = `${day}-${month}-${year}-${id}`;
  return orderNumber;
};

type ValidCreateOrderPayload = Pick<IOrderDocument, 'items' | 'owner' | 'totalPrice' | 'orderNumber' | 'status'>;
type PrepareOrderResponse = Promise<GeneralResponse<{ payload: ValidCreateOrderPayload }>>;
interface PrepareOrderParams {
  items?: CartItem[];
  owner?: string;
}
const prepareOrderPayload = async ({ items, owner }: PrepareOrderParams): PrepareOrderResponse => {
  if (!items?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No items associated with the request',
      publicMessage: 'Please add valid items to your order',
    });
    return { error };
  }

  if (!owner) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No user associated with the request',
      publicMessage: 'Please make sure you are logged in',
    });
    return { error };
  }
  const productIds: string[] = items.map((item) => item.productId.toString());

  const products = await ProductModel.find({ _id: { $in: productIds } });

  if (productIds.length !== products?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: 'Could not find some products',
      publicMessage: 'There are some non existing products within your order',
    });
    return { error };
  }

  const totalPrice = calculateTotalPrice({ items, products });
  const orderNumber = generateOrderNumber();

  const payload: ValidCreateOrderPayload = {
    owner,
    totalPrice,
    items,
    orderNumber,
    status: ORDER_STATUS.PENDING,
  };
  return { data: { payload } };
};
type AddOrderBody = API_TYPES.Routes['body']['orders']['add'];
interface AddOrderParams {
  owner?: string;
  body: AddOrderBody;
}
type AddOrderResponse = Promise<GeneralResponse<{ orderId: string }>>;
export const addOrder = async (params: AddOrderParams): AddOrderResponse => {
  const { owner, body } = params;
  const { items } = body;

  const { error, data } = await prepareOrderPayload({ items, owner });
  if (error) {
    return { error };
  } else if (!data) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Could not generate payload',
      publicMessage: 'Something went wrong while generating the payload',
    });
    return { error };
  }
  const payload = data.payload;

  const order = await OrderModel.create(payload);

  return { data: { orderId: order._id.toString() } };
};

type GetAllOrdersResponse = Promise<GeneralResponse<{ orders: Partial<IOrderDocument>[] }>>;
export const getAllOrders = async (): GetAllOrdersResponse => {
  const results = await OrderModel.find({}).lean().exec();
  const orders = results.map((order) => transformOrder({ order, excludedFields: ['__v'] }));
  return { data: { orders } };
};

interface GetOneOrderPayload {
  order?: IOrderDocument;
  userId?: string;
  orderId?: string;
}
type GetOneOrderResponse = Promise<GeneralResponse<{ order: Partial<IOrderDocument> }>>;
export const getOneOrder = async (payload: GetOneOrderPayload): GetOneOrderResponse => {
  const { order, userId, orderId } = payload;
  const data = await retrieveOrder({ _id: orderId });
  if (order?._id.toString() !== orderId || order?.owner.toString() !== userId || !order || data === null) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No order found (${orderId})`,
      publicMessage: 'Could not found order',
    });
    return { error };
  }
  const newOrder = transformOrder({ order: data, excludedFields: ['__v'] });
  return { data: { order: newOrder } };
};

type GetUserOrdersPayload = API_TYPES.Routes['business']['orders']['getUserOrders'];
export const getUserOrders = async (payload: GetUserOrdersPayload): GetAllOrdersResponse => {
  const { userId } = payload;
  const results = await OrderModel.find({ owner: userId }).lean().exec();
  const orders = results.map((order) => transformOrder({ order, excludedFields: ['__v'] }));
  return { data: { orders } };
};

type DeleteOneOrderParams = API_TYPES.Routes['params']['orders']['deleteOne'];
type DeleteOneOrderResponse = Promise<GeneralResponse<undefined>>;
interface DeleteOneOrderPayload {
  params: DeleteOneOrderParams;
  order?: IOrderDocument;
}
export const deleteOne = async (payload: DeleteOneOrderPayload): DeleteOneOrderResponse => {
  const { params, order } = payload;
  const { orderId } = params;
  if (!order || order._id.toString() !== orderId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find corresponding order (${orderId})`,
      publicMessage: 'This order does not exist',
    });
    return { error };
  }
  await OrderModel.findByIdAndDelete(orderId);
  return { error: undefined, data: undefined };
};

type UpdateOneOrderBody = API_TYPES.Routes['body']['orders']['updateOne'];
type UpdateOneOrderResponse = Promise<GeneralResponse<{ order: Partial<IOrderDocument> }>>;
interface UpdateOneOrderPayload {
  body: UpdateOneOrderBody | undefined;
  orderId: string;
  userId?: string;
  order?: IOrderDocument;
}
export const updateOne = async (payload: UpdateOneOrderPayload): UpdateOneOrderResponse => {
  const { body, orderId, userId, order } = payload;

  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please add valid fields to your request body',
    });
    return { error };
  }
  const { items, status } = body;

  if (items && !items?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No items associated with the request',
      publicMessage: 'Please add valid items to your order',
    });
    return { error };
  }

  const _items = items || order?.items;

  const { data, error } = await prepareOrderPayload({ items: _items, owner: userId });
  if (error) {
    return { error };
  }
  const value = data?.payload;
  if (status && value) {
    value.status = status;
  }
  const newOrder = await OrderModel.findByIdAndUpdate(orderId, value).lean().exec();
  if (!newOrder?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find order (${orderId})`,
      publicMessage: 'This order does not exist',
    });
    return { error };
  }
  const transformed = transformOrder({ order: newOrder, excludedFields: ['__v'] });
  return { data: { order: transformed } };
};
