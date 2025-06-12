import DummyStores from '../../mocks/stores.json';
import { StoreModel } from '../../src/models/store';
import { IStoreDocument } from '../../src/types/models';
import { IUserMethods } from '../../src/models/user';

type CreateStoreDoc = Omit<IStoreDocument, '_id' | 'createdAt' | 'updatedAt' | 'products'>;

export const injectStores = async (user: IUserMethods) => {
  const stores = await createUserStores(user);
  return stores;
};

export const createUserStores = async (user: IUserMethods) => {
  const promises = DummyStores.map((store) => {
    return createStore({ doc: store, user });
  });
  const stores = await Promise.all(promises);
  return stores;
};

interface ICreateStore {
  doc: CreateStoreDoc;
  user: IUserMethods;
}

export const createStore = async ({ doc, user }: ICreateStore) => {
  if (user.updateSelf) {
    doc.owner = user._id;
    const store = await StoreModel.create(doc);
    await user.updateSelf({ $push: { storeIds: store._id } });
    return store;
  } else {
    return undefined;
  }
};
