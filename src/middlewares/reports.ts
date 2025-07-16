import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { regex } from '../helpers/constants';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ExtendedRequest, IUserDocument, ParamsDictionary } from '../types/models';
import { handleError, createError } from './errors';
import { ReportModel } from '../models/report';

type GetOneOrderParams = API_TYPES.Routes['params']['reports']['getOne'];

export const isTeamReport = async (req: ExtendedRequest<undefined, ParamsDictionary>, _res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneOrderParams;
  const reportIdMessages: LanguageMessages = {
    'any.required': 'Please provide a reportId',
    'string.pattern.base': 'Please provide a valid reportId',
  };
  const session = req.currentSession;
  const schema = Joi.object<GetOneOrderParams>({
    reportId: Joi.string().regex(regex.mongoId).required().messages(reportIdMessages),
  });

  const { error, value } = schema.validate(params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { reportId } = value;
  const { _id, teamId } = req.user || ({} as IUserDocument);
  const userId = _id.toString();
  const storeId = req.storeId?.toString();
  if (!reportId || !userId || !teamId || !storeId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `Either no user, userId, storeId or reportId`,
      publicMessage: 'Resource not found',
    });
    return next(error);
  }
  const report = await ReportModel.findOne({ _id: reportId, teamId, storeId }).lean().exec();
  if (!report?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.FORBIDDEN,
      message: `User ${userId} may not be the owner of the report (${reportId})`,
      publicMessage: 'Please make sure the report exist and you are the owner',
    });
    return handleError({ error, next, currentSession: session });
  }
  req.isTeamReport = true;
  req.report = report;
  next();
};
