import { describe, expect, test } from '@jest/globals';

import { addUser, invalidateToken } from '../../src/business/users';
import { USER_ROLES } from '../../src/types/models';
import { encrypt } from '../../src/utils/hash';
import { UserModel } from '../../src/models/user';

jest.mock('../../src/models/user.ts');
jest.mock('../../src/utils/hash.ts');

const FAKE_ID = '670f198f1fc4fdd76bd0AAAA';

describe('User business logics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('Should [SUCCESS] add user ', async () => {
    const mockedCreate = jest.spyOn(UserModel, 'create');
    const mockedFindOne = jest.spyOn(UserModel, 'findOne');
    const encryptedText = 'EncryptedPassword';
    const mockedEncrypt = jest.spyOn({ encrypt }, 'encrypt');
    mockedEncrypt.mockResolvedValueOnce({ encryptedText });
    (mockedFindOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(null),
      };
    });
    (mockedCreate as jest.MockInstance<any, any>).mockResolvedValueOnce({ _id: FAKE_ID });
    const payload = {
      username: 'Julien',
      email: 'julien@mail.com',
      password: 'julien',
      role: USER_ROLES.user,
    };
    const { username, email, role } = payload;
    const res = await addUser(payload);
    expect(res.userId).toEqual(FAKE_ID);
    expect(mockedCreate).toHaveBeenCalledWith({ email, username, password: encryptedText, profile: { role } });
  });
  test('Should [FAIL] add existing user ', async () => {
    const mockedFindOne = jest.spyOn(UserModel, 'findOne');
    const mockedCreate = jest.spyOn(UserModel, 'create');
    (mockedFindOne as jest.MockInstance<any, any>).mockImplementationOnce(() => ({
      exec: () => Promise.resolve({ _id: FAKE_ID }),
    }));
    const payload = {
      username: 'Julien',
      email: 'julien@mail.com',
      password: 'julien',
      role: USER_ROLES.user,
    };
    const { error } = await addUser(payload);
    expect(error?.publicMessage).toEqual('User with this email already exist');
    expect(mockedCreate).not.toHaveBeenCalled();
  });
  test('Should [SUCCESS] invalidate a token', async () => {
    const mockedFindById = jest.spyOn(UserModel, 'findById');
    const mockedUpdateOne = jest.spyOn(UserModel, 'updateOne');
    const now = new Date().getTime();
    const user = {
      private: {
        invalidToken: {
          expiryAt: now,
          tokenId: FAKE_ID,
        },
      },
      updateSelf: jest.fn().mockImplementationOnce((update) => {
        return UserModel.updateOne(update);
      }),
    };
    (mockedFindById as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(user),
      };
    });
    (mockedUpdateOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(true),
      };
    });
    await invalidateToken({ userId: FAKE_ID });
    expect(mockedFindById).toHaveBeenCalledTimes(1);
    expect(mockedUpdateOne).toHaveBeenCalledTimes(1);
  });
  test('Should [FAIL] invalidate a token', async () => {
    const mockedFindById = jest.spyOn(UserModel, 'findById');
    const mockedUpdateOne = jest.spyOn(UserModel, 'updateOne');
    (mockedFindById as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(null),
      };
    });
    (mockedUpdateOne as jest.MockInstance<any, any>).mockImplementationOnce(() => {
      return {
        exec: () => Promise.resolve(true),
      };
    });
    await invalidateToken({ userId: FAKE_ID });
    expect(mockedFindById).toHaveBeenCalledTimes(1);
    expect(mockedUpdateOne).not.toHaveBeenCalled();
  });
});
