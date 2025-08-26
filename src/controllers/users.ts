import { NextFunction, Response } from 'express';
import Joi, { type LanguageMessages } from 'joi';

import { ExtendedRequest, IUserDocument, ParamsDictionary, USER_ROLES } from '../types/models';
import * as userBusiness from '../business/users';
import { createError, handleError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { regex } from '../helpers/constants';
type AddUserPayload = Omit<IUserDocument, '_id' | 'storeId' | 'createdAt' | 'updatedAt'>;

export const addUserCtrl = async (req: ExtendedRequest<AddUserPayload, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { email, password, profile } = req.body || {};

  const usernameMessages: LanguageMessages = {
    'string.min': 'The field username must have 6 characters minimum',
    'string.max': 'The field username must have 60 characters maximum',
  };
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
  const roleMessages: LanguageMessages = {
    'any.required': 'The field role is required',
    'any.only': 'Please enter a valid role',
    'string.min': 'The field role must have 5 characters minimum',
    'string.max': 'The field role must have 13 characters maximum',
  };
  const session = req.currentSession;

  const schema = Joi.object<AddUserPayload>({
    email: Joi.string().min(3).max(320).email().required().messages(emailMessages),
    password: Joi.string().min(6).max(128).required().messages(passwordMessages),
    profile: {
      username: Joi.string().min(6).max(60).messages(usernameMessages),
      role: Joi.string().min(5).max(13).valid(USER_ROLES.admin, USER_ROLES.clerk, USER_ROLES.manager).required().messages(roleMessages),
    },
  });
  const { error, value } = schema.validate({ email, password, profile });
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

export const getUsers = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const users = await userBusiness.getUsers();
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ users });
};

export const invalidateToken = async (req: ExtendedRequest<{ userId: string }, ParamsDictionary>, res: Response, next: NextFunction) => {
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

export const deleteUser = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
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

type EditUserPayload = Pick<IUserDocument, 'email' | 'profile' | 'password'> & { currentPassword?: string };
interface JoiSchema {
  params: {
    userId: string;
  };
  body: EditUserPayload;
}
export const editUser = async (req: ExtendedRequest<EditUserPayload, ParamsDictionary>, res: Response, next: NextFunction) => {
  const body = req.body;
  const userIdMessages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const usernameMessages: LanguageMessages = {
    'string.min': 'The field username must have 6 characters minimum',
    'string.max': 'The field username must have 60 characters maximum',
  };
  const emailMessages: LanguageMessages = {
    'string.email': 'Please enter a valid email',
    'string.max': 'The field email must have 320 characters maximum',
  };
  const passwordMessages: LanguageMessages = {
    'string.min': 'The field password must have 6 characters minimum',
    'string.max': 'The field password must have 128 characters maximum',
  };
  const currentPasswordMessages: LanguageMessages = {
    'any.required': 'The field current password is required',
    'string.min': 'The field password must have 6 characters minimum',
    'string.max': 'The field password must have 128 characters maximum',
  };
  const roleMessages: LanguageMessages = {
    'any.only': 'Please enter a valid role',
    'string.min': 'The field role must have 5 characters minimum',
    'string.max': 'The field role must have 13 characters maximum',
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
      email: Joi.string().min(5).max(320).email().messages(emailMessages),
      password: Joi.string().min(6).max(128).messages(passwordMessages),
      profile: {
        username: Joi.string().min(6).max(60).messages(usernameMessages),
        role: Joi.string().min(5).max(13).valid(USER_ROLES.admin, USER_ROLES.clerk, USER_ROLES.manager).messages(roleMessages),
        picture: Joi.string().allow('', null).min(50).max(2000),
      },
      currentPassword: Joi.string()
        .min(6)
        .max(128)
        .when('password', {
          is: Joi.exist(),
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages(currentPasswordMessages),
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
export const getOneUser = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
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

type GetTeamUsersParams = API_TYPES.Routes['business']['users']['getByTeam'];
type GetTeamUsersQuery = API_TYPES.Routes['params']['users']['getByTeam'];
interface GetTeamUsersSchema {
  params: GetTeamUsersParams;
  query: GetTeamUsersQuery;
}
export const getTeamUsers = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetTeamUsersParams;
  const query = req.query as unknown as GetTeamUsersQuery;
  const teamIdMessages: LanguageMessages = {
    'any.required': 'Please provide a team id',
    'string.pattern.base': 'Please provide a valid team id',
  };
  const schema = Joi.object<GetTeamUsersSchema>({
    params: {
      teamId: Joi.string().regex(regex.mongoId).required().messages(teamIdMessages),
    },
    query: {
      email: Joi.string(),
    },
  });
  const session = req.currentSession;

  const { error, value } = schema.validate({ params, query }, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const users = await userBusiness.getTeamUsers({ teamId: value.params.teamId, email: value.query.email });
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ users: users || [] });
};

interface InviteUserPayload {
  email: string;
  role: USER_ROLES;
}
export const inviteUserCtrl = async (req: ExtendedRequest<InviteUserPayload, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { email, role } = req.body || {};

  const emailMessages: LanguageMessages = {
    'any.required': 'The field email is required',
    'string.email': 'Please enter a valid email',
    'string.max': 'The field email must have 320 characters maximum',
  };
  const roleMessages: LanguageMessages = {
    'any.required': 'The field role is required',
    'any.only': 'Please enter a valid role',
    'string.min': 'The field role must have 5 characters minimum',
    'string.max': 'The field role must have 13 characters maximum',
  };
  const session = req.currentSession;

  const schema = Joi.object<{ email: string; role: USER_ROLES }>({
    email: Joi.string().email().required().messages(emailMessages),
    role: Joi.string().valid(USER_ROLES.clerk, USER_ROLES.manager).required().messages(roleMessages),
  });
  const { error, value } = schema.validate({ email, role });
  if (error) {
    return handleError({ error, next, currentSession: session });
  } else if (value) {
    const { error, link } = await userBusiness.inviteUser(value);
    if (error && !link) {
      return handleError({ error, next, currentSession: session });
    }
    if (session) {
      await session.endSession();
    }
    res.status(HTTP_STATUS_CODES.CREATED).json({ link });
  }
};
