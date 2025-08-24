import { model, Model, Schema } from 'mongoose';

import { CartItem, IOrderDocument, IProductDocument } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IOrderMethods extends IOrderDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IOrderStatics extends Model<IOrderDocument> {}

const productDetailsSchema = new Schema<Partial<IProductDocument>>(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    unitPrice: {
      type: Number,
    },
    picture: {
      type: String,
    },
  },
  { _id: false },
);

const orderItemSchema = new Schema<CartItem>(
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
    productDetails: {
      type: productDetailsSchema,
    },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
    },
    orderedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Team',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Store',
    },
    orderNumber: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ storeId: 1 });
orderSchema.index({ teamId: 1 });
orderSchema.index({ teamId: 1, storeId: 1 });
orderSchema.index({ _id: 1, teamId: 1, storeId: 1 });
orderSchema.index({ orderNumber: 1 });

export const OrderModel = model<IOrderMethods, IOrderStatics>('Order', orderSchema, 'Orders');
