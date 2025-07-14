import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { PipelineStage, Types } from 'mongoose';

import { GeneralResponse, IEvolution, IHistoryDocument, IProductDocument, IReportDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { ReportModel } from '../models/report';
import { HistoryModel } from 'src/models/History';

type TransformKeys = keyof IReportDocument;
interface ITransformReport {
  excludedFields: TransformKeys[];
  report: IReportDocument;
}
const transformReport = ({ report, excludedFields }: ITransformReport): Partial<IReportDocument> => {
  return omit(report, excludedFields);
};

type AddHistoryBody = API_TYPES.Routes['body']['histories']['add'];
interface AddReportParams {
  userId?: string;
  teamId?: string;
  storeId?: string;
  product?: IProductDocument;
  body: AddHistoryBody;
}
type AddHistoryResponse = Promise<GeneralResponse<string>>;
export const addHistory = async (params: AddReportParams): AddHistoryResponse => {
  const { userId, body, teamId, storeId, product } = params;

  if (!userId || !teamId || !storeId || !product) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Missing required data with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }

  const data: Partial<IHistoryDocument> = {
    productId: product._id,
    productName: product.name,
    evolutions: [],
    teamId,
    storeId,
  };
  pushEvolution(body.quantity, data, userId);
  const history = await HistoryModel.create(data);
  return { data: history._id.toString() };
};

type GetAllReportsResponse = Promise<GeneralResponse<{ reports: Partial<IReportDocument>[] }>>;
export const getAllReports = async ({ teamId }: { teamId: string }): GetAllReportsResponse => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        teamId: new Types.ObjectId(teamId),
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

const generateDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const fullDate = `${y}-${m}-${d}`;
  return fullDate;
};

const isNewDateKey = (dateKey: string, evolutions: IEvolution[]): boolean => {
  return !evolutions.some((evolution) => evolution.dateKey === dateKey);
};
const pushEvolution = (quantity: number, history: Partial<IHistoryDocument>, userId: string): void => {
  const date = history.createdAt ? new Date(history.createdAt) : new Date();
  const dateKey = generateDateKey(date);
  const evolution: IEvolution = {
    date: date.toISOString(),
    dateKey,
    quantity,
    collectedBy: userId,
  };
  if (!history.evolutions) {
    history.evolutions = [];
  }
  history.evolutions.push(evolution);
};
const unshiftEvolution = (quantity: number, date: Date, userId: string, evolutions: IEvolution[]): void => {
  const dateKey = generateDateKey(date);
  if (isNewDateKey(dateKey, evolutions)) {
    const evolution: IEvolution = {
      date: date.toISOString(),
      dateKey,
      quantity,
      collectedBy: userId,
    };
    evolutions.unshift(evolution);
  }
};
interface GetOneHistoryPayload {
  productId: string;
  storeId: string;
  teamId: string;
}
type GetOneHistoryResponse = Promise<GeneralResponse<IHistoryDocument | null>>;
export const getOneByProductId = async (payload: GetOneHistoryPayload): GetOneHistoryResponse => {
  const { storeId, productId, teamId } = payload;
  const history = await HistoryModel.findOne({ productId, storeId, teamId }).exec();
  return { data: history };
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
