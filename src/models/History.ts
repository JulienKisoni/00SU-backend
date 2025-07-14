import { model, Model, Schema } from 'mongoose';

import { IEvolution, IHistoryDocument } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IHistoryMethods extends IHistoryDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IHistoryStatics extends Model<IHistoryDocument> {}

const evolutionSchema = new Schema<IEvolution>(
  {
    date: {
      type: String,
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false },
);

const historySchema = new Schema<IHistoryDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: {
      type: String,
      required: true,
      min: 3,
      max: 200,
    },
    evolutions: [{ type: evolutionSchema }],
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
  },
  {
    timestamps: true,
  },
);

historySchema.index({ storeId: 1 });
historySchema.index({ teamId: 1 });
historySchema.index({ productId: 1 });
historySchema.index({ _id: 1, teamId: 1 });
historySchema.index({ productId: 1, storeId: 1, teamId: 1 });

export const HistoryModel = model<IHistoryMethods, IHistoryStatics>('History', historySchema, 'Histories');
