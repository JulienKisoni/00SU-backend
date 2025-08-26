import { RootFilterQuery, Schema, mongo } from 'mongoose';
import type { Request } from 'express';

import { GenericError } from '../middlewares/errors';

export enum USER_ROLES {
  clerk = 'clerk',
  manager = 'manager',
  admin = 'admin',
}

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

interface ExpToken {
  tokenId: string;
  expiryAt?: number;
}
export interface ITeamDocument extends Timestamps {
  _id: string;
  name: string;
  owner: string | Schema.Types.ObjectId;
  description?: string;
  userDetails?: Partial<IUserDocument>;
  __v?: number;
}
export interface ParamsDictionary {
  [key: string]: string;
}
export interface IUserProfile {
  role: USER_ROLES;
  username?: string;
  picture?: string;
}

export type DummyUser = Pick<IUserDocument, 'email' | 'password' | 'profile' | 'teamId'>;
export interface IUserDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  email: string;
  password: string;
  profile: IUserProfile;
  teamId: string | Schema.Types.ObjectId;
  storeIds?: (string | Schema.Types.ObjectId)[];
  storesDetails?: Partial<IStoreDocument>[];
  private?: {
    invalidToken: ExpToken;
  };
  __v?: number;
}

export interface IAddress {
  line1: string;
  line2?: string;
  country: string;
  state: string;
  city: string;
}

export interface IStoreDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  name: string;
  description: string;
  address: IAddress;
  owner: string | Schema.Types.ObjectId;
  teamId: string | Schema.Types.ObjectId;
  ownerDetails?: Partial<IUserDocument>;
  products: (string | Schema.Types.ObjectId)[];
  active: boolean;
  picture?: string;
  __v?: number;
}

export interface IProductDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  name: string;
  description: string;
  teamId: string | Schema.Types.ObjectId;
  storeId: string | Schema.Types.ObjectId;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  picture?: string;
  owner: string | Schema.Types.ObjectId;
  __v?: number;
}

export interface GeneralResponse<T> {
  error?: GenericError;
  data?: T;
}

export interface ExtendedProduct extends IProductDocument {
  qtyToAdd: number;
}

export interface ExtendedRequest<B, P extends ParamsDictionary> extends Request {
  body: B | undefined;
  user?: IUserDocument;
  isStoreOwner?: boolean;
  isTeamProduct?: boolean;
  isReviewOwner?: boolean;
  isTeamOrder?: boolean;
  isTeamReport?: boolean;
  isTeamOwner?: boolean;
  isTeamGraphic?: boolean;
  order?: IOrderDocument;
  report?: IReportDocument;
  graphic?: IGraphicDocument;
  hasAlreadyReviewedProduct?: boolean;
  storeId?: string;
  productId?: string;
  currentSession?: mongo.ClientSession;
  cart?: ICart;
  cartItem?: ICartItem;
  product?: IProductDocument;
  productsToAdd?: ExtendedProduct[];
  params: P;
}

export interface ICartItem extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  cartId: string | Schema.Types.ObjectId;
  productId: string | Schema.Types.ObjectId;
  quantity: number;
  totalPrice: number;
  __v?: number;
}

type Cart = Omit<ICart, 'items'>;

export interface CartDetails extends Cart {
  items: CartItemDetails[];
}
export interface CartItemDetails extends ICartItem {
  productDetails: IProductDocument;
}

export interface ICart extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  storeId: string | Schema.Types.ObjectId;
  userId: string | Schema.Types.ObjectId;
  totalPrices: number;
  items?: (string | Schema.Types.ObjectId)[] | CartItemDetails[];
  __v?: number;
}

export interface IReviewDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  title: string;
  content: string;
  stars: number;
  productId: string | Schema.Types.ObjectId;
  productDetails?: Partial<IProductDocument>;
  owner: string | Schema.Types.ObjectId;
  ownerDetails?: Partial<IUserDocument>;
  __v?: number;
}

export interface CartItem {
  productId: string | Schema.Types.ObjectId;
  quantity: number;
  productDetails?: Partial<IProductDocument>;
  totalPrice?: number;
}

export interface IOrderDocument extends Timestamps {
  __v?: number;
  _id: string | Schema.Types.ObjectId;
  items: CartItem[];
  totalPrice: number;
  orderedBy: string | Schema.Types.ObjectId;
  ownerDetails?: Partial<IUserDocument>;
  storeDetails?: Partial<IStoreDocument>;
  teamId: string | Schema.Types.ObjectId;
  storeId: string | Schema.Types.ObjectId;
  orderNumber: string;
}

export interface IReportDocument extends Timestamps {
  orders: (string | Schema.Types.ObjectId)[];
  name: string;
  description: string;
  teamId: string | Schema.Types.ObjectId;
  storeId: string | Schema.Types.ObjectId;
  generatedBy: string | Schema.Types.ObjectId;
  _id: string | Schema.Types.ObjectId;
  __v?: number;
  totalItems?: number;
  allOrderItems?: CartItem[];
  totalPrices?: number;
  ownerDetails?: Partial<IUserDocument>;
  storeDetails?: Partial<IStoreDocument>;
}

export interface IEvolution {
  date: string;
  dateKey: string; // will help group Evolution of different products by dateKey (groupBy)
  quantity: number;
  collectedBy: string | Schema.Types.ObjectId;
}

export interface IHistoryDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  __v?: number;
  productId: string | Schema.Types.ObjectId;
  productName: string;
  evolutions: IEvolution[];
  storeId: string | Schema.Types.ObjectId;
  teamId: string | Schema.Types.ObjectId;
}
export interface IGraphicDocument extends Timestamps {
  _id: string | Schema.Types.ObjectId;
  __v?: number;
  histories: (string | Schema.Types.ObjectId | IHistoryDocument)[];
  name: string;
  description: string;
  storeId: string | Schema.Types.ObjectId;
  teamId: string | Schema.Types.ObjectId;
  generatedBy: string | Schema.Types.ObjectId;
  ownerDetails?: Partial<IUserDocument>;
  storeDetails?: Partial<IStoreDocument>;
}

export type RetrieveOneFilters<T> = RootFilterQuery<T>;

export interface ITestUser {
  tokens?: API_TYPES.Tokens;
  token?: string;
}

export type MongoClientSession = mongo.ClientSession | undefined;

interface PermissionLevel {
  create: string;
  read: string;
  update: string;
  delete: string;
  all: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PERMISSIONS_KEYS = ['teams', 'users', 'stores', 'products', 'cartItems', 'carts', 'orders', 'reports', 'graphics', 'histories'] as const;

export type PermissionKey = (typeof PERMISSIONS_KEYS)[number];

export type UserPermissions = Record<PermissionKey, PermissionLevel>;
export type ROLES_PERMISSIONS = Record<USER_ROLES, string[]>;
export type PERMISSION_LEVEL_KEYS = keyof PermissionLevel;
