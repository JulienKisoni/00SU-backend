import { Schema, model, Model, UpdateQuery, UpdateWriteOpResult } from 'mongoose';
import { verify } from 'jsonwebtoken';

import { IUserDocument } from '../types/models';
import { compareValues } from '../utils/hash';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

type IUserSchema = Omit<IUserDocument, 'storesDetails'>;

export interface IUserMethods extends IUserDocument {
  comparePassword?: (password: string) => Promise<{ areEqual: boolean }>;
  checkValidToken?: (decodedToken: API_TYPES.DecodedToken) => boolean;
  updateSelf?: (payload: UpdateQuery<IUserDocument>) => Promise<void>;
}

export interface IUserStatics extends Model<IUserMethods> {
  findByEmail(email: string): Promise<IUserMethods | null>;
  findByRefreshToken(refreshToken: string): Promise<{ user?: IUserMethods; error?: GenericError }>;
  searchByKey(key: 'email', value: string): Promise<{ users?: IUserMethods[]; error?: GenericError }>;
}

const userSchema = new Schema<IUserSchema>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      max: 320,
      min: 5,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 128,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    storeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],
    profile: {
      role: {
        type: String,
        require: true,
        min: 5,
        max: 13,
      },
      username: {
        type: String,
        required: false,
        min: 6,
        max: 60,
      },
      picture: {
        type: String,
        required: false,
        min: 150,
        max: 2000,
      },
    },
    private: {
      invalidToken: {
        tokenId: {
          type: String,
        },
        expiryAt: {
          type: Number,
        },
      },
    },
  },
  {
    timestamps: true,
    statics: {
      async findByEmail(email: string): Promise<IUserMethods | null> {
        const user = await this.findOne<IUserMethods>({ email }).exec();
        return user;
      },
      async findByRefreshToken(refreshToken: string): Promise<{ user?: IUserMethods | null; error?: GenericError }> {
        const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
        if (!REFRESH_TOKEN_SECRET) {
          const error = createError({
            statusCode: HTTP_STATUS_CODES.NOT_FOUND,
            message: 'Missing REFRESH_TOKEN_SECRET env variable',
            publicMessage: 'Something went wrong',
          });
          return { error };
        }
        try {
          const decoded = verify(refreshToken, REFRESH_TOKEN_SECRET);
          const decodedToken = decoded as API_TYPES.DecodedToken;
          const user = await this.findById<IUserMethods>(decodedToken.sub).exec();
          return { user };
        } catch (error) {
          if (error.message.includes('jwt expired')) {
            const error = createError({ statusCode: HTTP_STATUS_CODES.UNAUTHORIZED, message: 'Token expired', publicMessage: 'Please re-login' });
            return { error };
          }
          const err = createError({
            statusCode: HTTP_STATUS_CODES.STH_WENT_WRONG,
            message: error.stack || error.message,
            publicMessage: 'Something went wrong',
          });
          return { error: err };
        }
      },
      async searchByKey(key: 'email', value: string): Promise<{ users?: IUserMethods[]; error?: GenericError }> {
        const allowedKeys = ['email'];
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

        const users = await this.find(query).exec();
        return { users };
      },
    },
    methods: {
      async comparePassword(plainPassword: string): Promise<{ areEqual: boolean }> {
        return await compareValues({ plainText: plainPassword, encryptedText: this.password });
      },
      checkValidToken(decodedToken: API_TYPES.DecodedToken): boolean {
        const invalidToken = this.private?.invalidToken;
        const expiryAt: number = invalidToken?.expiryAt ? invalidToken.expiryAt / 1000 : 0;
        return Boolean(invalidToken?.tokenId === decodedToken.jti && expiryAt > 0 && expiryAt < decodedToken.exp);
      },
      async updateSelf(update: UpdateQuery<IUserDocument>): Promise<UpdateWriteOpResult> {
        return UserModel.updateOne({ _id: this._id }, update).exec();
      },
    },
  },
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1, password: 1 });
userSchema.index({ teamId: 1 });

export const UserModel = model<IUserMethods, IUserStatics>('User', userSchema, 'Users');
