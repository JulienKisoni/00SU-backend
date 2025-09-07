import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IOrderDocument, IProductDocument, IStoreDocument, ITestUser } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/orders';
const testUser: ITestUser = {};
let order: IOrderDocument | undefined;
let product: IProductDocument | undefined;
let store: IStoreDocument | undefined;
let server: Server | undefined;

describe('ORDERS', () => {
  before(async () => {
    server = await startServer('8888', app);
    const res = await seedDatabase();
    order = res.order;
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

  describe('[GET] /orders', () => {
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
      const orders = res.body.orders as IOrderDocument[];
      orders.forEach((order) => {
        validateOrder(order);
      });
    });
  });

  describe('[GET] orders/:{orderId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      request(app).get(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const invalidUrl = `${baseURL}/stores/${storeId}/${invalidMongoId}`;
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const token = testUser.token || '';
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${nonExistingMongoId}`;
      request(app).get(url).set('Authorization', token).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const orderResponse = res.body.order as IOrderDocument;
      validateOrder(orderResponse);
    });
  });

  describe('[POST] /orders', async () => {
    const invalidBody = {
      items: [
        {
          productId: invalidMongoId,
        },
      ],
    };

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}`;
      request(app).post(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}`;
      const token = testUser.token || '';
      request(app).post(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[201] Should succeed: OK', async () => {
      const testUser2: ITestUser = {};
      const tokens = await login({ email: 'julien+admin@mail.com', password: 'julien+admin' });
      if (tokens) {
        testUser2.tokens = tokens;
        testUser2.token = `Bearer ${tokens.accessToken}`;
      }
      const validBody = {
        items: [
          {
            productId: product?._id,
            quantity: 3,
            productDetails: {
              name: product?.name,
              description: product?.description,
              unitPrice: product?.unitPrice,
              picture: product?.picture || '',
            },
          },
        ],
        storeId: store?._id.toString(),
      };
      const url = `${baseURL}`;
      const token = testUser2.token || '';
      const res = await request(app).post(url).set('Authorization', token).send(validBody).expect(201);
      should(res.body).have.property('orderId');
    });
  });

  describe('[PATCH] orders/:{orderId}', () => {
    const invalidBody = {
      items: [
        {
          productId: invalidMongoId,
        },
      ],
    };

    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const testUser2: ITestUser = {};
      const tokens = await login({ email: 'julien+admin@mail.com', password: 'julien+admin' });
      if (tokens) {
        testUser2.tokens = tokens;
        testUser2.token = `Bearer ${tokens.accessToken}`;
      }
      const validBody = {
        items: [
          {
            productId: product?._id,
            quantity: 3,
          },
        ],
      };
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] orders/:{orderId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${order?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateOrder = (order: IOrderDocument) => {
  should(order).have.property('_id');
  should(order).have.property('items');
  should(order).have.property('totalPrice');
  should(order).have.property('orderedBy');
  should(order).have.property('teamId');
  should(order).have.property('storeId');
  should(order).have.property('orderNumber');
  should(order).have.property('createdAt');
  should(order).have.property('updatedAt');
};
