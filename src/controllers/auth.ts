import { Response, NextFunction } from 'express';
import Joi from 'joi';

import { handleError } from '../middlewares/errors';
import * as authBusiness from '../business/auth';
import * as userBusiness from '../business/users';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest } from '../types/models';

type LoginBody = API_TYPES.Routes['body']['login'];
type RefreshTokenBody = API_TYPES.Routes['body']['refreshToken'];

export const login = async (req: ExtendedRequest<LoginBody>, res: Response, next: NextFunction) => {
  const { email, password } = req.body || {};

  const emmailMessages: Joi.LanguageMessages = {
    'string.email': 'Please enter a valid email',
    'any.required': 'The email field is required',
  };
  const passwordMessages: Joi.LanguageMessages = {
    'any.required': 'The password field is required',
    'string.min': 'The password field must have 6 characters at least',
  };
  const schema = Joi.object<LoginBody>({
    email: Joi.string().email().required().messages(emmailMessages),
    password: Joi.string().min(6).required().messages(passwordMessages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate({ email, password }, { stripUnknown: true, abortEarly: true });

  if (error) {
    return handleError({ error, next, currentSession: session });
  } else if (value) {
    const { error, tokens } = await authBusiness.login(value);
    if (error) {
      return handleError({ error, next, currentSession: session });
    }
    const err = await userBusiness.saveToken({ refreshToken: tokens?.refreshToken, accessToken: tokens?.accessToken });
    if (err) {
      return handleError({ error: err, next, currentSession: session });
    }
    if (session) {
      await session.endSession();
    }
    res.status(HTTP_STATUS_CODES.OK).json(tokens);
  }
};

export const refreshToken = async (req: ExtendedRequest<RefreshTokenBody>, res: Response, next: NextFunction) => {
  const messages: Joi.LanguageMessages = {
    'any.required': 'The refrehToken is required',
  };
  const schema = Joi.object<RefreshTokenBody>({
    refreshToken: Joi.string().required().messages(messages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err, accessToken } = await authBusiness.refreshToken({ refreshToken: value.refreshToken });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ accessToken });
};
