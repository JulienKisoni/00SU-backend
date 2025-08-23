import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { regex } from '../helpers/constants';
import { ExtendedRequest, IStoreDocument, ParamsDictionary } from '../types/models';
import { createError, handleError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import * as storeBusiness from '../business/stores';

type AddStoreBody = Pick<IStoreDocument, 'name' | 'description' | 'active' | 'address' | 'picture'>;
interface AddStoreJoiSchema {
  params: {
    userId: string;
  };
  body: AddStoreBody;
}
export const addStore = async (req: ExtendedRequest<AddStoreBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const user = req.user;
  const session = req.currentSession;
  const body = req.body;
  if (!user) {
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
  const userId = user._id.toString();
  const userIdMessages: LanguageMessages = {
    'any.required': 'Please provide a user id',
    'string.pattern.base': 'Please provide a valid user id',
  };
  const nameMessages: LanguageMessages = {
    'any.required': 'Please provide a store name',
    'string.min': 'The field name must have 3 characters minimum',
    'string.max': 'The field description must have 100 characters maximum',
  };
  const descriptionMessages: LanguageMessages = {
    'any.required': 'Please provide a store description',
    'string.min': 'The field description must have 6 characters minimum',
    'string.max': 'The field description must have 500 characters maximum',
  };
  const activeMessages: LanguageMessages = {
    'any.required': 'The field active is required',
  };
  const line1Messages: LanguageMessages = {
    'any.required': 'Please provide a address line 1',
    'string.min': 'The field line1 must have 10 characters minimum',
    'string.max': 'The field line1 must have 500 characters maximum',
  };
  const line2Messages: LanguageMessages = {
    'string.min': 'The field line2 must have 10 characters minimum',
    'string.max': 'The field line2 must have 500 characters maximum',
  };
  const cityMessages: LanguageMessages = {
    'any.required': 'Please provide a city',
    'string.min': 'The field city must have 3 characters minimum',
    'string.max': 'The field city must have 100 characters maximum',
  };
  const stateMessages: LanguageMessages = {
    'any.required': 'Please provide a state',
    'string.min': 'The field state must have 2 characters minimum',
    'string.max': 'The field state must have 100 characters maximum',
  };
  const countryMessages: LanguageMessages = {
    'any.required': 'Please provide a country',
    'string.min': 'The field country must have 3 characters minimum',
    'string.max': 'The field country must have 100 characters maximum',
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
      picture: Joi.string().allow('', null).min(50).max(2000),
      address: Joi.object({
        line1: Joi.string().required().min(10).max(500).messages(line1Messages),
        line2: Joi.string().allow('').min(10).max(500).messages(line2Messages),
        country: Joi.string().required().min(3).max(100).messages(countryMessages),
        city: Joi.string().required().min(3).max(100).messages(cityMessages),
        state: Joi.string().required().min(2).max(100).messages(stateMessages),
      }).required(),
    },
  });
  const { error, value } = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { storeId, error: err } = await storeBusiness.addStore({ ...value.params, ...value.body, teamId: user.teamId.toString() });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json({ storeId });
};

export const getStores = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const teamId = user.teamId;
  const { stores } = await storeBusiness.getStores(teamId.toString());
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ stores });
};

interface DeleteStoreSchema {
  storeId: string;
}
export const deleteStore = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
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
export const editStore = async (req: ExtendedRequest<EditStoreBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as EditStoreParams;
  const storeIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid store id',
  };
  const nameMessages: LanguageMessages = {
    'string.min': 'The field name must have 6 characters minimum',
  };
  const descriptionMessages: LanguageMessages = {
    'string.min': 'The field description must have 12 characters minimum',
    'string.max': 'The field description must have 100 characters maximum',
  };
  const line1Messages: LanguageMessages = {
    'string.min': 'The field line1 must have 10 characters minimum',
    'string.max': 'The field line1 must have 500 characters maximum',
  };
  const line2Messages: LanguageMessages = {
    'string.min': 'The field line2 must have 10 characters minimum',
    'string.max': 'The field line2 must have 500 characters maximum',
  };
  const cityMessages: LanguageMessages = {
    'string.min': 'The field city must have 3 characters minimum',
    'string.max': 'The field city must have 100 characters maximum',
  };
  const stateMessages: LanguageMessages = {
    'string.min': 'The field state must have 2 characters minimum',
    'string.max': 'The field state must have 100 characters maximum',
  };
  const countryMessages: LanguageMessages = {
    'string.min': 'The field country must have 3 characters minimum',
    'string.max': 'The field country must have 100 characters maximum',
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
      picture: Joi.string().allow('', null).min(50).max(2000),
      address: Joi.object({
        line1: Joi.string().required().min(10).max(500).messages(line1Messages),
        line2: Joi.string().allow('').min(10).max(500).messages(line2Messages),
        country: Joi.string().required().min(3).max(100).messages(countryMessages),
        city: Joi.string().required().min(3).max(100).messages(cityMessages),
        state: Joi.string().required().min(2).max(100).messages(stateMessages),
      }),
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
export const getOneStore = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneStorePayload;
  const session = req.currentSession;
  const { user } = req;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please provide a store id',
    'string.pattern.base': 'Please provide a valid store id',
  };
  const schema = Joi.object<GetOneStorePayload>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });

  const { error, value } = schema.validate(params, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: _error, store } = await storeBusiness.getOne({ storeId: value.storeId, teamId: user.teamId.toString() });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ store });
};
