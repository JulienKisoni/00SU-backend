import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { regex } from '../helpers/constants';
import { ExtendedRequest, IStoreDocument } from '../types/models';
import { createError, handleError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import * as storeBusiness from '../business/stores';

type AddStoreBody = Pick<IStoreDocument, 'name' | 'description' | 'active'>;
interface AddStoreJoiSchema {
  params: {
    userId: string;
  };
  body: AddStoreBody;
}
export const addStore = async (req: ExtendedRequest<AddStoreBody>, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  const session = req.currentSession;
  const body = req.body;
  if (!userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'NO user associated with the request',
      publicMessage: 'Please make sure you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  if (!body) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No body associated with the request',
      publicMessage: 'Please provide a body with your request',
    });
    return handleError({ error, next, currentSession: session });
  }
  const userIdMessages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const nameMessages: LanguageMessages = {
    'any.required': 'Please provide a store name',
    'string.min': 'The field name must have 6 characters mininum',
  };
  const descriptionMessages: LanguageMessages = {
    'any.required': 'Please provide a store description',
    'string.min': 'The field description must have 12 characters mininum',
    'string.max': 'The field description must have 100 characters maximum',
  };
  const activeMessages: LanguageMessages = {
    'any.required': 'The field active is required',
  };
  const payload: AddStoreJoiSchema = {
    params: {
      userId,
    },
    body,
  };
  const schema = Joi.object<AddStoreJoiSchema>({
    params: {
      userId: Joi.string().regex(regex.mongoId).required().messages(userIdMessages),
    },
    body: {
      name: Joi.string().min(6).required().messages(nameMessages),
      description: Joi.string().min(6).max(100).required().messages(descriptionMessages),
      active: Joi.bool().required().messages(activeMessages),
    },
  });
  const { error, value } = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { storeId, error: err } = await storeBusiness.addStore({ ...value.params, ...value.body });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json({ storeId });
};

export const getStores = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const { stores } = await storeBusiness.getStores();
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ stores });
};

interface DeleteStoreSchema {
  storeId: string;
}
export const deleteStore = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as DeleteStoreSchema;
  const session = req.currentSession;
  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a storeId',
    'string.pattern.base': 'Please provide a valid storeId',
  };
  const schema = Joi.object<DeleteStoreSchema>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });
  const { error, value } = schema.validate(params);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err } = await storeBusiness.deleteStore({ storeId: value.storeId });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type EditStoreBody = API_TYPES.Routes['business']['stores']['editStore'];
type EditStoreParams = {
  storeId: string;
};
interface EditStoreSchema {
  params: EditStoreParams;
  body: EditStoreBody;
}
export const editStore = async (req: ExtendedRequest<EditStoreBody>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as EditStoreParams;
  const storeIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid store id',
  };
  const nameMessages: LanguageMessages = {
    'string.min': 'The field name must have 6 characters mininum',
  };
  const descriptionMessages: LanguageMessages = {
    'string.min': 'The field description must have 12 characters mininum',
    'string.max': 'The field description must have 100 characters maximum',
  };
  const session = req.currentSession;
  const schema = Joi.object<EditStoreSchema>({
    params: {
      storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
    },
    body: {
      name: Joi.string().min(6).messages(nameMessages),
      description: Joi.string().min(6).max(100).messages(descriptionMessages),
      active: Joi.bool(),
    },
  });
  const payload = {
    params,
    body: req.body,
  };
  const { error, value } = schema.validate(payload, { abortEarly: true, stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err } = await storeBusiness.editStore({ storeId: value.params.storeId, body: value.body });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type GetOneStorePayload = API_TYPES.Routes['business']['stores']['getOne'];
export const getOneStore = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneStorePayload;
  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a store id',
    'string.pattern.base': 'Please provide a valid store id',
  };
  const schema = Joi.object<GetOneStorePayload>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });

  const session = req.currentSession;

  const { error, value } = schema.validate(params, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: _error, store } = await storeBusiness.getOne({ storeId: value.storeId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ store });
};
