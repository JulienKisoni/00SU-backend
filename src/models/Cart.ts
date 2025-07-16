import { model, Model, Schema } from 'mongoose';
import { ICart } from '../types/models';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type ICartSchema = Omit<ICart, 'reviewDetails'>;
export interface ICartMethods extends ICart {
  addReview?: (reviewId: string) => Promise<ICart | null>;
  removeReview?: (reviewId: string) => Promise<ICart | null>;
}

export interface ICartStatics extends Model<ICart> {
  searchByKey: (key: 'name', value: string) => Promise<{ carts?: ICartMethods[]; error?: GenericError }>;
}

const cartSchema = new Schema<ICartSchema>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    totalPrices: {
      type: Number,
      required: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CartItem',
      },
    ],
  },
  {
    timestamps: true,
    methods: {
      async addReview(reviewId: string): Promise<ICartMethods | null> {
        return CartModel.findByIdAndUpdate(this._id, { $push: { reviews: reviewId } }).exec();
      },
      async removeReview(reviewId: string): Promise<ICartMethods | null> {
        return CartModel.findByIdAndUpdate(this._id, { $pull: { reviews: reviewId } }).exec();
      },
    },
    statics: {
      async searchByKey(key: 'name', value: string): Promise<{ carts?: ICartMethods[]; error?: GenericError }> {
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

        const carts = await this.find(query).exec();
        return { carts };
      },
    },
  },
);

cartSchema.index({ storeId: 1 });
cartSchema.index({ userId: 1 });
cartSchema.index({ storeId: 1, userId: 1 });
cartSchema.index({ _id: 1, storeId: 1 });

export const CartModel = model<ICartMethods, ICartStatics>('Cart', cartSchema, 'Carts');
