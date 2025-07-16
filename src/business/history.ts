import omit from 'lodash.omit';
import cloneDeep from 'lodash.clonedeep';

import { GeneralResponse, IEvolution, IProductDocument, IHistoryDocument } from '../types/models';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { HistoryModel } from '../models/History';

type TransformKeys = keyof IHistoryDocument;
interface ITransformHistory {
  excludedFields: TransformKeys[];
  history: IHistoryDocument;
}
const transformHistory = ({ history, excludedFields }: ITransformHistory): Partial<IHistoryDocument> => {
  return omit(history, excludedFields);
};

type AddHistoryBody = API_TYPES.Routes['body']['histories']['add'];
interface AddHistoryParams {
  userId?: string;
  teamId?: string;
  storeId?: string;
  product?: IProductDocument;
  body: AddHistoryBody;
}
type AddHistoryResponse = Promise<GeneralResponse<string>>;
export const addHistory = async (params: AddHistoryParams): AddHistoryResponse => {
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

const generateDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const fullDate = `${y}-${m}-${d}`;
  return fullDate;
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

type UpdateOneHistoryBody = API_TYPES.Routes['body']['histories']['updateOne'];
type UpdateOneHistoryResponse = Promise<GeneralResponse<Partial<IHistoryDocument>>>;
interface UpdateOneReportPayload {
  body: UpdateOneHistoryBody | undefined;
  history: IHistoryDocument;
  userId?: string;
}
export const updateOne = async (payload: UpdateOneReportPayload): UpdateOneHistoryResponse => {
  const { body, history, userId } = payload;
  if (!userId || !body) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Missing required data with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }

  const { evolution } = body;
  const actualHistory = cloneDeep(history);

  const newEvolution: IEvolution = {
    ...evolution,
    collectedBy: userId,
  };
  const keyIndex = actualHistory.evolutions.findIndex((evolution) => evolution.dateKey === evolution.dateKey);
  if (keyIndex !== -1) {
    actualHistory.evolutions.splice(keyIndex, 1, newEvolution);
    // Update
  } else {
    // Push
    actualHistory.evolutions.push(newEvolution);
  }
  const update: Partial<IHistoryDocument> = {
    ...actualHistory,
  };
  delete update._id;
  delete update.createdAt;
  delete update.updatedAt;

  const newHistory = await HistoryModel.findByIdAndUpdate(history._id, { $set: { ...update } }, { new: true }).exec();
  if (!newHistory?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find history (${history._id})`,
      publicMessage: 'This history does not exist',
    });
    return { error };
  }
  const transformed = transformHistory({ history: newHistory, excludedFields: ['__v'] });
  return { data: transformed };
};

interface WriteHistory {
  userId?: string;
  storeId?: string;
  teamId?: string;
  product?: IProductDocument;
  quantity: number;
}

export const writeHistory = async ({
  userId,
  storeId,
  teamId,
  product,
  quantity,
}: WriteHistory): Promise<GeneralResponse<Partial<IHistoryDocument> | string>> => {
  let error: GenericError | undefined;
  let data: Partial<IHistoryDocument> | undefined | string;
  if (!userId || !teamId || !storeId || !product || isNaN(quantity)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Missing required data with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }
  const { error: error1, data: history } = await getOneByProductId({ productId: product._id.toString(), storeId, teamId });

  if (history && !error1) {
    const date = new Date();
    const payload: UpdateOneReportPayload = {
      body: {
        evolution: {
          date: date.toISOString(),
          dateKey: generateDateKey(date),
          quantity,
        },
      },
      history,
      userId,
    };
    const { data: data1, error: error2 } = await updateOne(payload);
    data = data1;
    error = error2;
  } else if (!history && !error1) {
    const params: AddHistoryParams = {
      userId,
      teamId,
      storeId,
      product,
      body: {
        quantity,
      },
    };
    const { data: data2, error: error3 } = await addHistory(params);
    data = data2;
    error = error3;
  } else {
    error = error1;
  }
  return { error, data };
};
