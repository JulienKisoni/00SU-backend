import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IProductDocument, ITeamDocument, ITestUser } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/teams';
const testUser: ITestUser = {};
let team: ITeamDocument | undefined;
let server: Server | undefined;
let teamId = '';

describe.only('TEAMS', () => {
  before(async () => {
    server = await startServer('8000', app);
    const res = await seedDatabase();
    team = res.team;
    teamId = team?._id.toString() || '';
    const tokens = await login({ email: 'teamowner@mail.com', password: 'julien' });
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

  describe('[GET] /team/{:teamId}/members', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${teamId}/members`;
      request(app).get(url).expect(401);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${teamId}/members`;
      const token = testUser.token || '';
      await request(app).get(url).set('Authorization', token).expect(200);
    });

    it('[400] Should fail: Bad request', async () => {
      const invalidUrl = `${baseURL}/${invalidMongoId}/members`;
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const invalidUrl = `${baseURL}/${nonExistingMongoId}/members`;
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(404);
    });
  });

  describe('[PATCH] /teams/:{teamId}', () => {
    const validBody = {
      name: 'The new name',
    };
    const invalidBody = {
      name: 7852,
    };

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${teamId}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}/${teamId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const url = `${baseURL}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${teamId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[POST] /users/teams/:${teamId}/inviteUser', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const url = `/v1/users/teams/:${teamId}/inviteUser`;
      request(app).post(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `/v1/users/teams/:${teamId}/inviteUser`;
      const token = testUser.token || '';
      request(app).post(url).set('Authorization', token).expect(400);
    });

    it('[400] Should fail: Not found', async () => {
      const url = `/v1/users/teams/:${nonExistingMongoId}/inviteUser`;
      const token = testUser.token || '';
      request(app).post(url).set('Authorization', token).expect(400);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `/v1/users/teams/:${teamId}/inviteUser`;
      const token = testUser.token || '';
      request(app).post(url).set('Authorization', token).send({ email: 'user2@mail.com', role: 'manager' }).expect(200);
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
