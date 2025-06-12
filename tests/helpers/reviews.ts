import DummyReviews from '../../mocks/reviews.json';
import { IProductMethods } from '../../src/models/product';
import { IReviewDocument, IUserDocument } from '../../src/types/models';
import { ReviewModel } from '../../src/models/review';

type CreateReviewDoc = Omit<IReviewDocument, '_id' | 'createdAt' | 'updatedAt'>;

export const injectReviews = async (product: IProductMethods, user: IUserDocument) => {
  const reviews = await createProductReviews(product, user);
  return reviews;
};

export const createProductReviews = async (product: IProductMethods, user: IUserDocument) => {
  const promises = DummyReviews.map((review) => {
    return createReview({ doc: review, product, user });
  });
  const reviews = await Promise.all(promises);
  return reviews;
};

interface ICreateStore {
  doc: CreateReviewDoc;
  product: IProductMethods;
  user: IUserDocument;
}

export const createReview = async ({ doc, product, user }: ICreateStore) => {
  if (product.addReview) {
    doc.owner = user._id;
    doc.productId = product._id;
    const review = await ReviewModel.create(doc);
    await product.addReview(review._id.toString());
    return review;
  } else {
    return undefined;
  }
};
