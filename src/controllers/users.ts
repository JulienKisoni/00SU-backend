import { NextFunction, Response } from 'express';
import Joi, { type LanguageMessages } from 'joi';

import { ExtendedRequest, IUserDocument, USER_ROLES } from '../types/models';
import * as userBusiness from '../business/users';
import { createError, handleError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { regex } from '../helpers/constants';
interface AddUserPayload extends Omit<IUserDocument, '_id' | 'storeId' | 'createdAt' | 'updatedAt'> {
  role: USER_ROLES;
}

export const addUserCtrl = async (req: ExtendedRequest<AddUserPayload>, res: Response, next: NextFunction) => {
  const { email, password, username, role } = req.body || {};

  const usernameMessages: LanguageMessages = {
    'any.required': 'The field username is required',
    'string.min': 'The field username must have 6 characters minimum',
  };
  const passwordMessages: LanguageMessages = {
    'any.required': 'The field password is required',
    'string.min': 'The field password must have 6 characters minimum',
  };
  const emailMessages: LanguageMessages = {
    'any.required': 'The field email is required',
    'string.email': 'Please enter a valid email',
  };
  const roleMessages: LanguageMessages = {
    'any.required': 'The field role is required',
    'any.only': 'Please enter a valid role',
  };
  const session = req.currentSession;

  const schema = Joi.object<AddUserPayload>({
    username: Joi.string().min(6).required().messages(usernameMessages),
    email: Joi.string().email().required().messages(emailMessages),
    password: Joi.string().min(6).required().messages(passwordMessages),
    role: Joi.string().valid(USER_ROLES.admin, USER_ROLES.clerk, USER_ROLES.manager).required().messages(roleMessages),
  });
  const { error, value } = schema.validate({ email, password, username, role });
  if (error) {
    return handleError({ error, next, currentSession: session });
  } else if (value) {
    const { error, userId } = await userBusiness.addUser(value);
    if (error && !userId) {
      return handleError({ error, next, currentSession: session });
    }
    if (session) {
      await session.endSession();
    }
    res.status(HTTP_STATUS_CODES.CREATED).json({ userId });
  }
};

export const getUsers = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const users = await userBusiness.getUsers();
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ users });
};

export const invalidateToken = async (req: ExtendedRequest<{ userId: string }>, res: Response, next: NextFunction) => {
  const messages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const schema = Joi.object<{ userId: string }>({
    userId: Joi.string().regex(regex.mongoId).required().messages(messages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  await userBusiness.invalidateToken({ userId: value.userId });
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

export const deleteUser = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const messages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const schema = Joi.object<{ userId: string }>({
    userId: Joi.string().regex(regex.mongoId).required().messages(messages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  await userBusiness.deleteOne({ userId: value.userId });
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type EditUserPayload = Pick<IUserDocument, 'email' | 'username' | 'profile'>;
interface JoiSchema {
  params: {
    userId: string;
  };
  body: EditUserPayload;
}
export const editUser = async (req: ExtendedRequest<EditUserPayload>, res: Response, next: NextFunction) => {
  const body = req.body;
  const userIdMessages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const usernameMessages: LanguageMessages = {
    'string.min': 'The field username must have 6 characters minimum',
  };
  const emailMessages: LanguageMessages = {
    'string.email': 'Please enter a valid email',
  };
  const roleMessages: LanguageMessages = {
    'any.only': 'Please enter a valid role',
  };
  const params = req.params as { userId: string };
  const session = req.currentSession;

  if (!body) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body',
      publicMessage: 'Please provide body with your request',
    });
    return handleError({ error, next, currentSession: session });
  }

  const payload: JoiSchema = {
    params,
    body,
  };
  const schema = Joi.object<JoiSchema>({
    params: {
      userId: Joi.string().regex(regex.mongoId).required().messages(userIdMessages),
    },
    body: {
      username: Joi.string().min(6).messages(usernameMessages),
      email: Joi.string().email().messages(emailMessages),
      profile: {
        role: Joi.string().valid(USER_ROLES.admin, USER_ROLES.clerk, USER_ROLES.manager).messages(roleMessages),
      },
    },
  });
  const { error, value } = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err } = await userBusiness.updateOne({ payload: value.body, userId: value.params.userId });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type GetOneUserPayload = API_TYPES.Routes['business']['users']['getOne'];
export const getOneUser = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneUserPayload;
  const userIdMessages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const schema = Joi.object<GetOneUserPayload>({
    userId: Joi.string().regex(regex.mongoId).required().messages(userIdMessages),
  });
  const session = req.currentSession;

  const { error, value } = schema.validate(params, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: _error, user } = await userBusiness.getOne({ userId: value.userId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ user });
};
