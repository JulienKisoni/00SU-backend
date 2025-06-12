import { Model, Schema, model } from 'mongoose';
import { IReviewDocument } from '../types/models';

type ReviewSchema = Omit<IReviewDocument, 'productDetails' | 'ownerDetails'>;
interface IReviewMethods extends ReviewSchema {}

interface IReviewStatics extends Model<ReviewSchema> {}

const reviewSchema = new Schema<ReviewSchema>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      min: 12,
      max: 100,
    },
    stars: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

export const ReviewModel = model<IReviewMethods, IReviewStatics>('Review', reviewSchema, 'Reviews');
