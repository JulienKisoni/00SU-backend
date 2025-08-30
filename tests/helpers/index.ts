import { connection } from 'mongoose';

import { createUser, injectUsers } from './users';
import { injectStores } from './stores';
import { injectProducts } from './products';
import { IProductMethods } from '../../src/models/product';
import { injectOrders } from './orders';
import {
  ExtendedProduct,
  ICart,
  IGraphicDocument,
  IOrderDocument,
  IProductDocument,
  IReportDocument,
  IStoreDocument,
  ITeamDocument,
  IUserDocument,
  USER_ROLES,
} from '../../src/types/models';
import { createTeam } from './teams';
import { injectCart } from './cart';
import { injectReport } from './reports';
import { injectGraphic } from './graphics';

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
  team: ITeamDocument | undefined;
  order: IOrderDocument | undefined;
  report: Partial<IReportDocument> | undefined;
  graphic: Partial<IGraphicDocument> | undefined;
  cart: ICart | undefined;
}
export const seedDatabase = async (): Promise<ISeedReturn> => {
  let user: IUserDocument | undefined = undefined;
  let store: IStoreDocument | undefined;
  let product: IProductDocument | undefined;
  let team: ITeamDocument | undefined;
  let order: IOrderDocument | undefined;
  let report: Partial<IReportDocument> | undefined;
  let graphic: Partial<IGraphicDocument> | undefined;
  let cart: ICart | undefined;
  try {
    await clearDatabase();
    const teamOwner = {
      password: 'julien',
      email: 'teamowner@mail.com',
      teamId: undefined,
      profile: {
        role: USER_ROLES.admin,
        username: 'teamowner',
      },
    };
    const user1 = await createUser(teamOwner);
    team = await createTeam({ name: teamOwner.profile.username, userId: user1?.id });
    const users = await injectUsers([team]);
    user = users[0];
    if (user) {
      const stores = await injectStores(user);
      store = stores[0];
      let products: (IProductMethods | undefined)[] = [];
      if (store) {
        products = await injectProducts(store);
      }
      product = products[0];
      const _products = products.filter((product) => product !== undefined);
      if (_products.length && store && team && product) {
        const __products: ExtendedProduct[] = _products.map((prod) => ({ ...prod, qtyToAdd: 3 }));
        const _cart = await injectCart({ storeId: store?._id.toString(), userId: user._id.toString(), products: __products });
        cart = _cart || undefined;
        const orders = await injectOrders(_products, user);
        order = orders[0];
        const _orderIDs = orders.map((order) => order._id.toString());
        const _report = await injectReport({
          userId: user._id.toString(),
          teamId: team._id.toString(),
          body: {
            name: 'My report',
            description: 'My description',
            storeId: store._id.toString(),
            orders: _orderIDs,
          },
        });
        report = _report || undefined;
        const _graphic = await injectGraphic({
          userId: user._id.toString(),
          storeId: store._id.toString(),
          teamId: team._id.toString(),
          product,
          body: {
            name: 'My graphic',
            description: 'My description',
            productsIDs: [product._id.toString()],
          },
        });
        graphic = _graphic || undefined;
      }
    }
    return { user, store, product, team, order, report, cart, graphic };
  } catch (error) {
    console.log('Error seed ', error);
    return { user, store, product, team, order, report, cart, graphic };
  }
};

export const CONSTANTS = {
  nonExistingMongoId: '6722d6dfbc5a2a8e20daaaaa',
  invalidMongoId: '6722d6dfbc5a',
  realLookingFakeId: '6722d6dfbc5a2a8e20daabce',
};

export const failTest = () => {
  throw new Error('Test failed');
};
