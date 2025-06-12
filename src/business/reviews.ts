import isEmpty from 'lodash.isempty';
import omit from 'lodash.omit';

import { GeneralResponse, IProductDocument, IReviewDocument, IUserDocument, RetreiveOneFilters } from '../types/models';
import { createError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { IProductMethods, ProductModel } from '../models/product';
import { ReviewModel } from '../models/review';
import { transformProduct } from './products';
import { transformUser } from './users';

export const retrieveReview = async (filters: RetreiveOneFilters<IReviewDocument>): Promise<IReviewDocument | null> => {
  const review = (await ReviewModel.findOne(filters).populate({ path: 'productId' }).populate({ path: 'owner' }).lean().exec()) as IReviewDocument;
  if (!review || review === null) {
    return null;
  }
  const product = review.productId as unknown as IProductDocument;
  const productId = product._id.toString();
  const productDetails = transformProduct({ product, excludedFields: ['__v'] });
  review.productId = productId;
  review.productDetails = productDetails;

  const ownerDetails = review.owner as unknown as IUserDocument;
  review.ownerDetails = transformUser({ user: ownerDetails, excludedFields: ['__v', 'private', 'password'] });
  review.owner = ownerDetails._id.toString();

  return review;
};

type TransformKeys = keyof IReviewDocument;
interface ITransformProduct {
  excludedFields: TransformKeys[];
  review: IReviewDocument;
}
export const transformReview = ({ review, excludedFields }: ITransformProduct): Partial<IReviewDocument> => {
  return omit(review, excludedFields);
};

type AddReviewBody = API_TYPES.Routes['body']['reviews']['add'];
type AddReviewResponse = Promise<GeneralResponse<{ reviewId: string }>>;
type AddReviewPayload = AddReviewBody | undefined;

export const addReview = async (payload: AddReviewPayload): AddReviewResponse => {
  if (!payload || isEmpty(payload)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No payload associated with the request',
      publicMessage: 'Please provide valid fields',
    });
    return { error };
  }

  const { productId } = payload;

  const product = await ProductModel.findById<IProductMethods>(productId).exec();
  if (!product?._id || !product.addReview) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Product (${productId}) not found`,
      publicMessage: 'This product does not exist',
    });
    return { error };
  }
  const review = await ReviewModel.create(payload);
  const reviewId = review._id.toString();
  await product.addReview(reviewId);
  return { data: { reviewId } };
};

type GetAllReviewsResponse = Promise<GeneralResponse<{ reviews: Partial<IReviewDocument>[] }>>;
export const getAllReviews = async (): GetAllReviewsResponse => {
  const results = await ReviewModel.find({}).lean().exec();
  const reviews = results.map((review) => transformReview({ review, excludedFields: ['__v'] }));
  return { error: undefined, data: { reviews } };
};

type GetOneReviewParams = API_TYPES.Routes['params']['reviews']['getOne'];
type GetOneReviewResponse = Promise<GeneralResponse<{ review: Partial<IReviewDocument> }>>;
export const getOneReview = async (params: GetOneReviewParams): GetOneReviewResponse => {
  const { reviewId } = params;
  const review = await retrieveReview({ _id: reviewId });
  if (!review?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find review (${reviewId})`,
      publicMessage: 'This review does not exist',
    });
    return { error };
  }
  const transformed = transformReview({ review, excludedFields: ['__v'] });
  return { data: { review: transformed } };
};

type DeleteOneReviewBody = API_TYPES.Routes['body']['reviews']['deleteOne'];
type DeleteOneReviewResponse = Promise<GeneralResponse<undefined>>;
export const deleteOne = async (body: DeleteOneReviewBody): DeleteOneReviewResponse => {
  const { reviewId, productId } = body;
  const product = await ProductModel.findById<IProductMethods>(productId).exec();
  if (!product?._id || !product.removeReview) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find product (${reviewId})`,
      publicMessage: 'Could not find the product associated with this review',
    });
    return { error };
  }
  const review = await ReviewModel.findByIdAndDelete(reviewId).exec();
  if (!review?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Could not find review (${reviewId})`,
      publicMessage: 'This review does not exist',
    });
    return { error };
  }

  await product.removeReview(reviewId);

  return { error: undefined };
};

type UpdateOneReviewBody = API_TYPES.Routes['body']['reviews']['updateOne'];
interface UpdateOneReviewPayload {
  body?: UpdateOneReviewBody;
  reviewId: string;
}
type UpdateOneReviewResponse = Promise<GeneralResponse<undefined>>;
export const updateOne = async ({ reviewId, body }: UpdateOneReviewPayload): UpdateOneReviewResponse => {
  if (!body || isEmpty(body)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No associated body with the request',
      publicMessage: 'Please provide valid fields to update',
    });
    return { error };
  }

  const review = await ReviewModel.findByIdAndUpdate(reviewId, body).exec();

  if (!review?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `This review (${reviewId}) does not exist`,
      publicMessage: 'Could not found this review',
    });
    return { error };
  }

  return { error: undefined, data: undefined };
};

type GetProductReviewsParams = API_TYPES.Routes['params']['products']['getReviews'];
type GetProductReviewsResponse = Promise<GeneralResponse<{ reviews: Partial<IReviewDocument>[] }>>;
export const getProductReviews = async (params: GetProductReviewsParams): GetProductReviewsResponse => {
  const { productId } = params;
  const results = await ReviewModel.find({ productId }).lean().exec();
  const reviews = results.map((review) => transformReview({ review, excludedFields: ['__v'] }));
  return { error: undefined, data: { reviews } };
};
