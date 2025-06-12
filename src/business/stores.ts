import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { UpdateQuery } from 'mongoose';

import { IUserMethods, UserModel } from '../models/user';
import { IStoreMethods, StoreModel } from '../models/store';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { IStoreDocument, IUserDocument, RetreiveOneFilters } from '../types/models';
import { transformUser } from './users';

const retrieveStore = async (filters: RetreiveOneFilters<IStoreDocument>): Promise<IStoreDocument | null> => {
  const store = (await StoreModel.findOne(filters).populate({ path: 'owner' }).lean().exec()) as IStoreDocument;
  if (!store || store === null) {
    return null;
  }
  const ownerDetails = store.owner as unknown as IUserDocument;
  const owner = ownerDetails._id.toString();

  store.ownerDetails = transformUser({ user: ownerDetails, excludedFields: ['__v', 'private', 'password'] });
  store.owner = owner;

  return store;
};

type AddStorePayload = API_TYPES.Routes['business']['stores']['addStore'];
type AddStoreResponse = Promise<{ storeId?: string; error?: GenericError }>;
export const addStore = async ({ userId, name, description, active }: AddStorePayload): AddStoreResponse => {
  const user = await UserModel.findById<IUserMethods>(userId).exec();
  if (!user || !user._id || !user?.updateSelf) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No user with this specific id (${userId})`,
      publicMessage: 'User does not exist',
    });
    return { error };
  }
  const store = await StoreModel.create({
    owner: userId,
    name,
    description,
    active,
  });
  const storeId = store._id.toString();
  await user.updateSelf({ $push: { storeIds: storeId } });
  return { storeId };
};

type GetStoresResponse = Promise<{ stores: Partial<IStoreDocument>[] }>;
export const getStores = async (): GetStoresResponse => {
  const stores = await StoreModel.find({}).lean().exec();
  const transformed = stores.map((store) => omit(store, ['__v']));
  return { stores: transformed };
};

type DeleteStorePayload = API_TYPES.Routes['business']['stores']['deleteStore'];
interface DeleteStoreReturn {
  error?: GenericError;
}
export const deleteStore = async ({ storeId }: DeleteStorePayload): Promise<DeleteStoreReturn> => {
  const store = await StoreModel.findByIdAndDelete(storeId).exec();
  const user = await UserModel.findById<IUserMethods>(store?.owner).exec();
  if (!store?._id || !user?._id || !user.updateSelf) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `No store with associated id (${storeId})`,
      publicMessage: 'Store does not exist',
    });
    return { error };
  }
  await user.updateSelf({ $pull: { storeIds: store._id } });
  return { error: undefined };
};

type EditStoreBody = API_TYPES.Routes['business']['stores']['editStore'];
interface EditStorePayload {
  storeId: string;
  body: EditStoreBody;
}

type EditStoreResponse = { error?: GenericError };
export const editStore = async ({ storeId, body }: EditStorePayload): Promise<EditStoreResponse> => {
  const store = await StoreModel.findById<IStoreMethods>(storeId).exec();
  if (!store?._id || !store?.updateSelf) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Store not found (${storeId})`,
      publicMessage: 'Store does not exist',
    });
    return { error };
  }
  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `No body associated with the request`,
      publicMessage: 'Please provide valid fields to update',
    });
    return { error };
  }
  const update: UpdateQuery<IStoreDocument> = {};
  const entries = Object.entries(body);
  entries.forEach((entry) => {
    const [key, value] = entry;
    update[key] = value;
  });

  await store.updateSelf(update);
  return { error: undefined };
};

type GetOneStorePayload = API_TYPES.Routes['business']['stores']['getOne'];
interface GetOneUserResponse {
  error?: GenericError;
  store?: IStoreDocument;
}
export const getOne = async ({ storeId }: GetOneStorePayload): Promise<GetOneUserResponse> => {
  const store = await retrieveStore({ _id: storeId });
  if (!store?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `User with id ${storeId} does not exist `,
      publicMessage: 'No store found',
    });
    return { error };
  }
  return { store };
};
