import { describe, expect, test } from '@jest/globals';
import should from 'should';

import { getOneReview } from '../../src/business/reviews';
import { IReviewDocument } from '../../src/types/models';
import { ReviewModel } from '../../src/models/review';

jest.mock('../../src/models/review.ts');

const FAKE_ID = '670f198f1fc4fdd76bd0AAAA';
const FAKE_ID2 = '670f198f1fc4fdd76bd0BBBB';

describe('Review business logics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const review = {
    _id: FAKE_ID,
    title: 'My awesome review',
    content: 'This is my awesome review content',
    stars: 4,
    productId: {
      _id: FAKE_ID,
      name: 'Product to review',
      quantity: 8,
      storeId: FAKE_ID,
      description: 'Product to review description',
      minQuantity: 3,
      owner: FAKE_ID,
      active: true,
      unitPrice: 50,
      reviews: [FAKE_ID, FAKE_ID],
      createdAt: '2024-10-19T17:30:37.818Z',
      updatedAt: '2024-10-19T17:39:29.321Z',
    },
    owner: {
      _id: FAKE_ID,
      username: 'julien2',
      email: 'julien2@mail.com',
      createdAt: '2024-10-10T01:25:30.406Z',
      updatedAt: '2024-10-25T23:36:10.300Z',
      profile: {
        role: 'user',
      },
    },
    createdAt: '2024-10-17T01:56:19.132Z',
    updatedAt: '2024-10-19T17:40:44.797Z',
  };
  test('Should [SUCCESS] get one review ', async () => {
    const mockedFindOne = jest.spyOn(ReviewModel, 'findOne');
    (mockedFindOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        populate: jest.fn().mockImplementationOnce(() => {
          return {
            populate: jest.fn().mockImplementationOnce(() => {
              return {
                lean: jest.fn().mockImplementationOnce(() => {
                  return {
                    exec: jest.fn().mockResolvedValue(review),
                  };
                }),
              };
            }),
          };
        }),
      };
    });
    const response = await getOneReview({ reviewId: FAKE_ID2 });
    expect(response.data?.review).toBeDefined;
    expect(response?.error).not.toBeDefined();
    if (response.data?.review) {
      validateReview(response.data?.review);
    }
    expect(mockedFindOne).toHaveBeenCalledWith({ _id: FAKE_ID2 });
  });
  test('Should [FAIL] get one review ', async () => {
    const mockedFindOne = jest.spyOn(ReviewModel, 'findOne');
    (mockedFindOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        populate: jest.fn().mockImplementationOnce(() => {
          return {
            populate: jest.fn().mockImplementationOnce(() => {
              return {
                lean: jest.fn().mockImplementationOnce(() => {
                  return {
                    exec: jest.fn().mockResolvedValue(null),
                  };
                }),
              };
            }),
          };
        }),
      };
    });
    const response = await getOneReview({ reviewId: FAKE_ID2 });
    expect(response.error?.publicMessage).toBeDefined;
    expect(response?.data).not.toBeDefined();
    if (response.error?.publicMessage) {
      expect(response.error?.publicMessage).toEqual('This review does not exist');
    }
    expect(mockedFindOne).toHaveBeenCalledWith({ _id: FAKE_ID2 });
  });
});

export const validateReview = (review: Partial<IReviewDocument>) => {
  should(review).have.property('_id');
  should(review).have.property('title');
  should(review).have.property('content');
  should(review).have.property('stars');
  should(review).have.property('productId');
  should(review).have.property('owner');
  should(review).have.property('createdAt');
  should(review).have.property('updatedAt');
};
