import { ITeamDocument, IUserDocument } from '../../src/types/models';
import DummyUsers from '../../mocks/users.json';
import { IUserMethods, UserModel } from '../../src/models/user';
import { encrypt } from '../../src/utils/hash';
import * as authBusiness from '../../src/business/auth';

type CreateUserDoc = Omit<IUserMethods, '_id' | 'createdAt' | 'updatedAt'>;

export const injectUsers = async (teams: ITeamDocument[]): Promise<(IUserDocument | undefined)[]> => {
  const promises = [];
  for (const team of teams) {
    const teamId = team._id.toString();
    promises.push(createUsers(teamId));
  }
  const responses = await Promise.all(promises);
  const users: (IUserDocument | undefined)[] = [];
  responses.forEach((response) => {
    users.push(...response);
  });
  return users;
};

export const createUsers = async (teamId: string) => {
  const promises = DummyUsers.map((user) => {
    const { password, email, profile } = user;
    const doc: CreateUserDoc = {
      password,
      email,
      teamId,
      // @ts-expect-error - just for tests
      profile,
    };
    return createUser(doc);
  });
  const users = await Promise.all(promises);
  return users;
};

export const createUser = async (doc: CreateUserDoc) => {
  const { password } = doc;
  const { encryptedText } = await encrypt({ plainText: password });
  if (!encryptedText) {
    return undefined;
  }
  doc.password = encryptedText;
  const user = await UserModel.create(doc);
  return user;
};

interface ILoginArgs {
  email: string;
  password: string;
}

export const login = async (args?: ILoginArgs) => {
  const { email = 'julien@mail.com', password = 'julien' } = args || {};
  const { tokens } = await authBusiness.login({ email, password });
  return tokens;
};
