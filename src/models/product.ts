import { model, Model, Schema } from 'mongoose';
import { IProductDocument } from '../types/models';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type IProductSchema = Omit<IProductDocument, 'reviewDetails'>;
export interface IProductMethods extends IProductDocument {
  addReview?: (reviewId: string) => Promise<IProductDocument | null>;
  removeReview?: (reviewId: string) => Promise<IProductDocument | null>;
}

export interface IProductStatics extends Model<IProductDocument> {
  searchByKey: (key: 'name', value: string) => Promise<{ products?: IProductMethods[]; error?: GenericError }>;
}

const productSchema = new Schema<IProductSchema>(
  {
    name: {
      type: String,
      required: true,
      min: 3,
      max: 200,
    },
    description: {
      type: String,
      required: true,
      min: 6,
      max: 500,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Store',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    minQuantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    picture: {
      type: String,
      min: 150,
      max: 2000,
    },
  },
  {
    timestamps: true,
    methods: {
      async addReview(reviewId: string): Promise<IProductMethods | null> {
        return ProductModel.findByIdAndUpdate(this._id, { $push: { reviews: reviewId } }).exec();
      },
      async removeReview(reviewId: string): Promise<IProductMethods | null> {
        return ProductModel.findByIdAndUpdate(this._id, { $pull: { reviews: reviewId } }).exec();
      },
    },
    statics: {
      async searchByKey(key: 'name', value: string): Promise<{ products?: IProductMethods[]; error?: GenericError }> {
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

        const products = await this.find(query).exec();
        return { products };
      },
    },
  },
);

productSchema.index({ teamId: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ owner: 1 });
productSchema.index({ name: 1 });
productSchema.index({ storeId: 1, active: 1, teamId: 1 });
productSchema.index({ _id: 1, storeId: 1 });

export const ProductModel = model<IProductMethods, IProductStatics>('Product', productSchema, 'Products');
