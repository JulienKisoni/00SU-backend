import { IProductMethods } from '../../src/models/product';
import { CartItem, IOrderDocument, IUserDocument } from '../../src/types/models';
import { OrderModel } from '../../src/models/order';
import { generateOrderNumber, calculateTotalPrice } from '../../src/business/orders';

type CreateOrderDoc = Omit<IOrderDocument, '_id' | 'createdAt' | 'updatedAt'>;

export const injectOrders = async (products: IProductMethods[], user: IUserDocument) => {
  const orders = await createOrders(products, user);
  return orders;
};

export const createOrders = async (products: IProductMethods[], user: IUserDocument) => {
  const promises = [1, 2].map((_, index) => {
    return createOrder({ products, user, index });
  });
  const orders = await Promise.all(promises);
  return orders;
};

interface ICreateOrder {
  products: IProductMethods[];
  user: IUserDocument;
  index: number;
}

export const createOrder = async ({ products, user, index }: ICreateOrder) => {
  const items: CartItem[] = products.map((product) => {
    return {
      productId: product._id.toString(),
      quantity: (index + 1) * 2,
    };
  });
  const orderNumber = generateOrderNumber();
  const totalPrice = calculateTotalPrice({ items, products });
  const doc: CreateOrderDoc = {
    items,
    orderedBy: user._id,
    totalPrice,
    orderNumber,
    teamId: user.teamId,
    storeId: products[0].storeId,
  };
  const order = await OrderModel.create(doc);
  return order;
};
