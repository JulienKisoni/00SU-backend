import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IProductDocument, IStoreDocument, ITestUser } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/products';
const testUser: ITestUser = {};
let product: IProductDocument | undefined;
let store: IStoreDocument | undefined;
let server: Server | undefined;

describe.only('PRODUCTS', () => {
  before(async () => {
    server = await startServer('8000', app);
    const res = await seedDatabase();
    product = res.product;
    store = res.store;
    const tokens = await login();
    if (tokens) {
      testUser.tokens = tokens;
      testUser.token = `Bearer ${tokens.accessToken}`;
    }
  });

  after(async () => {
    await clearDatabase();
    if (server) {
      server.close();
    }
  });

  describe('[GET] /products', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/all`;
      request(app).get(url).expect(401);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/all`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const products = res.body.products as IProductDocument[];
      products.forEach((store) => {
        validateProduct(store);
      });
    });
  });

  describe('[GET] /products/:{productId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      request(app).get(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const invalidUrl = `${baseURL}/stores/${storeId}/${invalidMongoId}`;
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const storeId = store?._id.toString();
      const invalidUrl = `${baseURL}/stores/${storeId}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const productResponse = res.body.product as IProductDocument;
      validateProduct(productResponse);
    });
  });

  describe('[PATCH] /products/:{productId}', () => {
    const validBody = {
      name: 'The new name',
    };
    const invalidBody = {
      name: '',
    };

    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /products/:{productId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      request(app).delete(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${invalidMongoId}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(400);
    });

    it('[400] Should fail: Not found', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(400);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${product?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateProduct = (product: IProductDocument) => {
  should(product).have.property('_id');
  should(product).have.property('name');
  should(product).have.property('description');
  should(product).have.property('teamId');
  should(product).have.property('storeId');
  should(product).have.property('quantity');
  should(product).have.property('minQuantity');
  should(product).have.property('unitPrice');
  should(product).have.property('owner');
  should(product).have.property('createdAt');
  should(product).have.property('updatedAt');
};
