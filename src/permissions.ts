import { ROLES_PERMISSIONS, UserPermissions } from './types/models';

const permissions: UserPermissions = {
  teams: {
    create: 'teams.create',
    read: 'teams.read',
    update: 'teams.update',
    delete: 'teams.delete',
    all: 'teams.*',
  },
  users: {
    create: 'users.create',
    read: 'users.read',
    update: 'users.update',
    delete: 'users.delete',
    all: 'users.*',
  },
  stores: {
    create: 'stores.create',
    read: 'stores.read',
    update: 'stores.update',
    delete: 'stores.delete',
    all: 'stores.*',
  },
  products: {
    create: 'products.create',
    read: 'products.read',
    update: 'products.update',
    delete: 'products.delete',
    all: 'products.*',
  },
  cartItems: {
    create: 'cartItems.create',
    read: 'cartItems.read',
    update: 'cartItems.update',
    delete: 'cartItems.delete',
    all: 'cartItems.*',
  },
  carts: {
    create: 'carts.create',
    read: 'carts.read',
    update: 'carts.update',
    delete: 'carts.delete',
    all: 'carts.*',
  },
  orders: {
    create: 'orders.create',
    read: 'orders.read',
    update: 'orders.update',
    delete: 'orders.delete',
    all: 'orders.*',
  },
  reports: {
    create: 'reports.create',
    read: 'reports.read',
    update: 'reports.update',
    delete: 'reports.delete',
    all: 'reports.*',
  },
  graphics: {
    create: 'graphics.create',
    read: 'graphics.read',
    update: 'graphics.update',
    delete: 'graphics.delete',
    all: 'graphics.*',
  },
  histories: {
    create: 'histories.create',
    read: 'histories.read',
    update: 'histories.update',
    delete: 'histories.delete',
    all: 'histories.*',
  },
};

export const roleActions: ROLES_PERMISSIONS = {
  admin: [permissions.teams.all, permissions.users.all],
  manager: [permissions.users.all],
  clerk: [permissions.users.all],
};
