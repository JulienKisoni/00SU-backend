import { model, Model, Schema } from 'mongoose';

import { IOrderDocument } from '../types/models';
import { ORDER_STATUS } from '../types/enums';

export interface IOrderMethods extends IOrderDocument {}

export interface IOrderStatics extends Model<IOrderDocument> {}

const orderSchema = new Schema<IOrderDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: false,
      enum: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PENDING],
      default: ORDER_STATUS.PENDING,
    },
    items: [
      {
        quantity: {
          type: Number,
          required: true,
        },
        productId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const OrderModel = model<IOrderMethods, IOrderStatics>('Order', orderSchema, 'Orders');
