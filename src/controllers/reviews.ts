import { NextFunction, Response } from 'express';
import Joi, { LanguageMessages } from 'joi';

import { ExtendedRequest } from '../types/models';
import { regex } from '../helpers/constants';
import { handleError } from '../middlewares/errors';
import * as reviewBusiness from '../business/reviews';
import { HTTP_STATUS_CODES } from '../types/enums';

type AddReviewBody = API_TYPES.Routes['body']['reviews']['add'];
type AddReviewPayload = AddReviewBody | undefined;
export const addReview = async (req: ExtendedRequest<AddReviewBody>, res: Response, next: NextFunction) => {
  const ownerMessages: LanguageMessages = {
    'any.required': "Could not retreive your user's information",
    'string.pattern.base': 'Please provide a valid owner id',
  };
  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide a product id',
    'string.pattern.base': 'Please provide a valid product id',
  };
  const titleMessages: LanguageMessages = {
    'any.required': 'Please provide a review title',
  };
  const contentMessages: LanguageMessages = {
    'any.required': 'Please provide a review content',
    'string.min': 'The field content must have 12 characters minimum',
    'string.max': 'The field content must have 100 characters maximum',
  };
  const starsMessages: LanguageMessages = {
    'any.required': 'Please provide a review stars rate',
    'number.min': 'The stars field value cannot be bellow 0',
    'number.max': 'The stars field value cannot be above 5',
  };
  const session = req.currentSession;
  const schema = Joi.object<AddReviewPayload>({
    owner: Joi.string().regex(regex.mongoId).required().messages(ownerMessages),
    productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
    title: Joi.string().required().messages(titleMessages),
    content: Joi.string().max(100).min(12).required().messages(contentMessages),
    stars: Joi.number().max(5).min(0).required().messages(starsMessages),
  });

  const payload: AddReviewPayload = {
    owner: req.user?._id.toString(),
    ...req.body,
  };

  const { error, value } = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await reviewBusiness.addReview(value);
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.CREATED).json(data);
};

export const getAllReviews = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const { error, data } = await reviewBusiness.getAllReviews();
  const session = req.currentSession;
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type GetOneReviewParams = API_TYPES.Routes['params']['reviews']['getOne'];
export const getOneReview = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneReviewParams;

  const reviewIdMessages: LanguageMessages = {
    'any.required': 'Please provide the review id',
    'string.pattern.base': 'Please provide a valid review id',
  };

  const schema = Joi.object<GetOneReviewParams>({
    reviewId: Joi.string().regex(regex.mongoId).required().messages(reviewIdMessages),
  });

  const session = req.currentSession;

  const { error, value } = schema.validate(params);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error, data } = await reviewBusiness.getOneReview(value);
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }

  res.status(HTTP_STATUS_CODES.OK).json(data);
};

type DeleteOneReviewParams = API_TYPES.Routes['params']['reviews']['deleteOne'];
type DeleteOneReviewBody = API_TYPES.Routes['body']['reviews']['deleteOne'];
interface DeleteOneReviewPayload {
  body: DeleteOneReviewBody;
}
export const deleteOne = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as DeleteOneReviewParams;

  const reviewIdMessages: LanguageMessages = {
    'any.required': 'Please provide the review id',
    'string.pattern.base': 'Please provide a valid review id',
  };
  const productIdMessages: LanguageMessages = {
    'any.required': 'Could not find associated product id',
    'string.pattern.base': 'Associated product id seems not to be valid',
  };

  const session = req.currentSession;

  const schema = Joi.object<DeleteOneReviewPayload>({
    body: {
      reviewId: Joi.string().regex(regex.mongoId).required().messages(reviewIdMessages),
      productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
    },
  });

  const payload: DeleteOneReviewPayload = {
    body: {
      productId: req.productId,
      ...params,
    },
  };

  const { error, value } = schema.validate(payload);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error } = await reviewBusiness.deleteOne(value.body);
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }

  res.status(HTTP_STATUS_CODES.OK).json({});
};

type UpdateOneReviewBody = API_TYPES.Routes['body']['reviews']['updateOne'];
type UpdateOneReviewParams = API_TYPES.Routes['params']['reviews']['updateOne'];
interface UpdateOneReviewPayload {
  body?: UpdateOneReviewBody;
  params: UpdateOneReviewParams;
}
export const updateOne = async (req: ExtendedRequest<UpdateOneReviewBody>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as UpdateOneReviewParams;

  const reviewIdMessages: LanguageMessages = {
    'any.required': 'Please provide a review id',
    'string.pattern.base': 'Please provide a valid review id',
  };
  const contentMessages: LanguageMessages = {
    'string.min': 'The field content must have 12 characters minimum',
    'string.max': 'The field content must have 100 characters maximum',
  };
  const starsMessages: LanguageMessages = {
    'number.min': 'The stars field value cannot be bellow 0',
    'number.max': 'The stars field value cannot be above 5',
  };

  const schema = Joi.object<UpdateOneReviewPayload>({
    params: {
      reviewId: Joi.string().regex(regex.mongoId).required().messages(reviewIdMessages),
    },
    body: {
      title: Joi.string(),
      content: Joi.string().max(100).min(12).messages(contentMessages),
      stars: Joi.number().max(5).min(0).messages(starsMessages),
    },
  });

  const payload: UpdateOneReviewPayload = {
    params,
    body: req.body,
  };

  const session = req.currentSession;

  const { error, value } = schema.validate(payload, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { error: _error } = await reviewBusiness.updateOne({ reviewId: value.params.reviewId, body: value.body });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type GetProductReviewsParams = API_TYPES.Routes['params']['products']['getReviews'];
export const getProductReviews = async (req: ExtendedRequest<undefined>, res: Response, next: NextFunction) => {
  const productIdMessages: LanguageMessages = {
    'any.required': 'Please provide a review id',
    'string.pattern.base': 'Please provide a valid review id',
  };

  const params = req.params as unknown as GetProductReviewsParams;

  const schema = Joi.object<GetProductReviewsParams>({
    productId: Joi.string().regex(regex.mongoId).required().messages(productIdMessages),
  });

  const session = req.currentSession;

  const { error, value } = schema.validate(params);
  if (error) {
    return handleError({ error, next, currentSession: session });
  }

  const { data } = await reviewBusiness.getProductReviews(value);

  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json(data);
};
