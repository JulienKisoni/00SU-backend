import request from 'supertest';
import should from 'should';
import { type Server } from 'http';

import { app } from '../../src/app';
import { startServer } from '../../src/utils/server';
import { clearDatabase, seedDatabase } from '../../tests/helpers';
import { IProductDocument } from '../../src/types/models';
import { validateProduct } from '../../tests/specs/products.spec';

let server: Server | undefined;
const urls = {
  createTeam: '',
  signup: '',
  login: '',
  addStore: '',
  getProducts: '',
  addProduct: '',
  addReview: '',
  addOrder: '',
};
const payloads = {
  user: {
    password: '',
    email: '',
    profile: {
      username: '',
      role: '',
    },
  },
  team: {
    name: '',
    description: '',
    id: '',
    owner: '',
  },
  token: '',
  store: {
    name: '',
    description: '',
    active: true,
    address: {},
  },
  product: {
    name: '',
    quantity: 0,
    description: '',
    minQuantity: 0,
    active: true,
    unitPrice: 0,
  },
  review: {
    productId: '',
    title: '',
    content: '',
    stars: 0,
  },
  order: {
    items: [] as { productId: string; quantity: number; productDetails: unknown }[],
    storeId: '',
  },
};

describe('E2E', () => {
  before(async () => {
    server = await startServer('8000', app);
    await seedDatabase();
  });

  after(async () => {
    await clearDatabase();
    if (server) {
      server.close();
    }
  });

  it('FROM USER REGISTRATION TO PLACE ORDER', async () => {
    // Signup
    urls.signup = '/v1/users/signup';
    payloads.user.email = 'edouard@mail.com';
    payloads.user.password = 'edouard';
    payloads.user.profile.username = 'edouard';
    payloads.user.profile.role = 'admin';
    const res1 = await request(app).post(urls.signup).send(payloads.user);
    should(res1.statusCode).equal(201);
    const userId = res1.body.userId as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    should(userId).be.String;

    payloads.team.owner = userId.toString();
    payloads.team.name = 'My team';
    urls.createTeam = '/v1/teams/add';
    const teamRes = await request(app).post(urls.createTeam).send({ name: payloads.team.name, owner: payloads.team.owner });
    should(teamRes.statusCode).equal(201);

    // Login
    urls.login = '/v1/auth/login';
    const res2 = await request(app).post(urls.login).send({ email: payloads.user.email, password: payloads.user.password });
    should(res2.statusCode).equal(200);
    const token = res2.body.accessToken as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    should(token).be.String;
    payloads.token = token;

    // Create store
    urls.addStore = '/v1/stores';
    payloads.store.name = 'Edouard store';
    payloads.store.description = 'Edouard store description';
    payloads.store.address = {
      line1: '124 Rue papa',
      country: 'Canada',
      state: 'QC',
      city: 'Montreal',
    };
    const res3 = await request(app).post(urls.addStore).set('Authorization', `Bearer ${payloads.token}`).send(payloads.store);
    should(res3.statusCode).equal(201);
    const storeId = res3.body.storeId as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    should(storeId).be.String;

    // Add product
    urls.addProduct = `/v1/stores/${storeId}/products`;
    payloads.product.name = 'Edouard product';
    payloads.product.description = 'Edouard product awesome description';
    payloads.product.quantity = 10;
    payloads.product.minQuantity = 3;
    payloads.product.unitPrice = 400;
    const res5 = await request(app).post(urls.addProduct).set('Authorization', `Bearer ${payloads.token}`).send(payloads.product);
    should(res5.statusCode).equal(201);
    const productId = res5.body._id as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    should(productId).be.String;

    // Get existing products
    urls.getProducts = `/v1/stores/${storeId}/products`;
    const res4 = await request(app).get(urls.getProducts).set('Authorization', `Bearer ${payloads.token}`);
    should(res4.statusCode).equal(200);
    const existingProducts = res4.body.products as IProductDocument[];
    existingProducts.forEach((product) => {
      validateProduct(product);
    });

    // Add order
    urls.addOrder = '/v1/orders';
    payloads.order.items = existingProducts.map((product) => {
      return {
        productId: product._id.toString(),
        quantity: product.minQuantity,
        productDetails: { ...product, picture: '', productId: product._id },
      };
    });
    payloads.order.storeId = storeId;
    const res7 = await request(app).post(urls.addOrder).set('Authorization', `Bearer ${payloads.token}`).send(payloads.order);
    should(res7.statusCode).equal(201);
    const orderId = res7.body.orderId as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    should(orderId).be.String;
  });
});
