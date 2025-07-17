/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from '@jest/globals';
import should from 'should';

import { ProductModel } from '../../src/models/product';
import { getAllProducts } from '../../src/business/products';
import { IProductDocument } from '../../src/types/models';

jest.mock('../../src/models/product.ts');

const FAKE_ID = '670f198f1fc4fdd76bd0AAAA';
const FAKE_ID2 = '670f198f1fc4fdd76bd0BBBB';

describe('Product business logics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const products: IProductDocument[] = [
    {
      _id: FAKE_ID,
      name: 'the new name',
      quantity: 8,
      storeId: FAKE_ID,
      description: 'This is the new description',
      minQuantity: 3,
      teamId: FAKE_ID,
      owner: FAKE_ID,
      unitPrice: 500,
      createdAt: new Date('2024-10-17T01:56:19.132Z'),
      updatedAt: new Date('2024-10-19T17:40:44.797Z'),
    },
    {
      _id: FAKE_ID2,
      name: 'Product #1',
      quantity: 8,
      storeId: FAKE_ID2,
      description: 'Product #1 description #1',
      minQuantity: 3,
      teamId: FAKE_ID,
      owner: FAKE_ID,
      unitPrice: 50,
      createdAt: new Date('2024-10-17T01:56:47.072Z'),
      updatedAt: new Date('2024-10-17T01:56:47.072Z'),
    },
  ];
  test('Should [SUCCESS] get all products ', async () => {
    const mockedFind = jest.spyOn(ProductModel, 'find');
    (mockedFind as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        lean: jest.fn().mockReturnValueOnce({
          exec: () => Promise.resolve(products),
        }),
      };
    });
    const response = await getAllProducts({ storeId: FAKE_ID2, teamId: FAKE_ID });
    response.products.forEach((product) => {
      validateProduct(product);
    });
    expect(mockedFind).toHaveBeenCalledTimes(1);
  });
  test('Should [FAIL] get all products ', async () => {
    const mockedFind = jest.spyOn(ProductModel, 'find');
    (mockedFind as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        lean: jest.fn().mockReturnValueOnce({
          exec: () => Promise.resolve([]),
        }),
      };
    });
    const response = await getAllProducts({ storeId: FAKE_ID2, teamId: FAKE_ID });
    expect(mockedFind).toHaveBeenCalledTimes(1);
    expect(response.products).toHaveLength(0);
  });
});

const validateProduct = (product: Partial<IProductDocument>) => {
  should(product).have.property('_id');
  should(product).have.property('name');
  should(product).have.property('quantity');
  should(product).have.property('description');
  should(product).have.property('minQuantity');
  should(product).have.property('owner');
  should(product).have.property('teamId');
  should(product).have.property('unitPrice');
  should(product).have.property('createdAt');
  should(product).have.property('updatedAt');
};
