import { connection } from 'mongoose';

import { injectUsers } from './users';
import { injectStores } from './stores';
import { injectProducts } from './products';
import { IProductMethods } from '../../src/models/product';
import { injectReviews } from './reviews';
import { injectOrders } from './orders';
import { IOrderDocument, IProductDocument, IReviewDocument, IStoreDocument, IUserDocument } from '../../src/types/models';

interface DeleteResult {
  acknowledged: boolean;
  deletedCount: number;
}

export const clearDatabase = async () => {
  const { collections } = connection;

  const promises: Promise<DeleteResult>[] = [];

  for (const key in collections) {
    if (Object.prototype.hasOwnProperty.call(collections, key)) {
      const collection = collections[key];
      promises.push(collection.deleteMany({}));
    }
  }

  await Promise.all(promises);
};

interface ISeedReturn {
  user: IUserDocument | undefined;
  store: IStoreDocument | undefined;
  product: IProductDocument | undefined;
  review: IReviewDocument | undefined;
  order: IOrderDocument | undefined;
}
export const seedDatabase = async (): Promise<ISeedReturn> => {
  let user: IUserDocument | undefined = undefined;
  let store: IStoreDocument | undefined;
  let product: IProductDocument | undefined;
  let review: IReviewDocument | undefined;
  let order: IOrderDocument | undefined;
  await clearDatabase();
  const users = await injectUsers([]);
  user = users[0];
  if (user) {
    const stores = await injectStores(user);
    store = stores[0];
    let products: (IProductMethods | undefined)[] = [];
    if (store) {
      products = await injectProducts(store);
    }
    product = products[0];
    if (product) {
      const reviews = await injectReviews(product, user);
      review = reviews[0];
    }
    const _products = products.filter((product) => product !== undefined);
    if (_products.length) {
      const orders = await injectOrders(_products, user);
      order = orders[0];
    }
  }
  return { user, store, product, review, order };
};

export const CONSTANTS = {
  nonExistingMongoId: '6722d6dfbc5a2a8e20daaaaa',
  invalidMongoId: '6722d6dfbc5a',
};

export const failTest = () => {
  throw new Error('Test failed');
};
