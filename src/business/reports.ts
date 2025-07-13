import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';

import { GeneralResponse, IReportDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ReportModel } from 'src/models/report';

type TransformKeys = keyof IReportDocument;
interface ITransformReport {
  excludedFields: TransformKeys[];
  report: IReportDocument;
}
const transformReport = ({ report, excludedFields }: ITransformReport): Partial<IReportDocument> => {
  return omit(report, excludedFields);
};

type AddReportBody = API_TYPES.Routes['body']['reports']['add'];
interface AddOrderParams {
  userId?: string;
  body: AddReportBody;
}
type AddReportResponse = Promise<GeneralResponse<{ reportId: string }>>;
export const addReport = async (params: AddOrderParams): AddReportResponse => {
  const { userId, body } = params;

  if (!userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'No user associated with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }

  const report = await ReportModel.create({ ...body, generatedBy: userId });

  return { data: { reportId: report._id.toString() } };
};

type GetAllReportsResponse = Promise<GeneralResponse<{ reports: Partial<IReportDocument>[] }>>;
export const getAllReports = async ({ teamId }: { teamId: string }): GetAllReportsResponse => {
  const results = await ReportModel.find({ teamId }).lean().exec();
  const reports = results.map((report) => transformReport({ report, excludedFields: ['__v'] }));
  return { data: { reports } };
};

interface GetOneReportPayload {
  report?: IReportDocument;
  userId?: string;
  reportId?: string;
}
type GetOneOrderResponse = Promise<GeneralResponse<{ report: Partial<IReportDocument> }>>;
export const getOneReport = async (payload: GetOneReportPayload): GetOneOrderResponse => {
  const { report, reportId } = payload;
  if (!report) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No report found (${reportId})`,
      publicMessage: 'Could not found report',
    });
    return { error };
  }
  const newOrder = transformReport({ report, excludedFields: ['__v'] });
  return { data: { report: newOrder } };
};

type DeleteOneReportParams = API_TYPES.Routes['params']['reports']['deleteOne'];
type DeleteOneReportResponse = Promise<GeneralResponse<undefined>>;
interface DeleteOneOrderPayload {
  params: DeleteOneReportParams;
  report?: IReportDocument;
}
export const deleteOne = async (payload: DeleteOneOrderPayload): DeleteOneReportResponse => {
  const { params, report } = payload;
  const { reportId } = params;
  if (!report || report._id.toString() !== reportId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find corresponding report (${reportId})`,
      publicMessage: 'This report does not exist',
    });
    return { error };
  }
  await ReportModel.findByIdAndDelete(reportId);
  return { error: undefined, data: undefined };
};

type UpdateOneReportBody = API_TYPES.Routes['body']['reports']['updateOne'];
type UpdateOneReportResponse = Promise<GeneralResponse<{ report: Partial<IReportDocument> }>>;
interface UpdateOneOrderPayload {
  body: UpdateOneReportBody | undefined;
  reportId: string;
  report?: IReportDocument;
}
export const updateOne = async (payload: UpdateOneOrderPayload): UpdateOneReportResponse => {
  const { body, reportId, report } = payload;

  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please add valid fields to your request body',
    });
    return { error };
  }
  const { description, name } = body;
  const keys = Object.keys(body);

  if (items && !items?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No items associated with the request',
      publicMessage: 'Please add valid items to your report',
    });
    return { error };
  }

  const _items = items || report?.items;

  const { data, error } = await prepareOrderPayload({ items: _items, userId, storeId, teamId });
  if (error) {
    return { error };
  }
  const value = data?.payload;
  const newOrder = await ReportModel.findByIdAndUpdate(reportId, value, { new: true }).lean().exec();
  if (!newOrder?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find report (${reportId})`,
      publicMessage: 'This report does not exist',
    });
    return { error };
  }
  const transformed = transformReport({ report: newOrder, excludedFields: ['__v'] });
  return { data: { report: transformed } };
};
