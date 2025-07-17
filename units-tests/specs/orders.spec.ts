import { describe, expect, test } from '@jest/globals';
import should from 'should';

import { generateOrderNumber } from '../../src/business/orders';

describe('Order business logics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('Should [SUCCESS] generate order number ', async () => {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString();
    const orderNumber = generateOrderNumber();
    const [_D, _M, _Y, _ID] = orderNumber.split('-');
    expect(_ID).toBeDefined();
    should(_ID).be.String();
    expect(_D).toEqual(day);
    expect(_M).toEqual(month);
    expect(_Y).toEqual(year);
  });
});
