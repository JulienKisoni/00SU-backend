import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { handleError } from '../middlewares/errors';
import * as authBusiness from '../business/auth';
import * as userBusiness from '../business/users';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, ParamsDictionary } from '../types/models';

type LoginBody = API_TYPES.Routes['body']['login'];
type RefreshTokenBody = API_TYPES.Routes['body']['refreshToken'];

export const login = async (req: ExtendedRequest<LoginBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { email, password } = req.body || {};

  const passwordMessages: LanguageMessages = {
    'any.required': 'The field password is required',
    'string.min': 'The field password must have 6 characters minimum',
    'string.max': 'The field password must have 128 characters maximum',
  };
  const emailMessages: LanguageMessages = {
    'any.required': 'The field email is required',
    'string.email': 'Please enter a valid email',
    'string.max': 'The field email must have 320 characters maximum',
  };
  const schema = Joi.object<LoginBody>({
    email: Joi.string().email().min(5).max(320).required().messages(emailMessages),
    password: Joi.string().min(6).max(128).required().messages(passwordMessages),
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

export const refreshToken = async (req: ExtendedRequest<RefreshTokenBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const messages: Joi.LanguageMessages = {
    'any.required': 'The refreshToken is required',
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

interface RecoverPasswordBody {
  email: string;
}
export const recoverPassword = async (req: ExtendedRequest<RecoverPasswordBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const messages: Joi.LanguageMessages = {
    'any.required': 'The refreshToken is required',
  };
  const schema = Joi.object<RecoverPasswordBody>({
    email: Joi.string().email().required().messages(messages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err, email } = await authBusiness.recoverPassword({ email: value.email });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ email });
};
