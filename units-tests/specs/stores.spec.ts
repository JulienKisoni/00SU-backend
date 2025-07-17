/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from '@jest/globals';

import { UserModel } from '../../src/models/user';
import { StoreModel } from '../../src/models/store';
import { deleteStore } from '../../src/business/stores';

jest.mock('../../src/models/user.ts');
jest.mock('../../src/models/store.ts');

const FAKE_ID = '670f198f1fc4fdd76bd0AAAA';

describe('Store business logics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('Should [SUCCESS] delete store ', async () => {
    const mockedStoreFindByIdAndDelete = jest.spyOn(StoreModel, 'findByIdAndDelete');
    const store = {
      _id: FAKE_ID,
      owner: FAKE_ID,
    };
    (mockedStoreFindByIdAndDelete as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(store),
      };
    });
    const mockedUserUpdateOne = jest.spyOn(UserModel, 'updateOne');
    (mockedUserUpdateOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(),
      };
    });
    const user = {
      _id: FAKE_ID,
      updateSelf: jest.fn().mockImplementationOnce((update) => {
        return UserModel.updateOne({ _id: FAKE_ID }, update);
      }),
    };
    const mockedUserFindById = jest.spyOn(UserModel, 'findById');
    (mockedUserFindById as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(user),
      };
    });
    const { error } = await deleteStore({ storeId: FAKE_ID });
    expect(mockedStoreFindByIdAndDelete).toHaveBeenCalledWith(store._id);
    expect(mockedUserFindById).toHaveBeenCalledWith(store.owner);
    expect(mockedUserUpdateOne).toHaveBeenCalledTimes(1);
    expect(error).toEqual(undefined);
  });
  test('Should [FAIL] delete store ', async () => {
    const mockedStoreFindByIdAndDelete = jest.spyOn(StoreModel, 'findByIdAndDelete');
    const store = {
      _id: FAKE_ID,
      owner: FAKE_ID,
    };
    (mockedStoreFindByIdAndDelete as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(store),
      };
    });
    const mockedUserUpdateOne = jest.spyOn(UserModel, 'updateOne');
    (mockedUserUpdateOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(),
      };
    });
    const mockedUserFindById = jest.spyOn(UserModel, 'findById');
    (mockedUserFindById as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(null),
      };
    });
    const { error } = await deleteStore({ storeId: FAKE_ID });
    expect(mockedStoreFindByIdAndDelete).toHaveBeenCalledWith(store._id);
    expect(mockedUserFindById).toHaveBeenCalledWith(store.owner);
    expect(mockedUserUpdateOne).not.toHaveBeenCalled();
    expect(error?.publicMessage).toEqual('Store does not exist');
  });
});
