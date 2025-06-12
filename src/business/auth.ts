import { HTTP_STATUS_CODES } from '../types/enums';
import { createError, GenericError } from '../middlewares/errors';
import { UserModel } from '../models/user';
import { generateToken } from '../utils/tokens';

type LoginPaylod = API_TYPES.Routes['body']['login'];
type LoginResponse = API_TYPES.Routes['business']['auth']['login'];

export const login = async ({ email, password }: LoginPaylod): Promise<LoginResponse> => {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `User with email (${email}) does not exist`,
      publicMessage: 'Invalid credentials',
    });
    return { error };
  } else if (user.comparePassword) {
    const { areEqual } = await user.comparePassword(password);
    if (!areEqual) {
      const error = createError({
        statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
        message: `Password (${password}) not matching`,
        publicMessage: 'Invalid credentials',
      });
      return { error };
    }
  }
  const { error, tokens } = await generateToken({ email: user.email, userId: user._id.toString(), type: 'all' });
  if (error) {
    return { error };
  }
  return { tokens };
};

export const refreshToken = async ({ refreshToken }: { refreshToken: string }): Promise<{ accessToken?: string; error?: GenericError }> => {
  const { user, error } = await UserModel.findByRefreshToken(refreshToken);
  if (error) {
    return { error };
  }
  let accessToken: string | undefined;
  if (user) {
    const { error, tokens } = await generateToken({ email: user.email, userId: user._id.toString(), type: 'access' });
    if (error) {
      return { error };
    }
    accessToken = tokens?.accessToken;
  }
  return { accessToken };
};
