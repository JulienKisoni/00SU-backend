import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import { ExtendedRequest } from '../types/models';

export const handleTransaction = async (req: ExtendedRequest<unknown>, _res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  req.currentSession = session;
  req.currentSession.startTransaction();
  next();
};
