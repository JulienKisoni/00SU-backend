import { model, Model, Schema } from 'mongoose';

import { IGraphicDocument } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGraphicMethods extends IGraphicDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGraphicStatics extends Model<IGraphicDocument> {}

const graphicSchema = new Schema<IGraphicDocument>(
  {
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
    histories: [{ type: Schema.Types.ObjectId, ref: 'History' }],
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
    generatedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

graphicSchema.index({ storeId: 1 });
graphicSchema.index({ teamId: 1 });
graphicSchema.index({ teamId: 1, storeId: 1 });
graphicSchema.index({ generatedBy: 1 });
graphicSchema.index({ _id: 1, teamId: 1 });

export const GraphicModel = model<IGraphicMethods, IGraphicStatics>('Graphic', graphicSchema, 'Graphics');
