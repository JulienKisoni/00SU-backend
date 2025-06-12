import { genSalt, hash, compare } from 'bcrypt';

import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

interface HashParams {
  plainText: string;
}
interface HashReturn {
  encryptedText?: string;
  error?: GenericError;
}
interface CompareParams {
  plainText: string;
  encryptedText: string;
}
interface CompareReturn {
  areEqual: boolean;
  error?: GenericError;
}

export const encrypt = async ({ plainText }: HashParams): Promise<HashReturn> => {
  const SALT_ROUND = process.env.SALT_ROUND;
  if (!SALT_ROUND) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      publicMessage: 'Somthing went wrong',
      message: 'Cannot find SALT_ROUND env variable',
    });
    return { error };
  }
  const saltRound = parseInt(SALT_ROUND, 10);
  const salt = await genSalt(saltRound);
  const encryptedText = await hash(plainText, salt);
  return { encryptedText };
};

export const compareValues = async ({ plainText, encryptedText }: CompareParams): Promise<CompareReturn> => {
  const result = await compare(plainText, encryptedText);
  return { areEqual: result };
};
