import { ExtendedProduct, ICart } from '../../src/types/models';
import { addProducts, createCart } from '../../src/business/cart';

interface CreateCartPayload {
  storeId: string;
  userId: string;
  products: ExtendedProduct[];
}
export const injectCart = async ({ storeId, userId, products }: CreateCartPayload): Promise<ICart | null | undefined> => {
  const { data } = await createCart({ storeId, userId });
  const cartId = data?._id?.toString() || '';
  const { data: cart } = await addProducts({ products, cartId });
  return cart;
};
