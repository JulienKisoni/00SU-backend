import { model, Model, Schema } from 'mongoose';
import { ICartItem } from '../types/models';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type ICartItemSchema = Omit<ICartItem, 'reviewDetails'>;
export interface ICartItemMethods extends ICartItem {
  addReview?: (reviewId: string) => Promise<ICartItem | null>;
  removeReview?: (reviewId: string) => Promise<ICartItem | null>;
}

export interface ICartItemStatics extends Model<ICartItem> {
  searchByKey: (key: 'name', value: string) => Promise<{ products?: ICartItemMethods[]; error?: GenericError }>;
}

const cartItemSchema = new Schema<ICartItemSchema>(
  {
    cartId: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    methods: {
      async addReview(reviewId: string): Promise<ICartItemMethods | null> {
        return CartItemModel.findByIdAndUpdate(this._id, { $push: { reviews: reviewId } }).exec();
      },
      async removeReview(reviewId: string): Promise<ICartItemMethods | null> {
        return CartItemModel.findByIdAndUpdate(this._id, { $pull: { reviews: reviewId } }).exec();
      },
    },
    statics: {
      async searchByKey(key: 'name', value: string): Promise<{ products?: ICartItemMethods[]; error?: GenericError }> {
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

cartItemSchema.index({ productId: 1 });
cartItemSchema.index({ cartId: 1 });

export const CartItemModel = model<ICartItemMethods, ICartItemStatics>('CartItem', cartItemSchema, 'CartItems');
