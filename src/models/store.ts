import { Model, Schema, UpdateQuery, UpdateWriteOpResult, model } from 'mongoose';
import { IStoreDocument } from '../types/models';

type IStoreSchema = Omit<IStoreDocument, 'ownerDetails'>;
export interface IStoreMethods extends IStoreDocument {
  updateSelf?: (update: UpdateQuery<IStoreDocument>) => Promise<UpdateWriteOpResult>;
}

export interface IStoreStatics extends Model<IStoreDocument> {}

const storeSchema = new Schema<IStoreSchema>(
  {
    name: {
      type: String,
      required: true,
      min: 6,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    description: {
      type: String,
      required: true,
      min: 12,
      max: 100,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    methods: {
      async updateSelf(update: UpdateQuery<IStoreDocument>): Promise<UpdateWriteOpResult> {
        return StoreModel.updateOne({ _id: this._id }, update);
      },
    },
  },
);

export const StoreModel = model<IStoreMethods, IStoreStatics>('Store', storeSchema, 'Stores');
