import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IOrderDocument, ITestUser, IUserDocument } from '../../src/types/models';
import { login } from '../helpers/users';
import { validateOrder } from './orders.spec';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/users';
const testUser: ITestUser = {};
let user: IUserDocument | undefined;
let server: Server | undefined;

describe.only('USERS', () => {
  before(async () => {
    server = await startServer('8000', app);
    const res = await seedDatabase();
    user = res.user;
    const tokens = await login();
    if (tokens) {
      testUser.tokens = tokens;
      testUser.token = `Bearer ${tokens.accessToken}`;
    }
  });

  after(async () => {
    await clearDatabase();
    await clearDatabase();
    if (server) {
      server.close();
    }
  });

  describe('[GET] /users', () => {
    const url = baseURL;

    it('[401] Should fail: Unauthorized', async () => {
      request(app).get(url).expect(401);
    });

    it('[200] Should succeed: OK', async () => {
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const users = res.body.users as IUserDocument[];
      users.forEach((user) => {
        validateUser(user);
      });
    });
  });

  describe('[GET] /users/:{userId}', () => {
    const invalidUrl = `${baseURL}/${invalidMongoId}`;

    it('[401] Should fail: Unauthorized', async () => {
      request(app).get(invalidUrl).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const token = testUser.token || '';
      request(app).get(`${baseURL}/${invalidMongoId}`).set('Authorization', token).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const token = testUser.token || '';
      request(app).get(`${baseURL}/${nonExistingMongoId}`).set('Authorization', token).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${user?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const userResponse = res.body.user as IUserDocument;
      validateUser(userResponse);
    });
  });

  describe('[GET] /users/me/orders', () => {
    const url = `${baseURL}/me/orders`;
    it('[401] Should fail: Unauthorized', async () => {
      request(app).get(url).expect(401);
    });

    it('[200] Should succeed: OK', async () => {
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const orders = res.body.orders as IOrderDocument[];
      orders.forEach((order) => {
        validateOrder(order);
      });
    });
  });

  describe('[POST] /users/signup', () => {
    const url = `${baseURL}/signup`;
    const validBody = {
      username: 'edouard',
      email: 'edouard@mail.com',
      password: 'edouard',
      role: 'user',
    };
    const invalidBody = { ...validBody };
    invalidBody.role = '';

    it('[401] Should fail: Unauthorized', async () => {
      request(app).post(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const token = testUser.token || '';
      request(app).post(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[201] Should succeed: OK', async () => {
      const token = testUser.token || '';
      const res = await request(app).post(url).set('Authorization', token).send(validBody).expect(201);
      should(res.body).have.property('userId');
    });
  });

  describe('[PATCH] /users/:{userId}', () => {
    const validBody = {
      profile: {
        role: 'admin',
      },
    };
    const invalidBody = { profile: { role: 'manager' } };

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${user?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}/${user?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const url = `${baseURL}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${user?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /users/:{userId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${user?._id}`;
      request(app).delete(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}/${invalidMongoId}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(400);
    });

    it('[400] Should fail: Not found', async () => {
      const url = `${baseURL}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(400);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${user?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateUser = (user: IUserDocument) => {
  should(user).have.property('_id');
  should(user).have.property('email');
  should(user).have.property('storeIds');
  should(user).have.propertyByPath('profile', 'role');
  should(user).have.propertyByPath('profile', 'username');
  should(user).have.property('createdAt');
  should(user).have.property('updatedAt');
};
