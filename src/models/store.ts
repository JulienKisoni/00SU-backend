import { Model, Schema, UpdateQuery, UpdateWriteOpResult, model } from 'mongoose';
import { IAddress, IStoreDocument } from '../types/models';
import { GenericError, createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type IStoreSchema = Omit<IStoreDocument, 'ownerDetails'>;
export interface IStoreMethods extends IStoreDocument {
  updateSelf?: (update: UpdateQuery<IStoreDocument>) => Promise<UpdateWriteOpResult>;
}

export interface IStoreStatics extends Model<IStoreDocument> {
  searchByKey: (key: 'name', value: string) => Promise<{ stores?: IStoreMethods[]; error?: GenericError }>;
}

const addressSchema = new Schema<IAddress>(
  {
    line1: {
      type: String,
      required: true,
      min: 10,
      max: 500,
    },
    line2: {
      type: String,
      min: 10,
      max: 500,
    },
    country: {
      type: String,
      required: true,
      min: 3,
      max: 100,
    },
    state: {
      type: String,
      required: true,
      min: 3,
      max: 100,
    },
    city: {
      type: String,
      required: true,
      min: 3,
      max: 100,
    },
  },
  { _id: false }, // <- important to avoid automatic _id for embedded docs
);

const storeSchema = new Schema<IStoreSchema>(
  {
    name: {
      type: String,
      required: true,
      min: 3,
      max: 100,
    },
    description: {
      type: String,
      required: true,
      min: 6,
      max: 500,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    active: {
      type: Boolean,
      required: true,
    },
    picture: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    methods: {
      async updateSelf(update: UpdateQuery<IStoreDocument>): Promise<UpdateWriteOpResult> {
        return StoreModel.updateOne({ _id: this._id }, update);
      },
    },
    statics: {
      async searchByKey(key: 'name', value: string): Promise<{ stores?: IStoreMethods[]; error?: GenericError }> {
        const allowedKeys = ['name'];
        if (!allowedKeys.includes(key)) {
          const error = createError({
            statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
            message: 'Invalid search key',
            publicMessage: 'Something went wrong',
          });
          return { error };
        }

        const query = {
          [key]: { $regex: value, $options: 'i' }, // case-insensitive partial match
        };

        const stores = await this.find(query).exec();
        return { stores };
      },
    },
  },
);

storeSchema.index({ teamId: 1 });
storeSchema.index({ owner: 1 });
storeSchema.index({ _id: 1, teamId: 1 });
storeSchema.index({ name: 1 });

export const StoreModel = model<IStoreMethods, IStoreStatics>('Store', storeSchema, 'Stores');
