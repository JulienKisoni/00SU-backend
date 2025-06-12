import { sign, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type TokenType = 'all' | 'access' | 'refresh';

export const generateToken = async ({
  email,
  userId,
  type = 'all',
}: {
  email: string;
  userId: string;
  type: TokenType;
}): Promise<API_TYPES.Routes['business']['auth']['login']> => {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  const error = createError({
    statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
    message: 'Could not find either ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, EXPIRY_ACCESS_TOKEN or EXPIRY_REFRESH_TOKEN env variable ',
  });
  if (type === 'all' || type === 'access') {
    const signAccessSecret = process.env.ACCESS_TOKEN_SECRET;
    const expiryAccessToken = process.env.EXPIRY_ACCESS_TOKEN;
    if (!signAccessSecret || !expiryAccessToken) {
      return { error };
    }
    const accessPayload = {
      email,
    };
    const accessOptions: SignOptions = {
      issuer: 'http://localhost:8000',
      subject: userId,
      jwtid: uuidv4(),
      expiresIn: expiryAccessToken,
      header: {
        typ: 'Bearer',
        alg: 'HS256',
      },
    };
    accessToken = sign(accessPayload, signAccessSecret, accessOptions);
  }
  if (type === 'all' || type === 'refresh') {
    const signRefreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const expiryRefreshToken = process.env.EXPIRY_REFRESH_TOKEN;
    if (!signRefreshSecret) {
      return { error };
    }
    const refreshPayload = {
      email,
    };
    const refreshOptions: SignOptions = {
      issuer: 'http://localhost:8000',
      subject: userId,
      jwtid: uuidv4(),
      expiresIn: expiryRefreshToken,
      header: {
        typ: 'Bearer',
        alg: 'HS256',
      },
    };
    refreshToken = sign(refreshPayload, signRefreshSecret, refreshOptions);
  }
  return {
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};
