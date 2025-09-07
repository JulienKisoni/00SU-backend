import { Response, NextFunction } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest, ParamsDictionary } from '../types/models';
import { regex } from '../helpers/constants';
import { createError, handleError } from '../middlewares/errors';
import * as reportBusiness from '../business/reports';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddReportBody = API_TYPES.Routes['body']['reports']['add'];
export const addReport = async (req: ExtendedRequest<AddReportBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  const teamId = req.user?.teamId.toString();

  const storeIdMessages: LanguageMessages = {
    'any.required': 'Please a storeId is required for your report',
    'string.pattern.base': 'Please provide a valid storeId for your report',
  };
  const ordersMessages: LanguageMessages = {
    'any.required': 'Please provide orders for your report',
    'number.min': 'Report should at least have 1 order',
  };
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product name for each item inside your report',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product description for each item inside your report',
  };

  const session = req?.currentSession;

  const schema = Joi.object<AddReportBody>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
    name: Joi.string().min(3).max(100).required().messages(nameMessages),
    description: Joi.string().min(6).max(500).required().messages(descriptionMessages),
    orders: Joi.array().items(Joi.string().regex(regex.mongoId)).min(1).required().messages(ordersMessages),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: true });

  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  if (!teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await reportBusiness.addReport({ body: value, userId, teamId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(data);
};

export const getAllReports = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const user = req.user;
  const teamId = user?.teamId?.toString();
  const session = req.currentSession;
  if (!teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No team associated with the request',
      publicMessage: 'Please make sur you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }

  const storeIdMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid storeId',
  };

  const schema = Joi.object<{ storeId: string }>({
    storeId: Joi.string().regex(regex.mongoId).required().messages(storeIdMessages),
  });
  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { data } = await reportBusiness.getAllReports({ teamId, storeId: value.storeId });
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type GetOneReportParams = API_TYPES.Routes['params']['reports']['getOne'];
export const getOneReport = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneReportParams;
  const { data, error } = await reportBusiness.getOneReport({ report: req.report, reportId: params.reportId, userId: req.user?._id.toString() });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type DeleteOneReportParams = API_TYPES.Routes['params']['reports']['deleteOne'];
export const deleteOne = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as DeleteOneReportParams;
  const { error } = await reportBusiness.deleteOne({ params, report: req.report });
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type UpdateOneReportBody = API_TYPES.Routes['body']['reports']['updateOne'];
type UpdateOneReportParams = API_TYPES.Routes['params']['reports']['getOne'];
export const updateOne = async (req: ExtendedRequest<UpdateOneReportBody, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as UpdateOneReportParams;
  const session = req.currentSession;
  if (!req?.user) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No user associated with the request',
      publicMessage: 'Please make sure you are logged in',
    });
    return handleError({ error, next, currentSession: session });
  }
  const storeId = req.report?.storeId?.toString();
  if (!storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'No store associated with the report',
      publicMessage: 'Please make sure store report exist',
    });
    return handleError({ error, next, currentSession: session });
  }
  const nameMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product name for each item inside your report',
  };
  const descriptionMessages: LanguageMessages = {
    'string.pattern.base': 'Please provide a valid product description for each item inside your report',
  };

  const schema = Joi.object<UpdateOneReportBody>({
    name: Joi.string().min(3).max(100).messages(nameMessages),
    description: Joi.string().min(6).max(500).messages(descriptionMessages),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await reportBusiness.updateOne({
    body: value,
    reportId: params.reportId,
  });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};
