import { model, Model, Schema } from 'mongoose';
import { IProductDocument } from '../types/models';

type IProductSchema = Omit<IProductDocument, 'reviewDetails'>;
export interface IProductMethods extends IProductDocument {
  addReview?: (reviewId: string) => Promise<IProductDocument | null>;
  removeReview?: (reviewId: string) => Promise<IProductDocument | null>;
}

export interface IProductStatics extends Model<IProductDocument> {}

const productSchema = new Schema<IProductSchema>(
  {
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Store',
    },
    description: {
      type: String,
      required: true,
      min: 12,
      max: 100,
    },
    minQuantity: {
      type: Number,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    active: {
      type: Boolean,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
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
  },
);

export const ProductModel = model<IProductMethods, IProductStatics>('Product', productSchema, 'Products');
