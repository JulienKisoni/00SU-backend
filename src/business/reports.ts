import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { PipelineStage, Types } from 'mongoose';

import { GeneralResponse, IReportDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ReportModel } from '../models/report';

type TransformKeys = keyof IReportDocument;
interface ITransformReport {
  excludedFields: TransformKeys[];
  report: IReportDocument;
}
const transformReport = ({ report, excludedFields }: ITransformReport): Partial<IReportDocument> => {
  return omit(report, excludedFields);
};

type AddReportBody = API_TYPES.Routes['body']['reports']['add'];
interface AddReportParams {
  userId?: string;
  teamId: string;
  body: AddReportBody;
}
type AddReportResponse = Promise<GeneralResponse<{ reportId: string }>>;
export const addReport = async (params: AddReportParams): AddReportResponse => {
  const { userId, body, teamId } = params;

  if (!userId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'No user associated with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }

  const report = await ReportModel.create({ ...body, generatedBy: userId, teamId });

  return { data: { reportId: report._id.toString() } };
};

type GetAllReportsResponse = Promise<GeneralResponse<{ reports: Partial<IReportDocument>[] }>>;
export const getAllReports = async ({ teamId, storeId }: { teamId: string; storeId: string }): GetAllReportsResponse => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        teamId: new Types.ObjectId(teamId),
        storeId: new Types.ObjectId(storeId),
      },
    },
    {
      $lookup: {
        from: 'Orders',
        localField: 'orders',
        foreignField: '_id',
        as: 'orders',
      },
    },
  ];
  const results = await ReportModel.aggregate<IReportDocument>(pipeline).hint({ teamId: 1 });
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
  const _report = await ReportModel.findById(reportId).populate('orders').lean().exec();
  const newReport = transformReport({ report: _report as IReportDocument, excludedFields: ['__v'] });
  return { data: { report: newReport } };
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
interface UpdateOneReportPayload {
  body: UpdateOneReportBody | undefined;
  reportId: string;
}
export const updateOne = async (payload: UpdateOneReportPayload): UpdateOneReportResponse => {
  const { body, reportId } = payload;

  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please add valid fields to your request body',
    });
    return { error };
  }
  const newReport = await ReportModel.findByIdAndUpdate(reportId, { $set: { ...body } }, { new: true })
    .lean()
    .exec();
  if (!newReport?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find report (${reportId})`,
      publicMessage: 'This report does not exist',
    });
    return { error };
  }
  const transformed = transformReport({ report: newReport, excludedFields: ['__v'] });
  return { data: { report: transformed } };
};
