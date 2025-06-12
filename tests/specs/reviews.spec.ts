import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, CONSTANTS, seedDatabase } from '../helpers';
import { IProductDocument, IReviewDocument, ITestUser } from '../../src/types/models';
import { login } from '../helpers/users';

const { invalidMongoId, nonExistingMongoId } = CONSTANTS;

const baseURL = '/v1/reviews';
let testUser: ITestUser = {};
let review: IReviewDocument | undefined;
let product: IProductDocument | undefined;
let server: Server | undefined;

describe('REVIEWS', () => {
  before(async () => {
    server = await startServer('8000', app);
    const res = await seedDatabase();
    review = res.review;
    product = res.product;
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

  describe('[GET] /reviews', () => {
    let url = baseURL;

    it('[401] Should fail: Unauthorized', async () => {
      request(app).get(url).expect(401);
    });

    it('[200] Should succeed: OK', async () => {
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const reviews = res.body.reviews as IReviewDocument[];
      reviews.forEach((review) => {
        validateReview(review);
      });
    });
  });

  describe('[GET] /reviews/:{reviewId}', () => {
    const invalidUrl = `${baseURL}/${invalidMongoId}`;

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${review?._id}`;
      request(app).get(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const token = testUser.token || '';
      request(app).get(invalidUrl).set('Authorization', token).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const token = testUser.token || '';
      request(app).get(`${baseURL}/${nonExistingMongoId}`).set('Authorization', token).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${review?._id}`;
      const token = testUser.token || '';
      const res = await request(app).get(url).set('Authorization', token).expect(200);
      const reviewResponse = res.body.review as IReviewDocument;
      validateReview(reviewResponse);
    });
  });

  describe('[POST] /reviews', async () => {
    const testUser2: ITestUser = {};
    const tokens = await login({ email: 'julien+admin@mail.com', password: 'julien+admin' });
    if (tokens) {
      testUser2.tokens = tokens;
      testUser2.token = `Bearer ${tokens.accessToken}`;
    }
    const validBody = {
      productId: product?._id,
      title: 'Very good',
      content: 'This is a good product',
      stars: 5,
    };
    const invalidBody = { ...validBody };
    invalidBody.content = '';

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}`;
      request(app).post(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}`;
      const token = testUser2.token || '';
      request(app).post(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[201] Should succeed: OK', async () => {
      const url = `${baseURL}`;
      const token = testUser2.token || '';
      const res = await request(app).post(url).set('Authorization', token).send(validBody).expect(201);
      should(res.body).have.property('reviewId');
    });
  });

  describe('[PATCH] /reviews/:{reviewId}', () => {
    const validBody = {
      title: 'The new title',
    };
    const invalidBody = {
      title: '',
    };

    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${review?._id}`;
      request(app).patch(url).expect(401);
    });

    it('[400] Should fail: Bad request', async () => {
      const url = `${baseURL}/${review?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(invalidBody).expect(400);
    });

    it('[404] Should fail: Not found', async () => {
      const url = `${baseURL}/${nonExistingMongoId}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(404);
    });

    it('[200] Should succeed: OK', async () => {
      const url = `${baseURL}/${review?._id}`;
      const token = testUser.token || '';
      request(app).patch(url).set('Authorization', token).send(validBody).expect(200);
    });
  });

  describe('[DELETE] /reviews/:{reviewId}', () => {
    it('[401] Should fail: Unauthorized', async () => {
      const url = `${baseURL}/${review?._id}`;
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
      const url = `${baseURL}/${review?._id}`;
      const token = testUser.token || '';
      request(app).delete(url).set('Authorization', token).expect(200);
    });
  });
});

export const validateReview = (review: IReviewDocument) => {
  should(review).have.property('_id');
  should(review).have.property('title');
  should(review).have.property('content');
  should(review).have.property('stars');
  should(review).have.property('productId');
  should(review).have.property('owner');
  should(review).have.property('createdAt');
  should(review).have.property('updatedAt');
};
