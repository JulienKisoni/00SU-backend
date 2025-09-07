import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IStoreDocument, ITestUser, IReportDocument } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/reports';
const testUser: ITestUser = {};
let report: Partial<IReportDocument> | undefined;
let store: IStoreDocument | undefined;
let server: Server | undefined;

describe('REPORTS', () => {
  before(async () => {
    server = await startServer('8888', app);
    const res = await seedDatabase();
    report = res.report;
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

  describe('[GET] /reports', () => {
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
      const reports = res.body.reports as IReportDocument[];
      reports.forEach((report) => {
        validateReport(report);
      });
    });
  });

  describe('[GET] /reports/:{reportId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const reportResponse = res.body.report as IReportDocument;
      validateReport(reportResponse);
    });
  });

  describe('[PATCH] /reports/:{reportId}', () => {
    const validBody = {
      name: 'The new name',
    };
    const invalidBody = {
      name: 6875,
    };

    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /reports/:{reportId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const storeId = store?._id.toString();
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
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
      const url = `${baseURL}/stores/${storeId}/${report?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateReport = (report: IReportDocument) => {
  should(report).have.property('_id');
  should(report).have.property('orders');
  should(report).have.property('name');
  should(report).have.property('description');
  should(report).have.property('teamId');
  should(report).have.property('storeId');
  should(report).have.property('generatedBy');
};
