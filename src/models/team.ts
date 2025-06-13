import { Schema, model, Model, UpdateWriteOpResult, UpdateQuery } from 'mongoose';

import { ITeamDocument } from '../types/models';

type ITeamSchema = Omit<ITeamDocument, 'userDetails'>;

export interface ITeamMethods extends ITeamDocument {
  setOwner?: (userId: string) => Promise<UpdateWriteOpResult>;
  updateSelf?: (payload: UpdateQuery<ITeamDocument>) => Promise<UpdateWriteOpResult>;
}

export interface ITeamStatics extends Model<ITeamMethods> {}

const teamSchema = new Schema<ITeamSchema>(
  {
    name: {
      type: String,
      required: true,
      min: 3,
      max: 100,
      unique: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    description: {
      type: String,
      required: false,
      min: 6,
      max: 500,
    },
  },
  {
    timestamps: true,
    statics: {},
    methods: {
      async setOwner(userId: string): Promise<UpdateWriteOpResult> {
        return this.updateOne({ owner: userId }).exec();
      },
      async updateSelf(update: UpdateQuery<ITeamDocument>): Promise<UpdateWriteOpResult> {
        return TeamModel.updateOne({ _id: this._id }, update).exec();
      },
    },
  },
);

teamSchema.index({ name: 1 });
teamSchema.index({ owner: 1 });

export const TeamModel = model<ITeamMethods, ITeamStatics>('Team', teamSchema, 'Teams');
