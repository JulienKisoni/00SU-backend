import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { PipelineStage, Types } from 'mongoose';

import { GeneralResponse, IGraphicDocument, IStoreDocument, IUserDocument } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { GraphicModel } from '../models/graphic';
import { HistoryModel } from '../models/History';
import { transformUser } from './users';

type TransformKeys = keyof IGraphicDocument;
interface ITransformGraphic {
  excludedFields: TransformKeys[];
  graphic: IGraphicDocument;
}
const transformGraphic = ({ graphic, excludedFields }: ITransformGraphic): Partial<IGraphicDocument> => {
  if (graphic.generatedBy && typeof graphic.generatedBy === 'object') {
    const user = graphic.generatedBy as unknown as IUserDocument;
    graphic.ownerDetails = transformUser({ user, excludedFields: ['password', 'private'] });
    graphic.generatedBy = user._id;
  }
  if (graphic.storeId && typeof graphic.storeId === 'object') {
    const store = graphic.storeId as unknown as IStoreDocument;
    graphic.storeDetails = store;
    graphic.storeId = store._id;
  }
  return omit(graphic, excludedFields);
};

type AddGraphicBody = API_TYPES.Routes['body']['graphics']['add'];
interface AddGraphicParams {
  userId?: string;
  storeId?: string;
  teamId?: string;
  body: AddGraphicBody;
}
type AddGraphicResponse = Promise<GeneralResponse<{ graphicId: string }>>;
export const addGraphic = async (params: AddGraphicParams): AddGraphicResponse => {
  const { userId, storeId, body, teamId } = params;

  if (!userId || !storeId || !teamId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: 'Missing required data with the request',
      publicMessage: 'Please, make sure you are logged in',
    });
    return { error };
  }

  const histories = await HistoryModel.find({ productId: { $in: body.productsIDs } })
    .lean()
    .exec();

  const historyIDs = histories?.map((history) => history._id.toString());

  if (!historyIDs?.length) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
      message: `No histories for products : ${body.productsIDs}`,
      publicMessage: 'Please, make sure all products have histories',
    });
    return { error };
  }

  const payload = {
    name: body.name,
    description: body.description,
    teamId,
    storeId,
    histories: historyIDs,
    generatedBy: userId,
  };
  const graphic = await GraphicModel.create(payload);

  return { data: { graphicId: graphic._id.toString() } };
};

type GetAllReportsResponse = Promise<GeneralResponse<{ graphics: Partial<IGraphicDocument>[] }>>;
export const getAllGraphics = async ({ teamId, storeId }: { teamId: string; storeId: string }): GetAllReportsResponse => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        teamId: new Types.ObjectId(teamId),
        storeId: new Types.ObjectId(storeId),
      },
    },
    {
      $lookup: {
        from: 'Histories',
        localField: 'histories',
        foreignField: '_id',
        as: 'histories',
      },
    },
  ];
  const results = await GraphicModel.aggregate<IGraphicDocument>(pipeline).hint({ teamId: 1, storeId: 1 });
  const graphics = results.map((graphic) => transformGraphic({ graphic, excludedFields: ['__v'] }));
  return { data: { graphics } };
};

interface GetOneGraphicPayload {
  graphic?: IGraphicDocument;
  userId?: string;
  graphicId?: string;
}
type GetOneOrderResponse = Promise<GeneralResponse<{ graphic: Partial<IGraphicDocument> }>>;
export const getOneGraphic = async (payload: GetOneGraphicPayload): GetOneOrderResponse => {
  const { graphic, graphicId } = payload;
  if (!graphic) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No graphic found (${graphicId})`,
      publicMessage: 'Could not found graphic',
    });
    return { error };
  }
  const _graphic = await GraphicModel.findById(graphicId).populate(['histories', 'storeId', 'generatedBy']).lean().exec();
  const newGraphic = transformGraphic({ graphic: _graphic as IGraphicDocument, excludedFields: ['__v'] });
  return { data: { graphic: newGraphic } };
};

type DeleteOneGraphicParams = API_TYPES.Routes['params']['graphics']['deleteOne'];
type DeleteOneGraphicResponse = Promise<GeneralResponse<undefined>>;
interface DeleteOneGraphicPayload {
  params: DeleteOneGraphicParams;
  graphic?: IGraphicDocument;
}
export const deleteOne = async (payload: DeleteOneGraphicPayload): DeleteOneGraphicResponse => {
  const { params, graphic } = payload;
  const { graphicId } = params;
  if (!graphic || graphic._id.toString() !== graphicId) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find corresponding graphic (${graphicId})`,
      publicMessage: 'This graphic does not exist',
    });
    return { error };
  }
  await GraphicModel.findByIdAndDelete(graphicId);
  return { error: undefined, data: undefined };
};

type UpdateOneGraphicBody = API_TYPES.Routes['body']['graphics']['updateOne'];
type UpdateOneGraphicResponse = Promise<GeneralResponse<{ graphic: Partial<IGraphicDocument> }>>;
interface UpdateGraphicPayload {
  body: UpdateOneGraphicBody | undefined;
  graphicId: string;
}
export const updateOne = async (payload: UpdateGraphicPayload): UpdateOneGraphicResponse => {
  const { body, graphicId } = payload;

  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body associated with the request',
      publicMessage: 'Please add valid fields to your request body',
    });
    return { error };
  }
  const newGraphic = await GraphicModel.findByIdAndUpdate(graphicId, { $set: { ...body } }, { new: true })
    .lean()
    .exec();
  if (!newGraphic?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find graphic (${graphicId})`,
      publicMessage: 'This graphic does not exist',
    });
    return { error };
  }
  const transformed = transformGraphic({ graphic: newGraphic, excludedFields: ['__v'] });
  return { data: { graphic: transformed } };
};
