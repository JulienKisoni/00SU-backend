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
    userId?: string;
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
    teamId: string;
    active: boolean;
    name: string;
    description: string;
    picture?: string;
    address: {
      line1: string;
      line2?: string;
      country: string;
      state: string;
      city: string;
    };
  }
  interface DeleteStore {
    storeId: string;
  }
  interface AddProductBody {
    name: string;
    quantity: number;
    description: string;
    minQuantity: number;
    picture?: string;
    unitPrice: number;
  }

  interface Body {
    login: LoginReq;
    refreshToken: {
      refreshToken: string;
    };
    cart: {
      updateCartItem: {
        quantity: number;
      };
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
        storeId: string;
      };
      updateOne: {
        items?: CartItem[];
      };
    };
    reports: {
      add: {
        name: string;
        description: string;
        storeId: string;
        orders: string[];
      };
      updateOne: {
        name?: string;
        description?: string;
      };
    };
    histories: {
      add: {
        quantity: number;
      };
      updateOne: {
        evolution: {
          date: string;
          dateKey: string;
          quantity: number;
        };
      };
    };
    graphics: {
      add: {
        productsIDs: string[];
        name: string;
        description: string;
      };
      updateOne: {
        name?: string;
        description?: string;
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
        picture?: string;
        address?: {
          line1: string;
          line2?: string;
          country: string;
          state: string;
          city: string;
        };
      };
      addStore: AddStore;
      deleteStore: DeleteStore;
      getOne: {
        storeId: string;
        teamId: string;
      };
    };
    users: {
      getOne: {
        userId: string;
      };
      getByTeam: {
        teamId: string;
      };
    };
    teams: {
      getOne: {
        teamId: string;
      };
    };
    products: {
      add: {
        body: AddProductBody | undefined;
        owner: string;
        storeId: string;
        teamId: string;
      };
      getByStoreId: {
        storeId: string;
        teamId: string;
      };
    };
    cart: {
      addCartItem: {
        body: {
          items: {
            productId: string;
            quantity: number;
          }[];
        };
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
    cart: {
      addCartItem: {
        cartId: string;
      };
      deleteOne: {
        cartItemId: string;
        cartId: string;
      };
    };
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
    reports: {
      getOne: {
        reportId: string;
      };
      deleteOne: {
        reportId: string;
      };
    };
    users: {
      getByTeam: {
        email?: string;
      };
    };
    graphics: {
      getOne: {
        graphicId: string;
      };
      deleteOne: {
        graphicId: string;
      };
      updateOne: {
        graphicId: string;
      };
    };
  }

  export interface Routes {
    body: Body;
    business: Business;
    params: QueryParams;
  }
}
