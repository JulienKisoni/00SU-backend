import { model, Model, Schema } from 'mongoose';

import { IReportDocument } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IReportMethods extends IReportDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IReportStatics extends Model<IReportDocument> {}

const reportSchema = new Schema<IReportDocument>(
  {
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
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
    generatedBy: {
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
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ storeId: 1 });
reportSchema.index({ teamId: 1 });
reportSchema.index({ _id: 1, teamId: 1 });

export const ReportModel = model<IReportMethods, IReportStatics>('Report', reportSchema, 'Reports');
