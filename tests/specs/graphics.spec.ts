import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IStoreDocument, ITestUser, IGraphicDocument } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/graphics';
const testUser: ITestUser = {};
let graphic: Partial<IGraphicDocument> | undefined;
let store: IStoreDocument | undefined;
let server: Server | undefined;

describe('GRAPHICS', () => {
  before(async () => {
    server = await startServer('8888', app);
    const res = await seedDatabase();
    graphic = res.graphic;
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

  describe('[GET] /graphics', () => {
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
      const graphics = res.body.graphics as IGraphicDocument[];
      graphics.forEach((graphic) => {
        validateGraphic(graphic);
      });
    });
  });

  describe('[GET] /graphics/:{graphicId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const reportResponse = res.body.graphic as IGraphicDocument;
      validateGraphic(reportResponse);
    });
  });

  describe('[PATCH] /graphics/:{graphicId}', () => {
    const validBody = {
      name: 'The new name',
    };
    const invalidBody = {
      name: 6875,
    };

    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /graphics/:{graphicId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${graphic?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateGraphic = (graphic: IGraphicDocument) => {
  should(graphic).have.property('_id');
  should(graphic).have.property('histories');
  should(graphic).have.property('name');
  should(graphic).have.property('description');
  should(graphic).have.property('teamId');
  should(graphic).have.property('storeId');
  should(graphic).have.property('generatedBy');
};
