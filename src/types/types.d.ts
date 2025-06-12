namespace API_TYPES {
  type LoginReq = {
    email: string;
    password: string;
  };
  type Tokens = {
    accessToken?: string;
    refreshToken?: string;
  };
  class GenericError extends Error {
    statusCode: number;
    publicMessage: string;
  }
  export interface TokenResponse {
    error?: GenericError;
    tokens?: Tokens;
  }

  interface CartItem {
    productId: string;
    quantity: number;
  }

  enum ORDER_STATUS {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
  }

  interface AddStore {
    userId: string;
    active: boolean;
    name: string;
    description: string;
  }
  interface DeleteStore {
    storeId: string;
  }
  interface AddProductBody {
    name: string;
    quantity: number;
    description: string;
    minQuantity: number;
    active: boolean;
    unitPrice: number;
  }

  interface Body {
    login: LoginReq;
    refreshToken: {
      refreshToken: string;
    };
    products: {
      updateOne: {
        name: string;
        quantity: number;
        description: string;
        minQuantity: number;
        active: boolean;
        unitPrice: number;
      };
    };
    reviews: {
      add: {
        productId?: string;
        title?: string;
        content?: string;
        stars?: number;
        owner?: string;
      };
      deleteOne: {
        reviewId: string;
        productId?: string;
      };
      updateOne: {
        title?: string;
        content?: string;
        stars?: number;
      };
    };
    orders: {
      add: {
        items: CartItem[];
      };
      updateOne: {
        items?: CartItem[];
        status?: ORDER_STATUS;
      };
    };
  }

  interface Business {
    auth: {
      login: TokenResponse;
    };
    stores: {
      editStore: {
        active?: boolean;
        name?: string;
        description?: string;
      };
      addStore: AddStore;
      deleteStore: DeleteStore;
      getOne: {
        storeId: string;
      };
    };
    users: {
      getOne: {
        userId: string;
      };
    };
    products: {
      add: {
        body: AddProductBody | undefined;
        owner: string;
        storeId: string;
      };
      getByStoreId: {
        storeId: string;
      };
    };
    orders: {
      getUserOrders: {
        userId: string;
      };
    };
  }

  export interface DecodedToken {
    email: string;
    iat: number;
    exp: number;
    iss: string;
    sub: string;
    jti: string;
  }

  interface QueryParams {
    products: {
      deleteOne: {
        storeId: string;
        productId: string;
      };
      getOne: {
        productId: string;
      };
      updateOne: {
        productId: string;
      };
      getReviews: {
        productId: string;
      };
    };
    reviews: {
      getOne: {
        reviewId: string;
      };
      deleteOne: {
        reviewId: string;
      };
      updateOne: {
        reviewId: string;
      };
    };
    orders: {
      getOne: {
        orderId: string;
      };
      deleteOne: {
        orderId: string;
      };
    };
  }

  export interface Routes {
    body: Body;
    business: Business;
    params: QueryParams;
  }
}
