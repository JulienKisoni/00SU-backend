import DummyProducts from '../../mocks/products.json';
import { ProductModel } from '../../src/models/product';
import { IProductDocument } from '../../src/types/models';
import { IStoreMethods } from '../../src/models/store';

type CreateProductDoc = Omit<IProductDocument, '_id' | 'createdAt' | 'updatedAt' | 'reviews'>;

export const injectProducts = async (store: IStoreMethods) => {
  const products = await createStoreProducts(store);
  return products;
};

export const createStoreProducts = async (store: IStoreMethods) => {
  const promises = DummyProducts.map((product) => {
    const doc = {
      ...product,
      teamId: store.teamId,
    };
    return createStore({ doc, store });
  });
  const products = await Promise.all(promises);
  return products;
};

interface ICreateStore {
  doc: CreateProductDoc;
  store: IStoreMethods;
}

export const createStore = async ({ doc, store }: ICreateStore) => {
  if (store.updateSelf) {
    doc.owner = store.owner;
    doc.storeId = store._id;
    const product = await ProductModel.create(doc);
    await store.updateSelf({ $push: { products: product._id } });
    return product;
  } else {
    return undefined;
  }
};
