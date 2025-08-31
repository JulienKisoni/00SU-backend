import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IStoreDocument, ITestUser, ICart, CartItemDetails } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/carts';
const testUser: ITestUser = {};
let cart: Partial<ICart> | undefined;
let store: IStoreDocument | undefined;
let server: Server | undefined;
let cartItemId = '';

describe('CART', () => {
  before(async () => {
    server = await startServer('8888', app);
    const res = await seedDatabase();
    cart = res.cart;
    store = res.store;
    const items = (cart?.items || []) as CartItemDetails[];
    if (items.length) {
      cartItemId = items[0]._id.toString();
    }
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

  describe('[GET] /carts/:{cartId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${cart?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${cart?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const reportResponse = res.body as ICart;
      validateGraphic(reportResponse);
    });
  });

  describe('[PATCH] /carts/:{cartId}', () => {
    const validBody = {
      name: 'The new name',
    };
    const invalidBody = {
      name: 6875,
    };

    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/${cart?._id}/stores/${storeId}/cartItems/${cartItemId}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/${cart?._id}/stores/${storeId}/cartItems/${cartItemId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/${nonExistingMongoId}/stores/${storeId}/cartItems/${cartItemId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/${cart?._id}/stores/${storeId}/cartItems/${cartItemId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /carts/:{cartId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${cart?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${cart?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateGraphic = (cart: ICart) => {
  should(cart).have.property('_id');
  should(cart).have.property('items');
  should(cart).have.property('userId');
  should(cart).have.property('storeId');
  should(cart).have.property('totalPrices');
};
